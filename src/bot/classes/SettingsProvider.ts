import { Collection } from 'discord.js';
import { connect, Model } from 'mongoose';
import { Logger } from 'winston';
import ChildModel, { Child } from '../models/Child';
import GiveawayModel, { Giveaway } from '../models/Giveaway';
import ReactionModel, { Reaction } from '../models/Reaction';
import ReminderModel, { Reminder } from '../models/Reminder';
import TagModel, { Tag } from '../models/Tag';
import ToolClient from './ToolClient';

let i = 0;

export interface Models {
	[key: string]: Model<any>;
}
export type Types = 'child' | 'giveaway' | 'reaction' | 'reminder' | 'tag';
export type ModelTypes = Child | Giveaway | Reaction | Reminder | Tag;

const MODELS: Models = {
	child: ChildModel,
	reaction: ReactionModel,
	reminder: ReminderModel,
	giveaway: GiveawayModel,
	tag: TagModel,
};

export default class SettingsProvider {
	public client: ToolClient;

	public child: Collection<string, Child> = new Collection();
	public giveaway: Collection<string, Giveaway> = new Collection();
	public reaction: Collection<string, Reaction> = new Collection();
	public reminder: Collection<string, Reminder> = new Collection();
	public tag: Collection<string, Tag> = new Collection();

	public ChildModel: Model<Child> = ChildModel;
	public GiveawayModel: Model<Giveaway> = GiveawayModel;
	public ReactionModel: Model<Reaction> = ReactionModel;
	public ReminderModel: Model<Reminder> = ReminderModel;
	public TagModel: Model<Tag> = TagModel;

	public constructor(client: ToolClient) {
		/* our cient model */
		this.client = client;
	}

	/* creates new model with provided data */
	public async new(type: Types, data: object): Promise<ModelTypes> {
		const model = MODELS[type];
		const doc = new model(data);
		this[type].set(doc.id, doc);
		await doc.save();
		this.client.logger.verbose(`[DATABASE] Made new ${model.modelName} document with ID of ${doc._id}.`);
		return doc;
	}

	/* setting options of an existing document */
	public async set(type: Types, data: object, key: object): Promise<ModelTypes | null> {
		const model = MODELS[type];
		const doc = await model.findOneAndUpdate(data, { $set: key }, { new: true });
		if (!doc) return null;
		this.client.logger.verbose(`[DATABASE] Edited ${model.modelName} document with ID of ${doc._id}.`);
		this[type].set(doc.id, doc);
		return doc;
	} //

	/* removes a document with the provider query */ public async remove(
		type: Types,
		data: any,
	): Promise<ModelTypes | null> {
		const model = MODELS[type];
		const doc = await model.findOneAndDelete(data);
		if (!doc) return null;
		this[type].delete(doc._id);
		this.client.logger.verbose(`[DATABASE] Deleted ${model.modelName} document with ID of ${doc._id}.`);
		return doc;
	}

	/* caching documents */
	public async cacheAll(): Promise<number> {
		const map = Object.entries(MODELS);
		for (const [type, model] of map) await this._cache(type as any, model);
		return i;
	}

	private async _cache(type: Types, model: Model<any>): Promise<any> {
		const collection = this[type];
		const items = await model.find();
		for (const i of items) collection.set(i.id, i);
		return (i += items.length);
	}

	/* connecting */
	private async _connect(url: string | undefined): Promise<Logger | number> {
		if (url) {
			const start = Date.now();
			try {
				this.client.logger.verbose('[DATABSE]: Connecting to MongoDB...');
				await connect(url, {
					useCreateIndex: true,
					useNewUrlParser: true,
					useFindAndModify: false,
					useUnifiedTopology: false,
					sslValidate: false,
				});
			} catch (err) {
				this.client.logger.error(`[DATABASE] Error when connecting to MongoDB:\n${err.stack}`);
				process.exit(1);
			}
			return this.client.logger.info(`[DATABASE] Connected to MongoDB in ${Date.now() - start}ms.`);
		}
		this.client.logger.error('[DATABASE] No MongoDB url provided!');
		return process.exit(1);
	}

	public async init(): Promise<Logger> {
		await this._connect(process.env.MONGO);
		await this.cacheAll();
		return this.client.logger.info(`[DATABASE] [LAUNCHED] Successfully connected and cached ${i} documents.`);
	}
}

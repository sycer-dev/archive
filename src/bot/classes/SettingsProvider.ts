import PatrolClient from './CartClient';
import { Collection } from 'discord.js';
import { Model, connect } from 'mongoose';
import ClientModel, { Client } from '../models/Client';
import GuildModel, { Guild } from '../models/Guild';
import { Logger } from 'winston';

let i = 0;

export default class SettingsProvider {
	public clients: Collection<string, Client> = new Collection();
	public guilds: Collection<string, Guild> = new Collection();

	public ClientModel: Model<Client> = ClientModel;
	public GuildModel: Model<Guild> = GuildModel

	public constructor(public readonly client: PatrolClient) {}

	/* creates new model with provided data */
	public async new(type: 'client' | 'guild', data: object): Promise<Client | Guild | null> {
		if (type === 'guild') {
			const doc = new GuildModel(data);
			this.guilds.set(`${doc.id}`, doc);
			return doc.save();
		} else if (type === 'client') {
			const doc = new ClientModel(data);
			this.clients.set(`${doc.id}`, doc);
			return doc.save();
		}
		return null;
	}

	/* setting options of an existing document */
	public async set(type: 'client' | 'guild', data: object, key: object): Promise<Client | Guild | null> {
		if (type === 'guild') {
			const doc = await this.GuildModel.findOneAndUpdate(data, { $set: key }, { 'new': true });
			if (!doc) return null;
			this.guilds.set(`${doc.id}`, doc!);
			return doc;
		} else if (type === 'client') {
			const doc = await this.ClientModel.findOneAndUpdate(data, { $set: key }, { 'new': true });
			if (!doc) return null;
			this.clients.set(`${doc.id}`, doc!);
			return doc;
		}
		return null;
	}

	/* removes a document with the provider query */
	public async remove(type: 'client' | 'guild', data: any): Promise<Client | Guild | null> {
		if (type === 'guild') {
			this.guilds.delete(`${data.id}`);
			return this.GuildModel.findOneAndDelete(data);
		} else if (type === 'client') {
			this.clients.delete(`${data.id}`);
			return this.ClientModel.findOneAndDelete(data);
		}
		return null;
	}

	/* caching documents */
	public async cacheClients(): Promise<Logger> {
		const clients = await this.ClientModel.find();
		for (const c of clients) {
			this.clients.set(`${c.id}`, c);
			i++;
		}
		return this.client.logger.info(`[SETTINGS] Successfully cached ${clients.length} Client documents.`);
	}

	public async cacheGuilds(): Promise<Logger> {
		const guilds = await this.GuildModel.find();
		for (const g of guilds) {
			this.guilds.set(`${g.id}`, g);
			i++;
		}
		return this.client.logger.info(`[SETTINGS] Successfully cached ${guilds.length} Guild documents.`);
	}

	/* connecting */
	private async connect(url: undefined | string): Promise<Logger | number> {
		if (url) {
			const start = Date.now();
			try {
				await connect(url, {
					useCreateIndex: true,
					useNewUrlParser: true,
					useFindAndModify: false
				});
			} catch (err) {
				this.client.logger.error(`[SETTINGS] Error when connecting to MongoDB:\n${err.stack}`);
			}
			return this.client.logger.info(`[SETTINGS] Connected to MongoDB in ${Date.now() - start}ms.`);
		}
		this.client.logger.error('[SETTINGS] No MongoDB url provided!');
		return process.exit(1);
	}

	public async init(): Promise<Logger> {
		await this.connect(process.env.MONGO);
		await this.cacheClients();
		await this.cacheGuilds();
		return this.client.logger.info(`[SETTINGS] Successfully cached ${i} documents.`);
	}
}

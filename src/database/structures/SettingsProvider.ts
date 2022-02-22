import { Collection } from 'discord.js';
import { connect, Model, connection, Connection, Document } from 'mongoose';
import ClientModel, { Client } from '../models/Client';
import { Logger } from 'winston';
import { MONGO_EVENTS } from '../util/constants';
import PostModel, { Post } from '../models/Post';
import SuccessClient from '../../bot/client/SuccessClient';

let i = 0;

/**
 * The key, model and cached collection of a database model.
 * @interface
 */
interface Combo {
	key: string;
	model: Model<any>;
	cache?: Collection<string, any>;
	shouldCache: boolean;
}

/**
 * The Settings Provider that handles all database reads and rights.
 * @private
 */
export default class SettingsProvider {
	protected readonly client: SuccessClient;

	protected readonly clients: Collection<string, Client> = new Collection();
	// protected readonly posts: Collection<string, Post> = new Collection();

	protected readonly ClientModel = ClientModel;
	protected readonly PostModel = PostModel;

	/**
	 *
	 * @param {SuccessClient} client - The extended Akairo Client
	 */
	public constructor(client: SuccessClient) {
		this.client = client;
	}

	/**
	 * Retuns all the collection caches.
	 */
	public get cache() {
		return {
			clients: this.clients,
			// posts: this.posts,
		};
	}

	/**
	 * Returns the database combos
	 * @returns {Combo[]}
	 */
	public get combos(): Combo[] {
		return [
			{
				key: 'client',
				model: this.ClientModel,
				cache: this.clients,
				shouldCache: true,
			},
			{
				key: 'post',
				model: this.PostModel,
				// cache: this.posts,
				shouldCache: false,
			},
		];
	}

	/**
	 * Counts how many documents there are in a collection
	 * @param type {string} The collection name
	 * @param key {object} The data to search for
	 */
	public async count(type: 'client', key?: Partial<Client>): Promise<number>;
	public async count(type: 'post', key?: Partial<Post>): Promise<number>;
	public async count(type: string, key?: object): Promise<number> {
		const combo = this.combos.find((c) => c.key === type);
		if (combo) {
			const count = key ? await combo.model.count(key) : await combo.model.countDocuments();
			return count;
		}
		throw Error(`"${type}" is not a valid model key.`);
	}

	/**
	 * Fetches documents from the database.
	 * @param type {string} The collection name
	 * @param key {object} The data to search for
	 * @param returnOne {boolean} Wether to return one document or the whole search query
	 */
	public async get(type: 'client', key: Partial<Client>): Promise<Client | null>;
	public async get(type: 'client', key: Partial<Client>, returnOne: false): Promise<Client[]>;
	public async get(type: 'post', key: Partial<Post>): Promise<Post | null>;
	public async get(type: 'post', key: Partial<Post>, returnOne: false): Promise<Post[]>;
	public async get(type: string, key: object, returnOne = true): Promise<Document[] | Document | null> {
		const combo = this.combos.find((c) => c.key === type);
		if (combo) {
			const documents = await combo.model.find(key);
			if (returnOne) return documents[0] || null;
			return documents;
		}
		throw Error(`"${type}" is not a valid model key.`);
	}

	/**
	 * Creates a new database document with the provided collection name and data.
	 * @param {Types} type - The collection name
	 * @param {object} data - The data for the new document
	 */
	public async new(type: 'client', data: Partial<Client>): Promise<Client>;
	public async new(type: 'post', data: Partial<Post>): Promise<Post>;
	public async new(type: string, data: object): Promise<Document> {
		const combo = this.combos.find((c) => c.key === type);
		if (combo) {
			const document = new combo.model(data);
			await document.save();
			this.client.logger.data(`[DATABASE] Made new ${combo.model.modelName} document with ID of ${document._id}.`);
			if (combo.shouldCache && combo.cache) combo.cache.set(document.id, document);
			return document;
		}
		throw Error(`"${type}" is not a valid model key.`);
	}

	/**
	 * Updates the a database document's data.
	 * @param {Types} type - The collection name
	 * @param {object} key - The search paramaters for the document
	 * @param {object} data - The data you wish to overwrite in the update
	 * @returns {Promise<Faction | Guild | null>}
	 */
	public async set(type: 'client', key: Partial<Client>, data: Partial<Client>): Promise<Client | null>;
	public async set(type: 'post', key: Partial<Post>, data: Partial<Post>): Promise<Post | null>;
	public async set(type: string, key: object, data: object): Promise<Document | null> {
		const combo = this.combos.find((c) => c.key === type);
		if (combo) {
			const document = await combo.model.findOneAndUpdate(key, { $set: data }, { new: true });
			if (document) {
				this.client.logger.verbose(`[DATABASE] Edited ${combo.model.modelName} document with ID of ${document._id}.`);
				if (combo.shouldCache && combo.cache) combo.cache.set(document.id, document);
				return document;
			}
			return null;
		}
		throw Error(`"${type}" is not a valid model key.`);
	}

	/**
	 * Removes a database document.
	 * @param {Types} type - The collection name
	 * @param {object} data - The search paramaters for the document
	 * @returns {Promise<Faction | Guild | null>>} The document that was removed, if any.
	 */
	public async remove(type: 'client', data: Partial<Client>): Promise<Client | null>;
	public async remove(type: 'post', data: Partial<Post>): Promise<Post | null>;
	public async remove(type: string, data: object): Promise<Document | null> {
		const combo = this.combos.find((c) => c.key === type);
		if (combo) {
			const document = await combo.model.findOneAndRemove(data);
			if (document) {
				this.client.logger.verbose(`[DATABASE] Edited ${combo.model.modelName} document with ID of ${document._id}.`);
				if (combo.shouldCache && combo.cache) combo.cache.delete(document.id);
				return document;
			}
			return null;
		}
		throw Error(`"${type}" is not a valid model key.`);
	}

	/**
	 * Caching all database documents.
	 * @returns {number} The amount of documents cached total.
	 * @private
	 */
	private async _cacheAll(): Promise<number> {
		for (const combo of this.combos.filter((c) => c.shouldCache && c.cache)) await this._cache(combo);
		return i;
	}

	/**
	 * Caching each collection's documents.
	 * @param {Combo} combo - The combo name
	 * @returns {number} The amount of documents cached from that collection.
	 * @private
	 */
	private async _cache(combo: Combo): Promise<any> {
		const items = await combo.model.find();
		for (const i of items) combo.cache!.set(i.id, i);
		this.client.logger.verbose(
			`[DATABASE]: Cached ${items.length.toLocaleString('en-US')} items from ${combo.model.modelName}.`,
		);
		return (i += items.length);
	}

	/**
	 * Connect to the database
	 * @param {string} url - the mongodb uri
	 * @returns {Promise<number | Logger>} Returns a
	 */
	private async _connect(url: string | undefined): Promise<Logger | number> {
		if (url) {
			const start = Date.now();
			try {
				await connect(url, {
					useCreateIndex: true,
					useNewUrlParser: true,
					useFindAndModify: false,
					useUnifiedTopology: true,
				});
			} catch (err) {
				this.client.logger.error(`[DATABASE] Error when connecting to MongoDB:\n${err.stack}`);
				process.exit(1);
			}
			return this.client.logger.verbose(`[DATABASE] Connected to MongoDB in ${Date.now() - start}ms.`);
		}
		this.client.logger.error('[DATABASE] No MongoDB url provided!');
		return process.exit(1);
	}

	/**
	 * Adds all the listeners to the mongo connection.
	 * @param connection - The mongoose connection
	 * @returns {void}
	 * @private
	 */
	private _addListeners(connection: Connection): void {
		for (const [event, msg] of Object.entries(MONGO_EVENTS)) {
			connection.on(event, () => this.client.logger.data(`[DATABASE]: ${msg}`));
		}
	}

	/**
	 * Starts the Settings Provider
	 * @returns {SettingsProvider}
	 */
	public async init(): Promise<this> {
		this._addListeners(connection);
		await this._connect(process.env.MONGO);
		this.client.logger.verbose(
			`[DATABASE]: Now caching ${this.combos.filter((c) => c.shouldCache).length} schema documents.`,
		);
		await this._cacheAll();
		this.client.logger.info(`[DATABASE] [LAUNCHED] Successfully connected and cached ${i} documents.`);
		return this;
	}
}

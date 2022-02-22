import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { ColorResolvable, Message } from 'discord.js';
import { join } from 'path';
import { createLogger, format, Logger, transports } from 'winston';
import { LoggerConfig } from '../util/Constants';
// import { TwitterOptions } from '../structures/TwitterAPI';
import { ConfigKeys } from 'twit';
import NewHandler from '../structures/NewHandler';
import RESTHandler from '../structures/RESTHandler';
import SettingsProvider from '../../database/structures/SettingsProvider';
import PrometheusHandler from '../../metrics/structures/PrometheusHandler';
import App from '../../api/structures/App';

declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		config: SuccessConfig;
		twitter: RESTHandler;
		newHandler: NewHandler;
		settings: SettingsProvider;
		metrics: PrometheusHandler;
		successAPI: App;

		_settingsClient: SettingsProvider;
		_metricsClient: PrometheusHandler;

		children: SuccessClient[];
		parent: SuccessClient;
		isParent: boolean;

		sendProm: boolean;
	}
}

interface SuccessConfig {
	owners: string | string[];
	token: string;
	color: ColorResolvable;
	twitConfig: ConfigKeys;
	isParent?: boolean;
}

export default class SuccessClient extends AkairoClient {
	public readonly config: SuccessConfig;

	public sendProm = false;

	public children: SuccessClient[] = [];

	public constructor(config: SuccessConfig) {
		super(
			{ ownerID: config.owners },
			{
				messageCacheMaxSize: 50,
				messageCacheLifetime: 300,
				messageSweepInterval: 900,
				partials: ['REACTION', 'MESSAGE'],
				shards: 'auto',
			},
		);

		this.config = config;

		if (this.config.isParent) this.newHandler = new NewHandler(this);

		this.isParent = config.isParent || false;

		this.on(
			'shardError',
			(err: Error, id: any): Logger => this.logger.error(`[SHARD ${id} ERROR] ${err.message}`, err.stack),
		).on('warn', (warn: any): Logger => this.logger.warn(`[CLIENT WARN] ${warn}`));
	}

	public logger: Logger = createLogger({
		levels: LoggerConfig.levels,
		format: format.combine(
			format.colorize({ level: true }),
			format.errors({ stack: true }),
			format.splat(),
			format.timestamp({ format: 'MM/DD/YYYY HH:mm:ss' }),
			format.printf((data: any) => {
				const { timestamp, level, message, ...rest } = data;
				if (rest instanceof Error) console.dir(rest);
				return `[${timestamp}] ${level}: ${this.user ? `[${this.user.username}]` : ''} ${message}`;
			}),
		),
		transports: new transports.Console(),
		level: 'custom',
	});

	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (msg: Message) => {
			if (msg.guild) {
				const doc = this.settings.cache.clients.get(this.user!.id);
				if (doc?.prefix) return doc.prefix;
			}
			return '$';
		},
		aliasReplacement: /-/g,
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 3000,
		ignorePermissions: this.ownerID,
		argumentDefaults: {
			prompt: {
				modifyStart: (msg: Message, str: string) =>
					`${msg.author}, ${str}\n...or type \`cancel\` to cancel this command.`,
				modifyRetry: (msg: Message, str: string) =>
					`${msg.author}, ${str}\n... or type \`cancel\` to cancel this command.`,
				timeout: 'You took too long. Command cancelled.',
				ended: 'Jeez, 3 tries? Command cancelled.',
				cancel: 'If you say so.',
				retries: 3,
				time: 30000,
			},
			otherwise: '',
		},
	});

	public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
		directory: join(__dirname, '..', 'inhibitors'),
	});

	public listenerHandler: ListenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, '..', 'listeners'),
	});

	private readonly _settingsProvder = new SettingsProvider(this);

	public get settings(): SettingsProvider {
		if (this.isParent) return this._settingsProvder;
		return this.parent._settingsProvder;
	}

	public get metrics(): PrometheusHandler {
		if (this.isParent) return this._metricsClient;
		return this.parent._metricsClient;
	}

	public readonly successAPI: App = new App(this, {
		port: Number(process.env.API_PORT!),
	});

	private async load(): Promise<this> {
		if (this.isParent) this.successAPI.init();

		this.on('message', () => this.metrics.inc('messages'));
		this.on('raw', () => this.metrics.inc('gateway_events'));
		this.commandHandler.on('commandFinished', () => this.metrics.inc('commands'));

		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler,
		});
		this.commandHandler.loadAll();
		this.inhibitorHandler.loadAll();
		this.listenerHandler.loadAll();
		this.twitter = new RESTHandler(this);

		return this;
	}

	public async launch(): Promise<string> {
		await this.load();
		return this.login(this.config.token);
	}
}

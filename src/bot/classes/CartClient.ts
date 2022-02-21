import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { Collection, Message, MessageEmbed } from 'discord.js';
import { join } from 'path';
import { createLogger, format, Logger, transports } from 'winston';
import SettingsProvider from './SettingsProvider';
import { ColorResolvable } from 'discord.js';

declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		commandHandler: CommandHandler;
		config: ClientConfig;
		settings: SettingsProvider;
		version?: string;
		carts: Collection<string, MessageEmbed>;
		people: Collection<string, number>;
		cooldown: Set<string>;
		children: Collection<string, CrateClient>;
	}
}

interface ClientConfig {
	token: string;
	owner: string | string[];
	color: ColorResolvable;
	emoji: string;
	footerText: string;
	footerIcon: string;
}

export default class CrateClient extends AkairoClient {
	public constructor(config: ClientConfig) {
		super({
			messageCacheMaxSize: 100,
			ownerID: config.owner,
			partials: ['CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'USER'],
			ws: {
				intents: [
					'GUILDS',
					'GUILD_MESSAGES',
					'GUILD_MESSAGE_REACTIONS',
					'DIRECT_MESSAGES',
					'DIRECT_MESSAGE_REACTIONS'
				]
			}
		});

		this.config = config;

		this.settings = new SettingsProvider(this);

		this
			.on('shardError', (err: Error, id: any): Logger => this.logger.error(`[SHARD ${id} ERROR] ${err.message}`, err.stack))
			.on('warn', (warn: any): Logger => this.logger.warn(`[CLIENT WARN] ${warn}`));
	}

	public logger = createLogger({
		format: format.combine(
			format.colorize({ level: true }),
			format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
			format.printf((info: any) => {
				const { timestamp, level, message, ...rest } = info;
				return `[${timestamp}] ${level}: ${message}${Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : ''}`;
			})
		),
		transports: [
			new transports.Console({
				format: format.colorize({ level: true }),
				level: 'info'
			})
		]
	});

	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (msg: Message) => {
			if (!msg.guild) return 'a';
			const req = this.settings.guilds.get(msg.guild!.id);
			if (req) return req.prefix;
			return 'a';
		},
		aliasReplacement: /-/g,
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 3000,
		argumentDefaults: {
			prompt: {
				modifyStart: (msg: Message, str: string) => `${msg.author}, ${str}\n...or type \`cancel\` to cancel this command.`,
				modifyRetry: (msg: Message, str: string) => `${msg.author}, ${str}\n... or type \`cancel\` to cancel this command.`,
				timeout: 'You took too long. Command cancelled.',
				ended: 'Jeez, 3 tries? Command cancelled.',
				cancel: 'If you say so.',
				retries: 3,
				time: 30000
			},
			otherwise: ''
		}
	});

	public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, { directory: join(__dirname, '..', 'inhibitors') });

	public listenerHandler: ListenerHandler = new ListenerHandler(this, { directory: join(__dirname, '..', 'listeners') });

	public version: string = require('../../../package.json').version;

	public people: Collection<string, number> = new Collection();

	public carts: Collection<string, MessageEmbed> = new Collection();

	public cooldown: Set<string> = new Set();

	public children: Collection<string, CrateClient> = new Collection();

	public async load(): Promise<void> {
		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler
		});
		this.commandHandler.loadAll();
		this.inhibitorHandler.loadAll();
		this.listenerHandler.loadAll();
	}

	public async launch(): Promise<void> {
		await this.settings.init();
		await this.load();
		await this.login(this.config.token);
	}
}

import { AkairoClient, ClientUtil, CommandHandler, Flag, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { MessageEmbed, Util } from 'discord.js';
import { join } from 'path';
import twit from 'twit';
import { createLogger, format, Logger, transports } from 'winston';
import { LoggerConfig } from '../util/LoggerConfig';
import GiveawayHandler from './GiveawayHandler';
import ReminderHandler from './ReminderHandler';
import SettingsProvider from './SettingsProvider';
import MemeHandler from './MemeHandler';

declare module 'discord-akairo' {
	interface ClientUtil {
		toolEmbed(): MessageEmbed;
	}

	interface AkairoClient {
		logger: Logger;
		commandHandler: CommandHandler;
		settings: SettingsProvider;
		config: ToolConfig;
		reminderHandler: ReminderHandler;
		giveawayHandler: GiveawayHandler;
		twitter: twit;
		children?: ToolClient[];
		memeHandler: MemeHandler;
	}
}

interface ToolConfig {
	token: string;
	prefix: string;
	color: number;
	owners: string | string[];
}

export default class ToolClient extends AkairoClient {
	public constructor(public config: ToolConfig) {
		super({
			messageCacheMaxSize: 20,
			ownerID: config.owners,
			partials: ['MESSAGE', 'REACTION'],
		});

		this.commandHandler.resolver.addType(
			'tag',
			async (msg, phrase): Promise<any> => {
				if (!phrase) return Flag.fail(phrase);
				phrase = Util.cleanContent(phrase.toLowerCase(), msg);
				const tag = this.settings.tag.find(t => t.name === phrase && t.guildID === msg.guild!.id);

				return tag || Flag.fail(phrase);
			},
		);

		this.commandHandler.resolver.addType(
			'existingTag',
			async (msg, phrase): Promise<any> => {
				if (!phrase) return Flag.fail(phrase);
				phrase = Util.cleanContent(phrase.toLowerCase(), msg);
				const tag = this.settings.tag.find(t => t.name === phrase && t.guildID === msg.guild!.id);

				return tag ? Flag.fail(phrase) : phrase;
			},
		);

		this.commandHandler.resolver.addType(
			'tagContent',
			async (msg, phrase): Promise<any> => {
				if (!phrase) phrase = '';
				phrase = Util.cleanContent(phrase, msg);
				if (msg.attachments.first()) phrase += `\n${msg.attachments.first()!.url}`;

				return phrase || Flag.fail(phrase);
			},
		);
	}

	public children: ToolClient[] = [];

	public logger: Logger = createLogger({
		levels: LoggerConfig.levels,
		format: format.combine(
			format.colorize({ level: true }),
			format.errors({ stack: true }),
			format.splat(),
			format.timestamp({ format: 'MM/DD/YYYY HH:mm:ss' }),
			format.printf((data: any) => {
				const { timestamp, level, message, ...rest } = data;
				return `[${timestamp}] ${level}: ${message}${
					Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : ''
				}`;
			}),
		),
		transports: new transports.Console(),
		level: 'custom',
	});

	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: this.config.prefix || '!',
		aliasReplacement: /-/g,
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 3000,
		ignorePermissions: this.ownerID,
		argumentDefaults: {
			prompt: {
				modifyStart: (msg, str) => `${msg.author}, ${str}\n...or type \`cancel\` to cancel this command.`,
				modifyRetry: (msg, str) => `${msg.author}, ${str}\n...or type \`cancel\` to cancel this command.`,
				timeout: 'Too slow bro, command cancelled.',
				ended: 'Damn. 3 tries? Command cancelled.',
				cancel: "'ight boss.",
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

	private async load(): Promise<void> {
		const config = this.config;
		if (!this.util.toolEmbed) {
			Object.defineProperty(ClientUtil.prototype, 'toolEmbed', {
				value: function(): MessageEmbed {
					const embed = new MessageEmbed().setColor(config.color);
					return embed;
				},
			});
		}

		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler,
			shard: this,
		});

		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.commandHandler.loadAll();
		this.inhibitorHandler.loadAll();
		this.listenerHandler.loadAll();

		this.giveawayHandler = new GiveawayHandler(this);
		this.reminderHandler = new ReminderHandler(this);
		this.memeHandler = new MemeHandler(process.env.MEME_KEY!);
		this.twitter = new twit({
			consumer_key: process.env.TWITTER_CONSUMER_KEY!,
			consumer_secret: process.env.TWITTER_CONSUMER_SECRET!,
			access_token: process.env.TWITTER_ACCESS_TOKEN,
			access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
		});
	}

	public async launch(): Promise<string> {
		await this.load();
		return this.login(this.config.token);
	}
}

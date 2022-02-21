import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { Collection, ColorResolvable, Constants, Intents, Message, User } from 'discord.js';
import { join } from 'path';
import type Stripe from 'stripe';
import type { Logger } from 'winston';
import type { SettingsProvider } from '../../database';
import SlashCommandHandler from '../structures/SlashCommandHandler';
import SMSHandler from '../structures/SMSHandler';
import { logger } from '../util/Constants';

interface OnboardingData {
	user: User;
	guildID: string;
}
declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;
		config: SMSConfig;
		smsHandler: SMSHandler;
		settings: SettingsProvider;
		stripe: Stripe;
		maintenance: string;
		onboarding: Collection<string, OnboardingData>;
		slashCommandHandler: SlashCommandHandler;
	}
}

export interface SMSConfig {
	token: string;
	color: ColorResolvable;
	owners: string | string[];
	prefix: string;
}

export default class SMSClient extends AkairoClient {
	public constructor(public config: SMSConfig) {
		super({
			messageCacheLifetime: 300,
			messageCacheMaxSize: 5,
			messageSweepInterval: 900,
			ownerID: config.owners,
			partials: [Constants.PartialTypes.REACTION, Constants.PartialTypes.MESSAGE],
			ws: { intents: Intents.ALL },
		});

		this.config = config;

		this.listenerHandler.on('load', (i: any) =>
			this.logger.debug(`[LISTENER HANDLER]: [${i.category.id.toUpperCase()}] Loaded ${i.id} listener!`),
		);
	}

	public maintenance = '';

	public logger: Logger = logger;

	public onboarding = new Collection<string, OnboardingData>();

	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: async (msg: Message): Promise<string> => {
			if (msg.guild) {
				const row = await this.settings.guild(msg.guild.id);
				if (row.prefix) return row.prefix;
			}
			return this.config.prefix;
		},
		aliasReplacement: /-/g,
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 3000,
		ignorePermissions: this.config.owners,
		argumentDefaults: {
			prompt: {
				modifyStart: (msg: Message, str: string) =>
					`${msg.author} 💬 ${str}\n\nType \`cancel\` to cancel this command.`,
				modifyRetry: (msg: Message, str: string) =>
					`${msg.author} 💬 ${str}\n\nType \`cancel\` to cancel this command.`,
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

	public smsHandler: SMSHandler = new SMSHandler(this);

	private load(): void {
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
	}

	public async launch(): Promise<void> {
		this.load();
		await this.login(this.config.token);

		this.slashCommandHandler = new SlashCommandHandler(this);
		this.slashCommandHandler.init();
	}
}

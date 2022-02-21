import { Listener, Command } from 'discord-akairo';
import type { Message, TextChannel } from 'discord.js';

export default class CommandBlockedListener extends Listener {
	public constructor() {
		super('commandBlocked', {
			event: 'commandBlocked',
			emitter: 'commandHandler',
			category: 'commandHandler',
		});
	}

	public exec(msg: Message, command: Command, reason: string): void {
		if (reason === 'sendMessages') return;

		const text: Record<string, string> = {
			owner: 'You must be the owner to use this command.',
			guild: 'You must be in a guild to use this command.',
			dm: 'This command must be ran in DMs.',
			sendMessages: 'This command must be ran in DMs!',
			maintenance: `We're is currently in maintence mode.\n\nReason: ${this.client.maintenance}`,
		};

		const tag = msg.guild ? msg.guild.name : `${msg.author.tag}/PM`;
		this.client.logger.info(`=> ${command.id} ~ ${reason} in ${tag}`);

		const channel = msg.channel as TextChannel;
		const it = text[reason];
		if (msg.guild ? channel.permissionsFor(this.client.user!)!.has('SEND_MESSAGES') : true) {
			msg.channel.send(it);
		}
	}
}

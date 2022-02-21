import { Listener, Command } from 'discord-akairo';
import { Message, User, TextChannel } from 'discord.js';

export default class MissingPermissionsListener extends Listener {
	public constructor() {
		super('missingPermissions', {
			emitter: 'commandHandler',
			event: 'missingPermissions',
			category: 'commandHandler',
		});
	}

	public exec(msg: Message, _: Command, type: any, missing: any): any {
		if (missing === 'notOwner') {
			return msg.channel.send('This command is reserved for the server owner.').catch(() => undefined);
		}
		if (missing === 'noPerms') {
			return msg.channel
				.send("You're not the owner of this server nor do you have the text master role!")
				.catch(() => undefined);
		}

		const text = {
			client: (): string => {
				const str = this.missingPermissions(msg.channel as TextChannel, this.client.user!, missing);
				return `I am missing ${str} to use that command!`;
			},
			user: (): string => {
				const str = this.missingPermissions(msg.channel as TextChannel, msg.author, missing);
				return `You are missing ${str} to use that command!`;
			},
		};
		// @ts-ignore
		const it = text[type];
		if (msg.channel instanceof TextChannel && msg.channel.permissionsFor(this.client.user!)!.has('SEND_MESSAGES')) {
			return msg.reply(it());
		}
	}

	public missingPermissions(channel: TextChannel, user: User, permissions: any) {
		const missingPerms = channel
			.permissionsFor(user)!
			.missing(permissions)
			.map((str: any) => {
				if (str === 'VIEW_CHANNEL') return '`Read Messages`';
				if (str === 'SEND_TTS_MESSAGES') return '`Send TTS Messages`';
				if (str === 'USE_VAD') return '`Use VAD`';
				return `\`${str
					.replace(/_/g, ' ')
					.toLowerCase()
					.replace(/\b(\w)/g, (char: any): string => char.toUpperCase())}\``;
			});
		return missingPerms.length > 1
			? `${missingPerms.slice(0, -1).join(', ')} and ${missingPerms.slice(-1)[0]}`
			: missingPerms[0];
	}
}

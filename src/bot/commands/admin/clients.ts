import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';
import { User } from '../../../database';

export default class DownloadCommand extends Command {
	public constructor() {
		super('clients', {
			channel: 'guild',
			category: 'admin',
			aliases: ['clients'],
			clientPermissions: ['SEND_MESSAGES'],
			userPermissions: ['ADMINISTRATOR'],
			description: {
				content: 'Displays how many people are on oyur messaging list.',
			},
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const clients = await User.find({ guildID: msg.guild!.id, active: true });
		return msg.util?.send(`You have \`${clients.length.toLocaleString()}\` people on your text list.`);
	}
}

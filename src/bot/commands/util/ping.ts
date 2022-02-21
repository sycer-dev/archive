import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';

export default class PingCommand extends Command {
	public constructor() {
		super('ping', {
			aliases: ['ping', 'latency', 'test'],
			clientPermissions: ['SEND_MESSAGES'],
			description: {
				content: "Checks the bot's ping to Discord.",
			},
			category: 'utilities',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const message = await msg.channel.send('Ping?');
		const ping = Math.round(message.createdTimestamp - msg.createdTimestamp);
		return message.edit(`Pong! \`${ping}ms\``);
	}
}

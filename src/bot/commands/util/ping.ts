import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class PingCommand extends Command {
	public constructor() {
		super('ping', {
			aliases: ['ping', 'latency', 'test'],
			description: {
				content: 'Checks the bot\'s ping to Discord.'
			},
			category: 'utilities'
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const message = await msg.channel!.send('Ping?') as Message;
		const ping = Math.round(message.createdTimestamp - msg.createdTimestamp);
		return message.edit(`Pong! \`${ping}\`ms`);
	}
}


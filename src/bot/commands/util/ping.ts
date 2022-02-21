import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class PingCommand extends ToolCommand {
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

	public async exec(msg: Message): Promise<Message | Message[]> {
		const message = await msg.util!.send('Ping?');
		const ping = Math.round(message.createdTimestamp - msg.createdTimestamp);
		return message.edit(`Pong! \`${ping}ms\``);
	}
}

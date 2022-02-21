import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class EchoCommand extends ToolCommand {
	public constructor() {
		super('echo', {
			channel: 'guild',
			category: 'staff',
			aliases: ['echo', 'copycat', 'say'],
			description: {
				content: 'Repeats any information you provide.',
				usage: '<...text>',
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS'],
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'text',
					type: 'string',
					match: 'restContent',
					prompt: {
						start: 'What would you like me to echo?',
						retry: 'What would you like me to echo?',
					},
				},
				{
					id: 'slient',
					match: 'flag',
					flag: '--s',
				},
			],
		});
	}

	public async exec(msg: Message, { text, silent }: { text: string; silent: boolean }): Promise<Message | Message[]> {
		if (silent && msg.deletable) msg.delete();
		return msg.channel.send(text);
	}
}

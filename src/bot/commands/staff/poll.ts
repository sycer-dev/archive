import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class PollCommand extends ToolCommand {
	public constructor() {
		super('poll', {
			channel: 'guild',
			category: 'staff',
			aliases: ['poll'],
			description: {
				content: 'Runs a poll for a yes/no question.',
				usage: '<...text>',
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS'],
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'q',
					type: 'string',
					match: 'restContent',
					prompt: {
						start: 'what would you like to poll? (yes or no question)',
						retry: 'what would you like to poll? (yes or no question)',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { q }: { q: string }): Promise<Message | Message[]> {
		const m = await msg.channel.send(q);
		for (const e of ['👍', '👎']) await m.react(e);
		if (msg.deletable) msg.delete().catch(() => undefined);
		return msg;
	}
}

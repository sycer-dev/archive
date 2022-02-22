import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class IncludeContentCommand extends Command {
	public constructor() {
		super('include-content', {
			aliases: ['include-content', 'ic'],
			description: {
				content: "If you want the user's message content to be included in the tweet.",
			},
			category: 'configuration',
			userPermissions: ['MANAGE_GUILD'],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const { includeContent } = this.client.settings.cache.clients.find((c) => c.id === this.client.user!.id)!;
		const opt = !includeContent;
		this.client.settings.set('client', { id: this.client.user!.id }, { includeContent: opt });
		return msg.util?.reply(
			`user's message content will ${opt ? '**NOW**' : '**NO LONGER**'} be included in the tweet text.`,
		);
	}
}

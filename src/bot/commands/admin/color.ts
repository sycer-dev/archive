import { Command } from 'discord-akairo';
import { Message, Util } from 'discord.js';

export default class ColorCommand extends Command {
	public constructor() {
		super('color', {
			category: 'configuration',
			channel: 'guild',
			aliases: ['color', 'setcolor'],
			clientPermissions: ['EMBED_LINKS'],
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'color',
					type: (_, str: string) => {
						try {
							const color = Util.resolveColor(str.toUpperCase());
							return color;
						} catch {
							return null;
						}
					},
					prompt: {
						start: 'What would you like to set the embed color to?',
						retry: 'Please provide me with a real color code, decimal value, or color-word.',
					},
				},
			],
			description: {
				content: 'Sets the color for tweet-embeds.',
				usage: '[color] [--off]',
				examples: ['RED', 'FFFFFF', ''],
			},
		});
	}

	public async exec(msg: Message, { color }: { color: number }): Promise<Message | Message[] | void> {
		const client = this.client.settings.cache.clients.get(this.client.user!.id);
		const c = client?.color || undefined;

		if (!color) {
			if (c)
				return msg.util?.reply('this is the current embed color.', {
					embed: this.client.util.embed().setColor(color),
				});
			return msg.util?.reply('there is no current embed color.');
		}

		await this.client.settings.set('client', { id: this.client.user!.id }, { color });

		this.client.config.color = color;
		return msg.util?.reply(`successfully set the embed color to **${color}**.`, {
			embed: this.client.util.embed().setColor(color),
		});
	}
}

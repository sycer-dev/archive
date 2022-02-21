import { Message, Util } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class ColorCommand extends ToolCommand {
	public constructor() {
		super('color', {
			category: 'staff',
			channel: 'guild',
			aliases: ['color', 'setcolor'],
			clientPermissions: ['EMBED_LINKS'],
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'color',
					type: (_, str: string): number | null => {
						try {
							const color = Util.resolveColor(str.toUpperCase());
							return color;
						} catch {}
						return null;
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

	public async exec(msg: Message, { color }: { color: number }): Promise<Message | Message[]> {
		const client = this.client.settings.child.get(this.client.user!.id);
		const c = client!.color || undefined;

		if (!color) {
			if (c)
				return msg.util!.reply('this is the current embed color.', {
					files: [`https://dummyimage.com/600x350/${color.toString(16)}/${color.toString(16)}.png`],
				});
			return msg.util!.reply('there is no current embed color.');
		}

		await this.client.settings.set('child', { id: this.client.user!.id }, { color });

		const hex = color.toString(16);

		this.client.config.color = color;
		return msg.util!.reply(`successfully set the embed color to **${color}**.`, {
			files: [`https://dummyimage.com/600x350/${hex}/${hex}.png`],
		});
	}
}

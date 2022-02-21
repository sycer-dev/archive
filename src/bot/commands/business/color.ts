import { Command } from 'discord-akairo';
import { Message, Util } from 'discord.js';

export default class ColorCommand extends Command {
	public constructor() {
		super('color', {
			category: 'business',
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
						} catch { return null; }
					},
					prompt: {
						start: 'What would you like to set the embed color to?',
						retry: 'Please provide me with a real color code, decimal value, or color-word.'
					}
				}
			],
			description: {
				content: 'Sets the color for embedded messages.',
				usage: '<color>',
				examples: ['RED', 'FFFFFF', '']
			}
		});
	}

	public async exec(msg: Message, { color }: { color: number }): Promise<Message | Message[]> {
		const child = this.client.settings.clients.get(this.client.user!.id);
		if (!child) return msg.util!.send('Sorry! This command is only available to Business Class Patrons.');
		const c = child!.color || undefined;

		if (!color) {
			if (c) return msg.util!.send('This is the current embed color.', { embed: this.client.util.embed().setColor(color) });
			return msg.util!.send('There is no current embed color.');
		}

		await this.client.settings.set('client', { id: this.client.user!.id }, { color: color });
		this.client.config.color = color;

		return msg.util!.send(`\\✅ Successfully set the embed color to **${color}**.`, { embed: this.client.util.embed().setColor(color) });
	}
}

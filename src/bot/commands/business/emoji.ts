import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import * as nodemoji from 'node-emoji';

export default class EmojiCommand extends Command {
	public constructor() {
		super('emoji', {
			category: 'business',
			channel: 'guild',
			aliases: ['emoji'],
			clientPermissions: ['EMBED_LINKS'],
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'emoji',
					type: async (_: Message, str: string): Promise<string | null> => {
						if (!str) return null;
						const unicode = nodemoji.find(str);
						if (unicode) return unicode.emoji;

						const custom = this.client.emojis.cache.find(r => r.toString() === str);
						if (custom) return custom.id;
						return null;
					},
					prompt: {
						start: 'What would you like to set the cart-claim emoji to?',
						retry: 'Please provide me with a valid emoji.',
						optional: true
					}
				}
			],
			description: {
				content: 'Sets the emoji for the cart-claiming messages.',
				usage: '[emoji]',
				examples: ['🤑', ':pear_cooks:', '']
			}
		});
	}

	public async exec(msg: Message, { emoji }: { emoji: string }): Promise<Message | Message[]> {
		const child = this.client.settings.clients.get(this.client.user!.id);
		if (!child) return msg.util!.send('Sorry! This command is only available to Business Class Patrons.');
		const e = child!.emoji;

		if (!emoji) {
			return msg.util!.send(`The current emoji is ${this.client.emojis.cache.get(e) || e}.`);
		}

		await this.client.settings.set('client', { id: this.client.user!.id }, { emoji });
		this.client.config.emoji = emoji;

		return msg.util!.send(`\\✅ Successfully set emoji to **${this.client.emojis.cache.get(e) || e}**.`);
	}
}

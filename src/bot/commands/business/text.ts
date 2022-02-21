import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class FooterTextCommand extends Command {
	public constructor() {
		super('footer-text', {
			category: 'business',
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS', 'ATTACH_FILES'],
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'text',
					type: 'string',
					match: 'rest',
					prompt: {
						start: 'What would you like to set the embed footer text to?',
						retry: 'Please provide me with a valid string you\'d like for the embed footer text.',
						optional: true
					}
				}
			],
			description: {
				content: 'Sets the text for the embed footer.',
				usage: '<text>',
				examples: ['Imagination Carts ✨', '']
			}
		});
	}

	public async exec(msg: Message, { text }: { text: string }): Promise<Message | Message[]> {
		const client = this.client.settings.clients.get(this.client.user!.id);
		if (!client) return msg.util!.send('Sorry! This command is for Business Class Patrons.');
		const i = client!.footerText || undefined;

		if (!i) {
			if (i) return msg.util!.send(`The current footer text is \`${i}\`.`);
			return msg.util!.send('There is no current embed footer-text.');
		}

		await this.client.settings.set('client', { id: this.client.user!.id }, { footerText: text });
		this.client.config.footerText = text;

		return msg.util!.send(`\\✅ Successfully set the embed footer-text to \`${text}\`.`);
	}
}

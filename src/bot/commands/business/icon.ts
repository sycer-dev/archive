import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import path from 'path';

export default class FooterIconCommand extends Command {
	public constructor() {
		super('footer-icon', {
			category: 'business',
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS', 'ATTACH_FILES'],
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'icon',
					type: msg => this.findAttachment(msg),
					prompt: {
						start: 'What would you like to set the embed footer icon to?',
						retry: 'Please provide me with a valid image link or attachment.',
						optional: true
					}
				}
			],
			description: {
				content: 'Sets the icon for the embed footer.',
				usage: '<link>',
				examples: ['https://i.imgur.com/xyz', '*attaches image*', '']
			}
		});
	}

	public async exec(msg: Message, { icon }: { icon: string }): Promise<Message | Message[]> {
		const client = this.client.settings.clients.get(this.client.user!.id);
		if (!client) return msg.util!.send('Sorry! This command is for Business Class Patrons.');
		const i = client!.footerIcon || undefined;

		if (!i) {
			if (i) return msg.util!.send('This is the current embed footer-icon.', { files: [i] });
			return msg.util!.send('There is no current embed footer-icon.');
		}

		await this.client.settings.set('client', { id: this.client.user!.id }, { footerIcon: icon });
		this.client.config.footerIcon = icon;

		return msg.util!.send(`\\✅ Successfully set the embed icon.`, { files: [icon] });
	}

	public findAttachment(msg: Message): string | undefined | null {
		let attachmentImage;
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;

		const richEmbed = msg.embeds.find(embed => embed.type === 'rich' &&
			embed.image &&
			extensions.includes(path.extname(embed.image.url)));
		if (richEmbed) {
			attachmentImage = richEmbed.image!.url;
		}

		const attachment = msg.attachments.find(file => extensions.includes(path.extname(file.url)));
		if (attachment) {
			attachmentImage = attachment.proxyURL;
		}

		if (!attachmentImage) {
			const linkMatch = msg.content.match(linkRegex);
			if (linkMatch && extensions.includes(path.extname(linkMatch[0]))) {
				attachmentImage = linkMatch[0];
			}
		}

		return attachmentImage;
	}
}

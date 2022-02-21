import { Message } from 'discord.js';
import path from 'path';
import { ToolCommand } from '../../structures/Command';

export default class RingCommand extends ToolCommand {
	public constructor() {
		super('ring', {
			channel: 'guild',
			category: 'staff',
			aliases: ['ring'],
			description: {
				content: 'Sets a ring for the avatar command.',
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS'],
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'image',
					type: (msg: Message) => this.findAttachment(msg),
					prompt: {
						start: 'What would you like to set the ring-image to? Please attach an image or send an image URL.',
						retry: 'Please provide a valid attachment or image URL.',
						optional: true,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { image }: { image: string | null }): Promise<Message | Message[]> {
		const settings = this.client.settings.child.get(this.client.user!.id)!;
		if (!image) {
			if (!settings.ring) return msg.util!.reply(`there is no ring set for the avatar command!`);
			return msg.util!.reply({ files: [{ attachment: settings.ring, name: 'ring.png' }] });
		}
		await this.client.settings.set('child', { id: this.client.user!.id }, { ring: image });
		return msg.util!.reply(`successfully set the ring icon!`, { files: [{ attachment: image, name: 'ring.png' }] });
	}

	public findAttachment(msg: Message): string | undefined {
		let attachmentImage = undefined;
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;

		const richEmbed = msg.embeds.find(
			embed => embed.type === 'rich' && embed.image && extensions.includes(path.extname(embed.image.url)),
		);
		if (richEmbed) {
			attachmentImage = richEmbed.image!.url;
		}

		const attachment = msg.attachments.find(file => extensions.includes(path.extname(file.url)));
		if (attachment) {
			attachmentImage = attachment.proxyURL;
		}

		if (!attachmentImage) {
			const linkMatch = msg.content.match(linkRegex); // eslint-disable-line
			if (linkMatch && extensions.includes(path.extname(linkMatch[0]))) {
				attachmentImage = linkMatch[0];
			}
		}

		return attachmentImage;
	}
}

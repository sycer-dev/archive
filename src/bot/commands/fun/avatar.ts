import { Message, User } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
import request from 'node-superfetch';
import { loadImage, createCanvas } from 'canvas';

export default class AvatarCommand extends ToolCommand {
	public constructor() {
		super('avatar', {
			channel: 'guild',
			category: 'fun',
			aliases: ['avatar'],
			description: {
				content: 'Overlays your avatar with a ring set via the `ring` command.',
			},
			clientPermissions: ['EMBED_LINKS', 'ATTACH_FILES'],
			args: [
				{
					id: 'user',
					type: 'user',
					prompt: {
						start: 'What user do you wish to overlay?',
						retry: 'Please provide a valid user.',
						optional: true,
					},
					default: (msg: Message): User => msg.author,
				},
			],
		});
	}

	public async exec(msg: Message, { user }: { user: User }): Promise<Message | Message[]> {
		const settings =
			this.client.user!.id === '584186237875650560'
				? { ring: 'https://media.discordapp.net/attachments/581635926757998613/644718464291962881/sycer_ring.png' }
				: this.client.settings.child.get(this.client.user!.id)!;
		if (!settings || !settings.ring)
			return msg.util!.reply(`oh no! There's no ring image set. Please ask a Staff member to set one!`);
		const image = user.displayAvatarURL({ size: 512, format: 'png' });
		const attachment = await this._createAvatar(image, settings.ring);
		if (Buffer.byteLength(attachment) > 8e6) {
			return msg.reply('oh no! The generated image was over 8 MB!');
		}
		return msg.reply({ files: [{ attachment, name: `${msg.author.username}.png` }] });
	}

	private async _createAvatar(image: string, ring: string): Promise<Buffer> {
		const ringRequest = await request.get(ring);
		// @ts-ignore
		const base = await loadImage(ringRequest.body);
		const avatarRequest = await request.get(image);
		// @ts-ignore
		const data = await loadImage(avatarRequest.body);
		const canvas = createCanvas(data.width, data.height);
		const ctx = canvas.getContext('2d');
		ctx.drawImage(data, 0, 0);
		const dataRatio = data.width / data.height;
		const baseRatio = base.width / base.height;
		let { width, height } = data;
		let x = 0;
		let y = 0;
		if (baseRatio < dataRatio) {
			height = data.height;
			width = base.width * (height / base.height);
			x = (data.width - width) / 2;
			y = 0;
		} else if (baseRatio > dataRatio) {
			width = data.width;
			height = base.height * (width / base.width);
			x = 0;
			y = (data.height - height) / 2;
		}
		ctx.drawImage(base, x, y, width, height);
		return canvas.toBuffer();
	}
}

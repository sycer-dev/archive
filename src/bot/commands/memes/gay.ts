import { Message, User } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class GayCommand extends ToolCommand {
	public constructor() {
		super('gay', {
			channel: 'guild',
			category: 'memes',
			aliases: ['gay'],
			description: {
				content: 'make an avatar gay',
			},
			cooldown: 3,
			clientPermissions: ['EMBED_LINKS', 'ATTACH_FILES'],
			args: [
				{
					id: 'user',
					type: 'user',
					prompt: {
						start: "What user's avatar do you wish to use?",
						retry: 'Please provide a valid user.',
						optional: true,
					},
					default: (msg: Message): User => msg.author,
				},
			],
		});
	}

	public async exec(msg: Message, { user }: { user: User }): Promise<Message | Message[] | void> {
		try {
			const meme = await this.client.memeHandler.makeMeme('gay', {
				avatar1: user.displayAvatarURL({ size: 2048, format: 'png' }),
			});
			return msg.util?.reply({ files: [{ name: 'gay.png', attachment: meme }] });
		} catch (err) {
			return msg.util?.reply(`oh no, an error occurred when trying to generate that meme: \`${err}\``);
		}
	}
}

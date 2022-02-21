import { Message, User } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class SpankCommand extends ToolCommand {
	public constructor() {
		super('spank', {
			channel: 'guild',
			category: 'memes',
			aliases: ['spank'],
			description: {
				content: 'spans some1 else',
			},
			cooldown: 3,
			clientPermissions: ['EMBED_LINKS', 'ATTACH_FILES'],
			args: [
				{
					id: 'user1',
					type: 'user',
					prompt: {
						start: 'Who do you want to spank?',
						retry: 'Please provide a valid user.',
					},
				},
				{
					id: 'user2',
					type: 'user',
					prompt: {
						start: 'Who is going to be spanking the other user?',
						retry: 'Please provide a valid user.',
						optional: true,
					},
					default: (msg: Message): User => msg.author,
				},
			],
		});
	}

	public async exec(msg: Message, { user1, user2 }: { user1: User; user2: User }): Promise<Message | Message[] | void> {
		try {
			const meme = await this.client.memeHandler.makeMeme('spank', {
				avatar1: user2.displayAvatarURL({ size: 2048, format: 'png' }),
				avatar2: user1.displayAvatarURL({ size: 2048, format: 'png' }),
			});
			return msg.util?.reply({ files: [{ name: 'spank.png', attachment: meme }] });
		} catch (err) {
			return msg.util?.reply(`oh no, an error occurred when trying to generate that meme: \`${err}\``);
		}
	}
}

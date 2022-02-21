import { Message, User } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class QuoteCommand extends ToolCommand {
	public constructor() {
		super('quote', {
			channel: 'guild',
			category: 'memes',
			aliases: ['quote'],
			description: {
				content: 'quotes someone',
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
				{
					id: 'text',
					type: 'string',
					match: 'rest',
					prompt: {
						start: 'What are they saying?',
						retry: 'What are they saying?',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { user, text }: { user: User; text: string }): Promise<Message | Message[] | void> {
		try {
			const meme = await this.client.memeHandler.makeMeme('quote', {
				avatar1: user.displayAvatarURL({ size: 2048, format: 'png' }),
				username1: user.username,
				text,
			});
			return msg.util?.reply({ files: [{ name: 'quote.png', attachment: meme }] });
		} catch (err) {
			return msg.util?.reply(`oh no, an error occurred when trying to generate that meme: \`${err}\``);
		}
	}
}

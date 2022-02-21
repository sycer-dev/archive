import { Message, User } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class TriggerCommand extends ToolCommand {
	public constructor() {
		super('trigger', {
			channel: 'guild',
			category: 'memes',
			aliases: ['triggered', 'trigger'],
			description: {
				content: 'trigger someone',
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
			const meme = await this.client.memeHandler.makeMeme('trigger', {
				avatar1: user.displayAvatarURL({ size: 2048, format: 'png' }),
			});
			return msg.util?.reply({ files: [{ name: 'trigger.gif', attachment: meme }] });
		} catch (err) {
			return msg.util?.reply(`oh no, an error occurred when trying to generate that meme: \`${err}\``);
		}
	}
}

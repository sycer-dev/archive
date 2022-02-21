import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class KeywordGame extends ToolCommand {
	public constructor() {
		super('keywordgame', {
			channel: 'guild',
			category: 'staff',
			aliases: ['keywordgame', 'kwgame'],
			description: {
				content: 'First person to repeat the keyword is the winner!',
			},
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'word',
					match: 'restContent',
					prompt: {
						start: 'What keyword/phrase do you want users to repeat?',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { word }: { word: string }): Promise<Message | Message[]> {
		const m = await msg.channel.send(`First person to repeat **${word}** is the winner!`);
		const collector = await m.channel.awaitMessages((m: Message): boolean => m.content?.includes(word), {
			max: 1,
		});
		const collected = collector.first();
		return m.edit(
			`~~First person to repeat **${word}** is the winner!~~\n\nLooks like ${collected!.author} won this round.`,
		);
	}
}

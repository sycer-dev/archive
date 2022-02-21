import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class TagAddCommand extends ToolCommand {
	public constructor() {
		super('tag-add', {
			category: 'tags',
			description: {
				content: 'Adds a server-wide accessable tag (Markdown can be used).',
				usage: '<tag> <content>',
				examples: ['foo bar', '"rule-1" Be nice.', '"spaced tag" "oh thats cool"'],
			},
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'name',
					type: 'existingTag',
					prompt: {
						start: 'What do you want to name the tag?',
						retry: (_: Message, { failure }: { failure: { value: string } }) =>
							`a tag with the name \`${failure.value}\` already exists!\nPlease supply another name.`,
					},
				},
				{
					id: 'content',
					match: 'rest',
					type: 'tagContent',
					prompt: {
						start: "What do you want the tag's content to be?",
					},
				},
			],
		});
	}

	public async exec(msg: Message, { name, content }: { name: string; content: string }): Promise<Message | Message[]> {
		if (name && name.length >= 1900) {
			return msg.util!.reply('messages cannot have 2000 or more characters!');
		}

		if (content && content.length >= 1950) {
			return msg.util!.reply('messages cannot have 2000 or more characters!');
		}

		this.client.settings.new('tag', { guildID: msg.guild!.id, user: msg.author.id, name, content });

		return msg.util!.reply(`Alright bro, I created the tag \`${name.substring(0, 150)}\`.`);
	}
}

import { Message } from 'discord.js';
import { Tag } from '../../models/Tag';
import { ToolCommand } from '../../structures/Command';

export default class TagSourceCommand extends ToolCommand {
	public constructor() {
		super('tag-source', {
			category: 'tags',
			description: {
				content: 'Displays the source for a tag.',
				usage: '<tag>',
				examples: ['foo', 'rule1'],
			},
			channel: 'guild',
			args: [
				{
					id: 'tag',
					match: 'content',
					type: 'tag',
					prompt: {
						start: 'Which tag do you wish to get the source on?',
						retry: (_: Message, { failure }: { failure: { value: string } }): string =>
							`A tag with the name \`${failure.value}\` does not exist!`,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { tag }: { tag: Tag }): Promise<Message | Message[] | void> {
		return msg.util!.send(tag.content, {
			code: 'md',
		});
	}
}

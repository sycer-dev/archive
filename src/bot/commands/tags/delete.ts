import { Message } from 'discord.js';
import TagModel, { Tag } from '../../models/Tag';
import { ToolCommand } from '../../structures/Command';

export default class TagDeleteCommand extends ToolCommand {
	public constructor() {
		super('tag-delete', {
			category: 'tags',
			description: {
				content: 'Deletes a current tag.',
				usage: '<tag>',
				examples: ['foo', 'rule1'],
			},
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'tag',
					match: 'content',
					type: 'tag',
					prompt: {
						start: 'Which tag do you wish to delete?',
						retry: (_: Message, { failure }: { failure: { value: string } }): string =>
							`A tag with the name \`${failure.value}\` does not exist.`,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { tag }: { tag: Tag }): Promise<Message | Message[]> {
		await TagModel.remove(tag);

		return msg.util!.reply(`Sure thing, successfully deleted \`${tag.name.substring(0, 150)}\`.`);
	}
}

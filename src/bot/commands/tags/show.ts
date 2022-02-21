import { Message, Util } from 'discord.js';
import { Command } from 'discord-akairo';

export default class TagShowCommand extends Command {
	public constructor() {
		super('tag-show', {
			category: 'tags',
			description: {
				content: 'Shows a current tag, if any.',
				usage: '<tag>',
				examples: ['foo', 'rule1'],
			},
			channel: 'guild',
			args: [
				{
					id: 'name',
					match: 'content',
					type: 'lowercase',
					prompt: {
						start: 'Which tag do you wish to display?',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { name }: { name: string }): Promise<Message | Message[] | void> {
		if (!name) return;
		name = Util.cleanContent(name, msg);
		const tag = this.client.settings.tag.find(t => t.name === name && t.guildID === msg.guild!.id);
		if (!tag) return;
		return msg.util!.send(tag.content);
	}
}

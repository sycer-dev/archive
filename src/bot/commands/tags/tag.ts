import { Command, Flag } from 'discord-akairo';
import { stripIndents } from 'common-tags';

export default class TagCommand extends Command {
	public constructor() {
		super('tag', {
			category: 'tags',
			channel: 'guild',
			aliases: ['tag'],
			description: {
				content: stripIndents`Accessable methods:
                    • add \`<tag> <content>\`
                    • delete \`<tag>\` 
                    • list \`[member]\`
                    • show \`<tag>\`
                    • source \`<tag>\`

                    Required: \`<>\` - Optional: \`[]\`
                `,
				usage: '<method> <...arguments>',
				examples: [
					'add kodai Best bot tbh.',
					'add "cyber aio" yes, they have an app.',
					'delete kodai',
					'delete "cyber aio"',
					'list',
					'list Fyko#0001',
					'list 280015379806289920',
					'show kodai',
					'source kodai',
				],
			},
			ratelimit: 2,
		});
	}

	public *args() {
		const method = yield {
			type: [
				['tag-show', 'show'],
				['tag-add', 'add', 'create', 'new'],
				['tag-delete', 'del', 'delete'],
				['tag-source', 'source'],
				['tag-list', 'list'],
			],
			otherwise: () => stripIndents`
					There's a lot more info to learn here pal.
                    Use \`${this.handler.prefix}help tag\` for more info.
			`,
		};

		return Flag.continue(method);
	}
}

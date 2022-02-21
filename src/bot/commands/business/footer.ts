import { Command, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class FooterCommand extends Command {
	public constructor() {
		super('footer', {
			category: 'business',
			aliases: ['footer', 'foot'],
			description: {
				content: stripIndents`
					Change the footer icon and text for a business class client.
					Valid Methods:
					• icon <image url/attachment>
					• text <text>

					Required: \`<>\` - Optional: \`[]\`
				`,
				usage: '<method> <...content>',
				examples: [
					'icon',
					'icon https://i.imgur.com/xyz',
					'text',
					'text Imagination Carts ✨'
				]
			},
			ratelimit: 2
		});
	}

	public *args(): object {
		const method = yield {
			type: [
				['footer-icon', 'icon', 'i'],
				['footer-text', 'text', 't']
			],
			otherwise: async (msg: Message) => stripIndents`
					There's a lot to learn here pal.
					Use \`${msg.util!.parsed!.prefix}help footer\` for more info.
				`
		};

		return Flag.continue(method);
	}
}

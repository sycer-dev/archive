import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class AnonymousModeCommand extends Command {
	public constructor() {
		super('anonymous', {
			aliases: ['anonymous', 'anon', 'anonmode'],
			description: {
				content:
					'Toggle anonymous mode. When enabled, your members can send success photos to me via DMs and their success will be processed anonymously.',
			},
			category: 'configuration',
			userPermissions: ['MANAGE_GUILD'],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const { allowAnonymous } = this.client.settings.cache.clients.find((c) => c.id === this.client.user!.id)!;
		const opt = !allowAnonymous;
		this.client.settings.set('client', { id: this.client.user!.id }, { allowAnonymous: opt });
		return msg.util?.reply(
			`anonymous mode has been ${
				opt ? '**enabled**' : '**disabled**'
			}.\n\nWhat is anonymous mode?\n<https://changelog.sycer.dev/2.6.0-1MZZ4s>`,
		);
	}
}

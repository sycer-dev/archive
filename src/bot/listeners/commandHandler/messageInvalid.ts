import { Listener } from 'discord-akairo';
import { Message } from 'discord.js';

export default class MessageInvalidListener extends Listener {
	public constructor() {
		super('messageInvalid', {
			emitter: 'commandHandler',
			event: 'messageInvalid',
			category: 'commandHandler',
		});
	}

	public async exec(msg: Message) {
		if (msg.guild && msg.util!.parsed!.prefix) {
			if (!msg.util!.parsed!.alias || !msg.util!.parsed!.afterPrefix) return;
			const command = this.client.commandHandler.modules.get('tag-show');
			return this.client.commandHandler.runCommand(
				msg,
				command!,
				await command!.parse(msg, msg.util!.parsed!.afterPrefix),
			);
		}
	}
}

import { Listener } from 'discord-akairo';
import { Message, Constants } from 'discord.js';

export default class MessageDeleteListener extends Listener {
	public constructor() {
		super(Constants.Events.MESSAGE_DELETE, {
			emitter: 'client',
			event: Constants.Events.MESSAGE_DELETE,
			category: 'client',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const post = await this.client.settings.get('post', { messageID: msg.id });
		if (post) this.client.settings.remove('post', { _id: post._id });
	}
}

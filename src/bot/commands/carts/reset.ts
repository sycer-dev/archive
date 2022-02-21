import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class ResetCommand extends Command {
	public constructor() {
		super('reset', {
			aliases: ['reset'],
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: 'Resets the current cart session causing the cooldowns and maxed users to clear.'
			},
			category: 'carts'
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const keys = Array.from(this.client.people.keys());
		const filtered = keys.filter(k => k.startsWith(msg.guild!.id));
		for (const key of filtered) this.client.people.delete(key);
		return msg.util!.send(`\\✅ Successfully started a new cart session.`);
	}
}



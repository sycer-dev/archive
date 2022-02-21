import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class PremiumCommand extends Command {
	public constructor() {
		super('premium', {
			aliases: ['premium', 'status'],
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: 'Returns info on this server\'s subscription status.'
			},
			category: 'utilities'
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const guild = this.client.settings.guilds.get(msg.guild!.id);
		if (guild!.allowed) return msg.util!.send('This server **is** activated.');
		return msg.util!.send('This server is **NOT** activated. You can purchase access on our patreon: <https://patreon.com/carts>');
	}
}


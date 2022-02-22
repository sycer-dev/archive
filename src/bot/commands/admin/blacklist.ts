import { Command } from 'discord-akairo';
import { Message, User } from 'discord.js';

export default class BlacklistCommand extends Command {
	public constructor() {
		super('blacklist', {
			aliases: ['blacklist', 'unblacklist'],
			description: {
				content: 'Blocks a user from creating success posts.',
				usage: '<user>',
				examples: ['Fyko', '@Fyko', '543350735190884362'],
			},
			category: 'configuration',
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'user',
					match: 'content',
					type: 'user',
					prompt: {
						start: (msg: Message): string => `${msg.author}, who would you like to block/unblock?`,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { user }: { user: User }): Promise<Message | Message[] | void> {
		const { blocklist } = this.client.settings.cache.clients.get(this.client.user!.id)!;
		if (blocklist.includes(user.id)) {
			const index = blocklist.indexOf(user.id);
			blocklist.splice(index, 1);
			this.client.settings.set('client', { id: this.client.user!.id }, { blocklist });

			return msg.util?.send(`${user.tag} has been removed from the blocklist.`);
		}

		blocklist.push(user.id);
		this.client.settings.set('client', { id: this.client.user!.id }, { blocklist });

		return msg.util?.send(`Sucks to be ${user.tag}, they've been blocked from posting success photos. ¯\\_(ツ)_/¯`);
	}
}

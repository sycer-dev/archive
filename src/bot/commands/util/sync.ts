import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class PremiumCommand extends Command {
	public constructor() {
		super('sync', {
			aliases: ['sync', 'update'],
			channel: 'guild',
			userPermissions: (msg: Message): null | 'notOwner' => msg.author!.id === msg.guild!.ownerID ? null : 'notOwner',
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: 'Forces a membership check within our system.'
			},
			category: 'utilities'
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const guild = this.client.settings.guilds.get(msg.guild!.id);
		if (guild!.allowed) return msg.util!.send(`Sync successful, no changes have been made.`);

		const current = this.client.settings.guilds.filter(g => g.ownerID === msg.author!.id && g.allowed);
		if (current.size) return msg.util!.send(`Sync sync successful, no changes have been made.`);

		const member = await this.client.guilds.cache.get('581633886828625930')!.members.fetch(msg.author!.id);
		if (!member) return msg.util!.send('Sync failed, please join our client server and run sync again. <https://discord.sycer.dev/>');

		if (!member.roles.cache.has('595788980037877760')) return msg.util!.send('Sync failed, you don\'t have the Patron role in our server! <https://discord.sycer.dev/>');
		await this.client.settings.set('guild', { id: msg.guild!.id }, { allowed: true });
		return msg.util!.send('Sync successful, activated this guild.');
	}
}


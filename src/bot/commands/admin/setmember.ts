import { Command } from 'discord-akairo';
import { Message, Role } from 'discord.js';

export default class SetMemberCommand extends Command {
	public constructor() {
		super('setmember', {
			aliases: ['setmember', 'member', 'sm'],
			description: {
				content:
					'Sets or displays your "Member" role. This role allows users to post anonymous success by DMing the bot.',
				usage: '[role]',
				examples: ['', '@Member'],
			},
			category: 'configuration',
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'role',
					type: 'role',
					prompt: {
						start: 'What would you like to set the member role to?',
						retry: 'What would you like to set the member role to? Please provide a valid channel',
						optional: true,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { role }: { role: Role }): Promise<Message | Message[] | void> {
		const client = this.client.settings.cache.clients.get(this.client.user!.id)!;
		const { member } = client;

		if (!role) {
			if (!member) return msg.util?.send(`there is no configured member role!`);
			const fetched = await msg.guild?.roles.fetch(member).catch(() => null);
			if (!fetched)
				return msg.util?.send(
					`the previously configured member role has been deleted. Please set the new member role.`,
				);
			return msg.util?.send(`the current member role is ${fetched.name}`);
		}

		await this.client.settings.set('client', { _id: client._id }, { member: role.id });

		return msg.util?.reply(`successfully set the member role to **${role.name}**.`);
	}
}

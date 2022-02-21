import { Message, Role } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class RandomUser extends ToolCommand {
	public constructor() {
		super('randomuser', {
			channel: 'guild',
			category: 'staff',
			aliases: ['random-user', 'random-member', 'ru', 'rm'],
			description: {
				content: 'Picks a random member from the server.',
				examples: ['', 'role:Lifetime', 'role:Mod'],
			},
			clientPermissions: ['ADD_REACTIONS'],
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'role',
					type: 'role',
					match: 'option',
					flag: 'role:',
				},
			],
		});
	}

	public async exec(msg: Message, { role }: { role: Role | null }): Promise<Message | Message[] | void> {
		const members = await msg.guild?.members.fetch();
		let filtered = members?.filter(m => !m.user.bot);
		if (role) filtered = filtered?.filter(f => f.roles.cache.has(role.id));
		const user = filtered?.random();
		return msg.util?.reply(`the random user is ${user?.user.tag} [\`${user?.user.id}\`] `);
	}
}

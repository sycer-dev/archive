import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class AlertCommand extends ToolCommand {
	public constructor() {
		super('alert', {
			channel: 'guild',
			category: 'staff',
			aliases: ['alert', 'announce'],
			description: {
				content: 'Sets a role mentionable so you can send an announcement.',
			},
			cooldown: 5,
			clientPermissions: ['MANAGE_ROLES', 'MANAGE_MESSAGES'],
			userPermissions: ['MANAGE_MESSAGES'],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		let m = await msg.channel.send(
			'Which role do you wish to ping? Please ensure that my highest role is above the role you wish to ping.',
		);
		let role;
		while (!role) {
			const roleCollector = await msg.channel.awaitMessages(
				(mss: Message): boolean => mss.author.id === msg.author.id,
				{
					max: 1,
					time: 120000,
				},
			);
			if (!roleCollector.size || roleCollector.size !== 1) {
				return m.delete();
			}
			const collected = roleCollector.first();
			const resolve = this.client.util.resolveRole(collected!.content, msg.guild!.roles.cache);
			if (resolve && resolve.comparePositionTo(msg.guild!.me!.roles.highest) <= 0) {
				role = resolve;
				collected!.delete();
			} else {
				await m.delete();
				collected!.delete();
				m = await msg.channel.send('Please try again.');
			}
		}
		await m.delete();
		await role.setMentionable(true, `Announcement from ${msg.author.tag}`);
		const n = await msg.channel.send('Please send your announcement **INCLUDING** the mention.');
		await msg.channel.awaitMessages((mss: Message): boolean => mss.author.id === msg.author.id, {
			max: 1,
		});
		await role.setMentionable(false, `Announcement from ${msg.author.tag}`);
		await n.delete();
		return msg.delete();
	}
}

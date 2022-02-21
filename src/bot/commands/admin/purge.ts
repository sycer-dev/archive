import { Command } from 'discord-akairo';
import { Message, Role, Permissions } from 'discord.js';
import { User } from '../../../database';

export default class SnapCommand extends Command {
	public constructor() {
		super('snap', {
			channel: 'guild',
			category: 'admin',
			aliases: ['purge', 'nuke'],
			clientPermissions: [Permissions.FLAGS.EMBED_LINKS],
			description: {
				content:
					"Snapping will remove all users from your list that are no longer in the server. Using the --role= option will remove user's subscribed that don't have the role provided.",
				usage: '[--all/--role=]',
				examples: ['--all', '--role=Member'],
			},
			args: [
				{
					id: 'role',
					type: 'role',
					match: 'option',
					flag: ['--role=', '-r='],
				},
				{
					id: 'all',
					type: 'flag',
					flag: ['--all'],
				},
			],
		});
	}

	// @ts-ignore
	public async userPermissions(msg: Message): Promise<'noPerms' | null> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		const botMaster = guild.textMaster;
		const hasStaff = msg.author.id === msg.guild!.ownerID || (botMaster && msg.member!.roles.cache.has(botMaster));
		if (!hasStaff) return 'noPerms';
		return null;
	}

	public async exec(msg: Message, { all, role }: { all?: boolean; role?: Role }): Promise<Message | Message[] | void> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		if (!guild.allowed)
			return msg.util?.reply(
				`this server is not activated! Please active on the user dashboard at https://sms.sycer.dev/server/${
					msg.guild!.id
				}`,
			);
		const people = await User.find({ guildID: msg.guild!.id, active: true });

		if (all) {
			await msg.channel.send(
				`Are you sure you'd like to remove all \`${people.length.toLocaleString()}\` users from your messaging list? This action is irreversible.`,
			);
			const responses = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
				max: 1,
				time: 10000,
			});
			if (responses.size !== 1) return msg.util?.send('I was ready but you took too long. Clear cancelled.');
			const response = responses.first()!;
			if (!/^y(?:e(?:a|s)?)?$/i.test(response.content))
				return msg.util?.send('I was ready but you were not. Clear cancelled.');

			const res = await User.createQueryBuilder()
				.update()
				.where('userID IN (:...ids)', { ids: people.map((p) => p.userID) })
				.andWhere('guildID = :guildID', { guildID: msg.guild!.id })
				.set({ active: false })
				.execute();
			this.client.logger.debug(res);

			return msg.util?.send(`Successfully removed \`${people.length.toLocaleString()}\` people from your list.`);
		}

		await msg.channel.send('Calculating damanges...');
		const deaths: User[] = [];
		const members = await msg.guild!.members.fetch();

		if (role) {
			const doesntHaveRole = members.filter((m) => !m.roles.cache.has(role.id));
			for (const member of doesntHaveRole.values()) {
				const user = people.find((u) => u.userID === member.id);
				if (user && !deaths.some((u) => u.userID === user.userID)) deaths.push(user);
			}
		} else {
			for (const u of people.values()) {
				if (members.has(u.userID)) continue;
				deaths.push(u);
			}
		}

		if (!deaths.length) return msg.util?.send('There are no people to remove from your list at this time.');
		await msg.channel.send(`Procceding would slaughter ${deaths.length} people. Proceed? (**y**es/**n**o)`);
		const responses = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
			max: 1,
			time: 10000,
		});
		if (responses.size !== 1) return msg.util?.send('The gautlet was ready but you took too long. Snap cancelled.');
		const response = responses.first()!;

		if (!/^y(?:e(?:a|s)?)?$/i.test(response.content))
			return msg.util?.send("The guantlet was ready but I guess you weren't. Snap cancelled.");

		await User.createQueryBuilder()
			.update()
			.update()
			.where('userID IN (:...ids)', { ids: deaths.map((p) => p.userID) })
			.andWhere('guildID = :guildID', { guildID: msg.guild!.id })
			.set({ active: false })
			.execute();

		return msg.channel.send(
			`Successfully removed \`${deaths.length.toLocaleString()}\` users${
				role ? ` who don't have the **${role.name}** role` : ''
			}.`,
		);
	}
}

import { Command } from 'discord-akairo';
import type { Message, GuildMember } from 'discord.js';
import { User } from '../../../database';

export default class RemoveCommand extends Command {
	public constructor() {
		super('remove', {
			category: 'admin',
			channel: 'guild',
			aliases: ['remove'],
			args: [
				{
					id: 'member',
					type: async (msg: Message, str: string) => {
						const members = await msg.guild!.members.fetch();
						return this.client.util.resolveMember(str, members);
					},
					prompt: {
						start: 'Who would you like to remove from your client list?',
						retry: 'Please provide me with a valid user mention or ID.',
					},
				},
			],
			clientPermissions: ['SEND_MESSAGES'],
			description: {
				content: 'Removes a user from your member list.',
				usage: '<member>',
				examples: ['@Fyko', '1234567890'],
			},
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

	public async exec(msg: Message, { member }: { member: GuildMember }): Promise<Message | Message[] | void> {
		const user = await User.findOne({ guildID: msg.guild!.id, userID: member.id, active: true });

		if (!user) return msg.util?.send("That user isn't on your list.");
		await msg.channel.send(`Are you sure you want to remove **${member.user.tag}**?`);

		const responses = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
			max: 1,
			time: 10000,
		});
		if (responses.size !== 1) return msg.util?.send('Operation cancelled.');
		const response = responses.first()!;

		let sent: Message;
		if (/^y(?:e(?:a|s)?)?$/i.test(response.content)) {
			sent = await msg.channel.send(`Removing **${member.user.tag}**...`);
		} else return msg.util?.send('Understood, operation cancelled.');

		user.active = false;
		await user.save();

		try {
			return sent.edit(`Successfully removed **${member.user.tag}**.`);
		} catch {
			return msg.channel.send(`Successfully removed **${member.user.tag}**.`);
		}
	}
}

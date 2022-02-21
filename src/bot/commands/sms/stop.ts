import { stripIndents } from 'common-tags';
import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';
import { User } from '../../../database';
import { codeb, list, pluralize, shorten } from '../../util';

export default class StopCommand extends Command {
	public constructor() {
		super('stop', {
			aliases: ['stop', 'unsub'],
			category: 'sms',
			channel: 'guild',
			ownerOnly: true,
			description: {
				content: stripIndents`
					Unsubscribes your phone number from text messages in this server.
					
					This does **not** delete your phone number from our records if you wish to resubscribe later.
					If you wish to remove your phone number, please append the \`--force\` flag.
					*Note: this will remove your subscription from all servers using sycerSMS*
				`,
				examples: ['', '--force'],
				usage: '[--force]',
			},
			args: [
				{
					id: 'force',
					match: 'flag',
					flag: '--force',
				},
			],
		});
	}

	public async exec(msg: Message, { force }: { force: boolean }): Promise<void | Message | Message[]> {
		if (force) {
			const users = await User.find({ userID: msg.author.id });
			if (!users.length) return msg.util?.send('Your records were not found in our database.');
			await User.remove(users);

			const guilds = await Promise.all(users.map((u) => this.client.guilds.fetch(u.guildID)));
			return msg.util?.send(
				shorten(
					`Deleted \`${codeb(users.length)}\` record${pluralize(users)}, unsubscribing you from ${list(
						guilds.map((g) => codeb(g.name)),
					)}.`,
				),
			);
		}

		const user = await User.findOne({ userID: msg.author.id, guildID: msg.guild!.id, active: true });
		if (!user) return msg.util?.send("You don't have an profile for this server!");

		user.active = false;
		await user.save();

		return msg.util?.send(`You will no longer recieve alerts from ${msg.guild?.name}.`);
	}
}

import { Command, Argument } from 'discord-akairo';
import type { Message } from 'discord.js';

export default class PrefixCommand extends Command {
	public constructor() {
		super('prefix', {
			category: 'admin',
			channel: 'guild',
			aliases: ['prefix'],
			args: [
				{
					id: 'prefix',
					type: Argument.validate('string', (_, p) => !/\s/.test(p) && p.length <= 10),
					prompt: {
						start: 'What do you want to set the prefix to?',
						retry: "C'mon. I need a prefix without spaces and less than 10 characters",
						optional: true,
					},
				},
			],
			clientPermissions: ['SEND_MESSAGES'],
			userPermissions: ['MANAGE_GUILD'],
			description: {
				content: "Changes this server's prefix.",
				usage: '<prefix>',
				examples: ['!', '~'],
			},
		});
	}

	public async exec(msg: Message, { prefix }: { prefix: string }): Promise<Message | Message[] | void> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		if (!prefix) {
			return msg.util?.send(`The current prefix is \`${guild.prefix}\`.`);
		}

		guild.prefix = prefix;
		await guild.save();

		return msg.util?.send(`Changed the prefix to \`${prefix}\`.`);
	}
}

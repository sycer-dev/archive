import { Command, Argument } from 'discord-akairo';
import type { Message } from 'discord.js';

export default class MaxCommand extends Command {
	public constructor() {
		super('max', {
			category: 'admin',
			channel: 'guild',
			aliases: ['max', 'maximum', 'stock', 'cap'],
			args: [
				{
					id: 'amount',
					type: Argument.range('number', 0, Infinity),
					prompt: {
						start: 'What do you want to set the max to?',
						retry: "Let's be forreal now.",
						optional: true,
					},
				},
			],
			clientPermissions: ['SEND_MESSAGES'],
			userPermissions: ['ADMINISTRATOR'],
			description: {
				content: 'Changes the maximum amount of users allowed on your texting list.',
				usage: '<number>',
				examples: ['20', '500'],
			},
		});
	}

	public async exec(msg: Message, { amount }: { amount: number }): Promise<Message | Message[] | void> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		if (!guild.allowed)
			return msg.util?.reply(
				`this server is not activated! Please active on the user dashboard at https://sms.sycer.dev/server/${
					msg.guild!.id
				}`,
			);
		if (!amount) {
			return msg.util?.send(`This server's max is at \`${guild.max}\`.`);
		}
		guild.max = amount;
		await guild.save();

		return msg.util?.send(`Changed the maximum size to ${amount}.`);
	}
}

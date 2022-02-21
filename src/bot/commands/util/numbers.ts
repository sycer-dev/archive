import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';
import twilio from 'twilio';

export default class NumbersCommand extends Command {
	public constructor() {
		super('numbers', {
			aliases: ['numbers', 'listnumbers', 'all'],
			clientPermissions: ['SEND_MESSAGES'],
			description: {
				content: 'Returns all the phone numbers you can recieve an SMS from.',
			},
			channel: 'guild',
			category: 'utilities',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const profile = await this.client.settings.guild(msg.guild!.id)!;
		if (!profile.twilio?.sid || !profile.twilio.notify || !profile.twilio.token)
			return msg.util?.reply(
				`this server's Twilio credentials have not been configured. Please manage them on the user dashboard at https://sms.sycer.dev/server/${
					msg.guild!.id
				}`,
			);
		const sms = twilio(profile.twilio.sid, profile.twilio.token);

		const numbers = await sms.incomingPhoneNumbers.list();
		const data = numbers.map((n) => `\`${n.phoneNumber}\``);
		const embed = this.client.util
			.embed()
			.setColor(this.client.config.color)
			.setTitle(`You can recieve an SMS from any one of the \`${data.length}\` phone numbers listed below.`)
			.setDescription(data.join(', ').substring(0, 1950));
		return msg.util?.reply({ embed });
	}
}

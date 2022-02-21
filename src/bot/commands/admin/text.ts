import { Command } from 'discord-akairo';
import type { Message, Role } from 'discord.js';
import { stripIndents } from 'common-tags';
import { User } from '../../../database';

export default class TextCommand extends Command {
	public constructor() {
		super('send-sms', {
			category: 'admin',
			channel: 'guild',
			aliases: ['text', 'send', 'sms', 'send-sms', 'message'],
			args: [
				{
					id: 'text',
					match: 'rest',
					prompt: {
						start: 'What do you want to message to all your clients?',
						retry: "Let's be forreal now.",
					},
				},
				{
					id: 'role',
					type: 'role',
					match: 'option',
					flag: 'role:',
				},
			],
			cooldown: 5,
			clientPermissions: ['SEND_MESSAGES'],
			description: {
				content: 'Sends a text message to everyone on your clients list. There is a max of 200 characters.',
				usage: '<message>',
				examples: ['YEEZY SUPPLY LIVE!', 'YS LIVE! role:EU'],
			},
		});
	}

	// @ts-ignore
	public async userPermissions(msg: Message): Promise<'noPerms' | null> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		const hasStaff =
			msg.author.id === msg.guild!.ownerID || (guild.textMaster && msg.member!.roles.cache.has(guild.textMaster));
		if (!hasStaff) return 'noPerms';
		return null;
	}

	public async exec(
		msg: Message,
		{ text, role }: { text: string; role: Role | null },
	): Promise<void | Message | Message[] | void> {
		const guild = await this.client.settings.guild(msg.guild!.id)!;
		if (!guild.allowed)
			return msg.util?.reply(
				`this server is not activated! Please active on the user dashboard at https://sms.sycer.dev/server/${
					msg.guild!.id
				}`,
			);

		if (!guild.twilio?.sid || !guild.twilio.notify || !guild.twilio.token)
			return msg.util?.reply(
				`this server's Twilio credentials have not been configured. Please manage them on the user dashboard at https://sms.sycer.dev/server/${
					msg.guild!.id
				}`,
			);

		if (text.length > 300) return msg.util?.reply('the character max is 300!');

		let clients = await User.find({ guildID: msg.guild!.id, active: true });
		if (role) {
			const _members = await msg.guild!.members.fetch();
			const members = _members.filter((m) => m.roles.cache.has(role.id)).keyArray();
			clients = clients.filter((c) => members.includes(c.userID));
		}

		if (!clients.length) return msg.util?.reply("you don't have anyone on your client list!");

		const content = `${msg.guild!.name}: ${text}`;
		const { encoding, length, messages } = this.client.smsHandler.counter.count(content);

		/**
		 * The cost of the text message in cents.
		 */
		const cost = messages * clients.length * 0.0075;

		await msg.channel.send(stripIndents`
			Are you sure you'd like to process a text to \`${clients.length.toLocaleString('en-US')}\` users${
			role ? ` with the **${role.name}** role` : ''
		}? (**y**es/**n**o)

			Message Content:
			\`\`\`fix
				${content}
				rates may apply.
			\`\`\`
			Encoding: \`${encoding}\` - Character Count: \`${length}\`
			Segments per Text: \`${messages}\` - Final Quote: \`$${(cost / 100).toFixed(2)}\`
		`);
		const responses = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
			max: 1,
			time: 10000,
		});
		if (responses.size !== 1) return msg.util?.send('You took too long to respond! Text cancelled!');
		const response = responses.first()!;

		if (!/^y(?:e(?:a|s)?)?$/i.test(response.content)) {
			return msg.util?.send('Got it cheif, text cancelled.');
		}

		await msg.util?.send('Processing your request...');
		await this.client.smsHandler.process(msg, text, clients);
	}
}

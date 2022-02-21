import { stripIndents } from 'common-tags';
import type { PrefixSupplier } from 'discord-akairo';
import { Message, TextChannel, User as DiscordUser, WebhookClient } from 'discord.js';
import phone from 'phone';
import twilio from 'twilio';
import { Guild, SMS, User } from '../../database';
import type SMSClient from '../client/SMSClient';
import { SMSCounter } from './SMSCounter';

export default class SMSHandler {
	protected queue: Set<string> = new Set();

	public readonly counter: SMSCounter = new SMSCounter();

	public hook = new WebhookClient(process.env.LOG_ID!, process.env.LOG_TOKEN!);

	public constructor(protected readonly client: SMSClient) {}

	public async process(msg: Message, text: string, clients: User[]): Promise<Message | Message[] | void> {
		const profile = await Guild.findOne({ id: msg.guild!.id });
		const sms = twilio(profile!.twilio!.sid, profile!.twilio!.token);
		const service = sms.notify.services(profile!.twilio!.notify);

		const body = `${msg.guild!.name}: ${text}\nrates may apply.`;

		const toBinding = clients.map((number) => JSON.stringify({ binding_type: 'sms', address: number.number }));
		const notif = await service.notifications.create({ toBinding, body }).catch((err: Error) => err);
		if (notif instanceof Error) {
			this.client.logger.twilio(`Error when requesting Notify. Ran by ${msg.author.id} in ${msg.guild!.name}.`, notif);
			return msg.util!.send(`oh no, an error occurred when processing that notification. Error: \`${notif}\``);
		}

		const log = await SMS.create({
			executor: msg.author.id,
			count: clients.length,
			body,
		}).save();

		this.sendLog(msg, log);

		return msg.util!.send(`Successfully sent \`${clients.length}\` messages.\`.`);
	}

	public sendLog(msg: Message, doc: SMS): void {
		const embed = this.client.util
			.embed()
			.setColor(this.client.config.color)
			.setTitle('MASS SMS PROCESSED')
			.addFields(
				{
					name: 'User and Guild Information',
					value: stripIndents`
					User: ${msg.author.tag} \`[${msg.author.id}]\`
					Guild: ${msg.guild!.name} \`[${msg.guild!.id}]\`
				`,
				},
				{
					name: 'Mass SMS Information',
					value: stripIndents`
					ID: ${doc.id}
					Count: ${doc.count}
					Body: \`${doc.body}\`
				`,
				},
			)
			.setTimestamp();
		try {
			void this.hook.send({ embeds: [embed] });
		} catch (err) {
			this.client.logger.error('[LOG ERROR] ', err);
		}
	}

	public async changeNumber(
		user: DiscordUser,
		documents: User[],
		guildID: string,
	): Promise<Message | Message[] | void> {
		const profile = await Guild.findOne({ id: guildID });
		const sms = twilio(profile!.twilio!.sid, profile!.twilio!.token);

		const msg = await user
			.send(
				stripIndents`
			For your safety, the phone number update will occurr in this Direct Message.
			
			Please provide me with your full phone number including the country code.
			Example: \`+1 800 520 1027\`

			...or type \`cancel\` to cancel. You have 60 seconds before this action times out.
		`,
			)
			.catch(() => undefined);
		if (!msg) return;

		let responses = await msg.channel.awaitMessages((m: Message): boolean => user.id === m.author.id, {
			max: 1,
			time: 60000,
		});
		if (responses.size !== 1) return msg.channel.send('You took too long to respond - operation timed out!');
		if (responses.first()!.content.toLowerCase() === 'cancel')
			return msg.channel.send('Sounds good - operation cancelled.');

		const number = phone(responses.first()!.content);

		if (!number.length || !number[0])
			return msg.channel.send(
				`The number you provided me with was invalid. Please try again by saying \`${(this.client.commandHandler
					.prefix as PrefixSupplier)(msg)}changenumber\`.`,
			);

		await msg.channel.send(
			`Great! What is the confirmation number I just sent you? You have 3 minutes before this operation times out.`,
		);

		const num = this.randomNumber();
		const body = `Your ${this.client.user!.username} verification code is ${num}.`;
		try {
			await sms.messages.create({
				to: number[0],
				from: profile!.twilio!.number,
				body: body,
			});
		} catch (err) {
			return msg.channel.send(stripIndents`
				There was an error sending you the confirmation message.
				
				Error: \`${err}\`
				
				Please try again and re-format yout number.
				> Example: \`+[country code] [rest of number]\``);
		}

		let live = 0;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		while (true) {
			if (live >= 3)
				return msg.channel.send(
					`Too many failed attempts, - operation cancelled! Please try again by saying \`${(this.client.commandHandler
						.prefix as PrefixSupplier)(msg)}changenumber\`.`,
				);
			responses = await msg.channel.awaitMessages((m: Message): boolean => user.id === m.author.id, {
				max: 1,
				time: 180000,
			});
			if (responses.size !== 1) return msg.channel.send('You took too long to respond - operation timed out!');
			if (responses.first()!.content.toLowerCase().includes(num.toLowerCase())) break;
			else await msg.channel.send('Invalid verification code! Please resend your verification code.');
			live++;
		}

		await User.createQueryBuilder()
			.update()
			.set({ number: number[0] })
			.where('userID = :userID', { userID: user.id })
			.execute();
		const guildNames = documents
			.map((d) => this.client.guilds.cache.get(d.guildID))
			.map((c) => c?.name ?? 'Unknown Server');

		return user.send(
			stripIndents`
			Successfully updated your phone number across \`${documents.length}\` server${documents.length ? '' : 's'}.

			Updated in:
			> ${guildNames.join(', ').replace(/, ([^,]*)$/, ' and $1')}
		`.substring(0, 2048),
		);
	}

	public async onboard(msg: Message): Promise<Message | Message[]> {
		const profile = await Guild.findOne({ id: msg.guild!.id });
		const sms = twilio(profile!.twilio!.sid, profile!.twilio!.token);

		const hook = (content: string) => this.sendShortLog(content, msg.guild!.id);
		const local = await User.findOne({ userID: msg.author.id, guildID: msg.guild!.id });
		const global = await User.find({ userID: msg.author.id });
		if (local) {
			local.active = true;
			await local.save();

			return msg.author.send(
				"Because you've already completed the phone verification, your profile has just been reactivated.",
			);
		} else if (global.length) {
			await User.create({
				userID: msg.author.id,
				guildID: msg.guild!.id,
				number: global[0].number,
			}).save();

			return msg.author.send(
				"Because you've already completed the phone verification in another server, you've been instantly added to this server's messaging list.",
			);
		}
		try {
			const chan = await msg.author.send(stripIndents`
				For your safety, the SMS onboarding will occurr in this Direct Message.
				Please provide me with your full phone number including the country code.
				Example: \`+1 800 520 1027\`

				...or type \`cancel\` to cancel. You have 60 seconds before this action times out.
			`);
			this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Sent initial message...`);
			void hook(`[ONBOARDING] [${msg.author.tag}] Sent initial message...`);
			let responses = await chan.channel.awaitMessages((m: Message): boolean => msg.author.id === m.author.id, {
				max: 1,
				time: 60000,
			});
			if (responses.size !== 1) {
				void hook(`[ONBOARDING] [${msg.author.tag}] Timed out...`);
				return chan.channel.send('Time ran out!');
			}
			if (responses.first()!.content.toLowerCase() === 'cancel') {
				this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Cancelled onboarding.`);
				void hook(`[ONBOARDING] [${msg.author.tag}] Cancelled onboarding.`);
				return chan.channel.send('Operation cancelled.');
			}

			this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Recieved phone number...`);
			void hook(`[ONBOARDING] [${msg.author.tag}] Recieved phone number...`);
			const number = phone(responses.first()!.content);
			this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Recieved number: ${number[0]}.`);
			if (!number.length || !number[0]) {
				this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Recieved invalid number.`);
				void hook(`[ONBOARDING] [${msg.author.tag}] Recieved invalid number.`);
				return chan.channel.send('The number you provided me with was invalid. Please try again.');
			}

			await chan.channel.send(
				`Great! What is the confirmation number I just sent you? You have 3 minutes before this operation times out.`,
			);

			const num = this.randomNumber();
			this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Sending verification code: ${num}.`);
			void hook(`[ONBOARDING] [${msg.author.tag}] Sending verification code: ${num}.`);
			const body = `Your ${this.client.user!.username} verification code is ${num}.`;
			try {
				await sms.messages.create({
					to: number[0],
					from: profile!.twilio!.number,
					body: body,
				});
			} catch (err) {
				void hook(`[ONBOARDING] [${msg.author.tag}] Error sending confirmation message: ${err}`);
				return chan.channel.send(
					`There was an error sending you the confirmation message.Error: \`${err}\` \nPlease try again and re-format yout number.\nExample: +[country code] [rest of number]`,
				);
			}
			this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Sent text. Now awaiting...`);
			void hook(`[ONBOARDING] [${msg.author.tag}] Sent text. Now awaiting...`);
			responses = await chan.channel.awaitMessages((m: Message): boolean => msg.author.id === m.author.id, {
				max: 1,
				time: 180000,
			});
			if (responses.size !== 1) {
				this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Timed out.`);
				void hook(`[ONBOARDING] [${msg.author.tag}] Timed out...`);
				return msg.util!.send('Time ran out!');
			}
			if (!responses.first()!.content.includes(num)) {
				this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Recieved incorrect number...`);
				void hook(
					`[ONBOARDING] [${msg.author.tag}] Recieved an incorrect code. Wanted \`${num}\` recieved \`${
						responses.first()!.content
					}\``,
				);
				return chan.channel.send('Invald number! Please try again.');
			}

			await User.create({
				userID: msg.author.id,
				guildID: msg.guild!.id,
				number: number[0],
			}).save();
			this.client.logger.info(`[ONBOARDING] [${msg.author.tag}] Successfully registered.`);
			void hook(`[ONBOARDING] [${msg.author.tag}] Successfully registered.`);

			return chan.channel.send(`You will now recieve texts from ${msg.guild!.name}.`);
		} catch (err) {
			this.client.logger.error('[ONBOARDING ERROR] ', err);
			void hook(`[ONBOARDING] [${msg.author.tag}] Error Occurred: ${err}`);
			return msg.util!.reply(`Goddamn. Fyko broke something. Here's the error if you care: ${err}`);
		}
	}

	public async sendShortLog(content: string, id: string) {
		const guild = await Guild.findOne({ id });
		if (guild?.logID) {
			try {
				void (this.client.channels.cache.get(guild.logID) as TextChannel).send(content);
			} catch {}
		}
	}

	public randomNumber(): string {
		let number = '';
		const possible = '1234567890';
		for (let i = 0; i < 4; i++) {
			number += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return number;
	}
}

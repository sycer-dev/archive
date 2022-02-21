import { Listener } from 'discord-akairo';
import type { User as DiscordUser, MessageReaction, Message, TextChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import phone from 'phone';
import { Guild, User } from '../../../database';
import twilio from 'twilio';
import { randomBytes } from 'crypto';

export default class MessageReactionAddListener extends Listener {
	public static waiting: Set<string> = new Set();

	public constructor() {
		super('messageReactionAdd', {
			emitter: 'client',
			event: 'messageReactionAdd',
			category: 'client',
		});
	}

	public async exec(reaction: MessageReaction, user: DiscordUser): Promise<void> {
		let msg = reaction.message;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (msg.partial) msg = await msg.fetch();
		if (!msg.guild || user.bot || !msg.embeds.length || msg.author.id !== this.client.user!.id) return;

		const embed = msg.embeds[0];

		if (embed.footer?.text && embed.footer.text.toLowerCase() === 'sms onboarding') {
			if ((msg.channel as TextChannel).permissionsFor(this.client.user!)!.has('MANAGE_MESSAGES'))
				reaction.users.remove(user.id).catch(() => undefined);
			this.handle(msg, user);
		}
	}

	/**
	 *
	 * @param message The message that was sent within the Guild
	 * @param user The Discord user that's registering.
	 */
	public async handle(message: Message, user: DiscordUser): Promise<Message | Message[]> {
		if (MessageReactionAddListener.waiting.has(user.id)) return message;
		MessageReactionAddListener.waiting.add(user.id);
		setTimeout(() => MessageReactionAddListener.waiting.delete(user.id), 60000);

		if (this.client.maintenance) {
			return user.send(
				`I'm currently in maintence mode! Please try again when I'm out of maintenance mode.\n\nReason: ${this.client.maintenance}`,
			);
		}

		try {
			const owo = await user.send('Making sure our DMs work...');
			await owo.delete();
		} catch {
			const owo = await message.channel.send(`${user}, please unlock your DMs and try again!`);
			return owo.delete({ timeout: 3500 });
		}

		const hook = (content: string) => this.client.smsHandler.sendShortLog(content, message.guild!.id);
		const local = await User.findOne({ userID: user.id, guildID: message.guild!.id });
		const global = await User.find({ userID: user.id });

		if (local) {
			local.active = true;
			await local.save();

			return user.send(
				"Because you've already completed the phone verification, your profile has just been reactivated.",
			);
		} else if (global.length) {
			await User.create({
				userID: user.id,
				guildID: message.guild!.id,
				number: global[0].number,
			}).save();
			return user.send(
				"Because you've already completed the phone verification in another server, you've been instantly added to this server's messaging list.",
			);
		}

		const profile = (await Guild.findOne({ id: message.guild!.id }))!;
		if (profile.twilio?.verify) {
			const key = randomBytes(16).toString('hex');
			this.client.onboarding.set(key, { user, guildID: message.guild!.id });
			return user.send(`Please visit https://sms.sycer.dev/onboarding?key=${key} to continue with onboarding.`);
		}

		const sms = twilio(profile.twilio!.sid, profile.twilio!.token);

		try {
			const chan = await user.send(stripIndents`
				For your safety, the SMS onboarding will occurr in this Direct Message.
				Please provide me with your full phone number including the country code.
				Example: \`+1 800 520 1027\`

				...or type \`cancel\` to cancel. You have 60 seconds before this action times out.
			`);
			this.client.logger.info(`[ONBOARDING] [${user.tag}] Sent initial message...`);
			hook(`[ONBOARDING] [${user.tag}] Sent initial message...`);
			let responses = await chan.channel.awaitMessages((): boolean => true, {
				max: 1,
				time: 60000,
			});
			if (responses.size !== 1) {
				hook(`[ONBOARDING] [${user.tag}] Timed out...`);
				return chan.channel.send('Time ran out!');
			}
			if (responses.first()!.content.toLowerCase() === 'cancel') {
				this.client.logger.info(`[ONBOARDING] [${user.tag}] Cancelled onboarding.`);
				hook(`[ONBOARDING] [${user.tag}] Cancelled onboarding.`);
				return chan.channel.send('Operation cancelled.');
			}

			this.client.logger.info(`[ONBOARDING] [${user.tag}] Recieved phone number...`);
			hook(`[ONBOARDING] [${user.tag}] Recieved phone number...`);
			const number = phone(responses.first()!.content);
			this.client.logger.info(`[ONBOARDING] [${user.tag}] Recieved number: ${number[0]}.`);
			if (!number.length || !number[0]) {
				this.client.logger.info(`[ONBOARDING] [${user.tag}] Recieved invalid number.`);
				hook(`[ONBOARDING] [${user.tag}] Recieved invalid number.`);
				return chan.channel.send('The number you provided me with was invalid. Please try again.');
			}

			const num = this.client.smsHandler.randomNumber();
			this.client.logger.info(`[ONBOARDING] [${user.tag}] Sending verification code: ${num}.`);
			hook(`[ONBOARDING] [${user.tag}] Sending verification code: ${num}.`);
			const body = `Your ${this.client.user!.username} verification code is ${num}.`;
			try {
				await sms.messages.create({
					to: number[0],
					from: profile.twilio!.number,
					body: body,
				});
			} catch (err) {
				hook(`[ONBOARDING] [${user.tag}] Error sending confirmation message: ${err}`);
				return chan.channel.send(
					`There was an error sending you the confirmation message.Error: \`${err}\` \nPlease try again and re-format yout number.\nExample: +[country code] [rest of number]`,
				);
			}
			await chan.channel.send(
				`Great! What is the confirmation number I just sent you? You have 3 minutes before this operation times out.`,
			);

			this.client.logger.info(`[ONBOARDING] [${user.tag}] Sent text. Now awaiting...`);
			hook(`[ONBOARDING] [${user.tag}] Sent text. Now awaiting...`);
			responses = await chan.channel.awaitMessages((): boolean => true, {
				max: 1,
				time: 180000,
			});
			if (responses.size !== 1) {
				this.client.logger.info(`[ONBOARDING] [${user.tag}] Timed out.`);
				hook(`[ONBOARDING] [${user.tag}] Timed out...`);
				return user.send('Time ran out!');
			}
			let correct = false;
			if (responses.first()!.content.includes(num)) correct = true;
			while (!correct) {
				await chan.channel.send('Incorrect code! Please try again.');
				const collector = await chan.channel.awaitMessages((): boolean => true, {
					max: 1,
					time: 180000,
				});
				if (collector.size !== 1) {
					this.client.logger.info(`[ONBOARDING] [${user.tag}] Timed out.`);
					hook(`[ONBOARDING] [${user.tag}] Timed out...`);
					return user.send('Time ran out!');
				}
				if (collector.first()!.content.includes(num)) correct = true;
			}
			await User.create({
				userID: user.id,
				guildID: message.guild!.id,
				number: number[0],
			}).save();
			this.client.logger.info(`[ONBOARDING] [${user.tag}] Successfully registered with \`${number[0]}\`.`);
			hook(`[ONBOARDING] [${user.tag}] Successfully registered with \`${number}\`.`);
			return chan.channel.send(`You will now recieve texts from ${message.guild!.name}.`);
		} catch (err) {
			this.client.logger.error('[ONBOARDING ERROR] ', err);
			hook(`[ONBOARDING] [${user.tag}] Error Occurred: ${err}`);
			return user.send(`Goddamn. Fyko broke something. Here's the error if you care: ${err}`);
		}
	}
}

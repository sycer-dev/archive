/* eslint-disable @typescript-eslint/no-misused-promises */
import { randomBytes } from 'crypto';
import type { APIApplicationCommand, APIInteraction, RESTGetAPIApplicationCommandsResult } from 'discord-api-types';
import { Guild, User } from '../../database';
import type SMSClient from '../client/SMSClient';
import MessageReactionAddListener from '../listeners/client/messageReactionAdd';

export default class SlashCommandHandler {
	public constructor(protected readonly client: SMSClient) {}

	private async _ensureCommand(): Promise<boolean> {
		const api = Reflect.get(this.client, 'api');
		const commands: RESTGetAPIApplicationCommandsResult = await api.applications(this.client.user!.id).commands.get();
		const exists = commands.some((c) => c.name === 'join');
		if (!exists) {
			try {
				const command: APIApplicationCommand = await api.applications(this.client.user!.id).commands.post({
					data: {
						name: 'join',
						description: 'Joins the messaging list for this server.',
					},
				});
				this.client.logger.info(`Successfully created the slash command with id ${command.id}`);
			} catch (err) {
				this.client.logger.error(`Error when creating the command: ${err}`);
			}
		}

		return true;
	}

	public async init(): Promise<void> {
		await this._ensureCommand();
		// @ts-ignore
		this.client.ws.on('INTERACTION_CREATE', async (interaction: APIInteraction) => {
			const respond = (content: string): any =>
				api
					.interactions(interaction.id)(interaction.token)
					.callback.post({
						data: { type: 3, data: { content, flags: 64 } },
					});

			if (interaction.data!.name !== 'join') return;
			const profile = (await Guild.findOne({ id: interaction.guild_id }))!;
			const guild = this.client.guilds.cache.get(interaction.guild_id)!;
			if (!profile.allowed)
				return respond(`${guild.name} has not been activated. Please contact an administrator for support.`);
			if (!profile.twilio?.verify) return respond(`This command is currently not supported in ${guild.name}.`);

			const { member } = interaction;
			const api = Reflect.get(this.client, 'api');
			if (MessageReactionAddListener.waiting.has(member.user.id)) return;
			MessageReactionAddListener.waiting.add(member.user.id);
			setTimeout(() => MessageReactionAddListener.waiting.delete(member.user.id), 60000);

			if (this.client.maintenance) {
				return respond(
					`I'm currently in maintence mode! Please try again when I'm out of maintenance mode.\n\nReason: ${this.client.maintenance}`,
				);
			}

			const local = await User.findOne({ userID: member.user.id, guildID: interaction.guild_id });
			const global = await User.find({ userID: member.user.id });

			if (local) {
				local.active = true;
				await local.save();

				return respond(
					"Because you've already completed the phone verification, your profile has just been reactivated.",
				);
			} else if (global.length) {
				await User.create({
					userID: member.user.id,
					guildID: interaction.guild_id,
					number: global[0].number,
				}).save();
				return respond(
					"Because you've already completed the phone verification in another server, you've been instantly added to this server's messaging list.",
				);
			}

			if (profile.twilio.verify) {
				const key = randomBytes(16).toString('hex');
				const user = await this.client.users.fetch(member.user.id);
				this.client.onboarding.set(key, { user, guildID: interaction.guild_id });
				return respond(`Please visit https://sms.sycer.dev/onboarding?key=${key} to continue with onboarding.`);
			}
		});
	}
}

import { Command } from 'discord-akairo';
import type { Message, TextChannel } from 'discord.js';

export default class LogCommand extends Command {
	public constructor() {
		super('log', {
			category: 'admin',
			channel: 'guild',
			aliases: ['log', 'smslog'],
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'What do you want to set the log channel to?',
						retry: 'Please provide a valid channel mention, ID or name.',
						optional: true,
					},
				},
			],
			clientPermissions: ['SEND_MESSAGES'],
			userPermissions: ['MANAGE_GUILD'],
			description: {
				content: 'Sets or displays the current logging channel for sms-related actions.',
				usage: '[channe]',
				examples: ['', '#sms-logs'],
			},
		});
	}

	public async exec(msg: Message, { channel }: { channel: TextChannel | null }): Promise<Message | Message[] | void> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		if (!guild.allowed)
			return msg.util?.reply(
				`this server is not activated! Please active on the user dashboard at https://sms.sycer.dev/server/${
					msg.guild!.id
				}`,
			);

		if (!channel) {
			if (!guild.logID) return msg.util?.send('There is no current logging channel.');
			const get = this.client.channels.cache.get(guild.logID);
			if (!get) return msg.util?.send('The previous logging channel was deleted.');
			return msg.util?.send(`The current logging channel is ${get}.`);
		}
		guild.logID = channel.id;
		await guild.save();

		return msg.util?.send(`Successfully set the logging channel to ${channel}.`);
	}
}

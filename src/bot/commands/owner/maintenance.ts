import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';

export default class MaintenanceCommand extends Command {
	public constructor() {
		super('maintenance', {
			category: 'owner',
			aliases: ['maintenance', 'disable'],
			args: [
				{
					id: 'reason',
					match: 'rest',
					prompt: {
						start: 'what is your reason for maintenance mode?',
					},
					default: 'No reason provided.',
				},
			],
			description: {
				content: 'Puts the bot into maintenance mode.',
			},
			ownerOnly: true,
		});
	}

	public async exec(msg: Message, { reason }: { reason: string }): Promise<Message | Message[] | void> {
		const status = '🚨 in Maintenance Mode ~ delayed/no responses';
		if (this.client.maintenance) {
			this.client.maintenance = '';
			this.client.user!.setActivity(status);

			return msg.util?.reply(`successfuly exited maintenance mode.`);
		}

		this.client.maintenance = reason;
		return msg.util?.reply(`successfully entered maintence mode with reason: ${reason}.`);
	}
}

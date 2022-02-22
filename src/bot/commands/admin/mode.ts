import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
const MODES = {
	off: 0,
	disabled: 0,
	automatic: 1,
	auto: 1,
	approval: 2,
	approve: 2,
} as { [key: string]: number };
const NUMBERS = {
	0: 'disabled',
	1: 'automatic',
	2: 'approval',
} as { [key: number]: string };

export default class ModeCommamd extends Command {
	public constructor() {
		super('mode', {
			category: 'configuration',
			channel: 'guild',
			aliases: ['mode'],
			userPermissions: ['MANAGE_GUILD'],
			description: {
				content: 'Changes this mode for success posting. Choose from off, auto, or approval.',
				usage: '[mode]',
				examples: ['', 'off', 'auto', 'approval'],
			},
		});
	}

	public *args(): object {
		const mode = yield {
			match: 'rest',
			type: [
				['off', 'disabled'],
				['automatic', 'auto'],
				['approval', 'approve'],
			],
		};

		return { mode };
	}

	public async exec(msg: Message, { mode }: { mode: string }): Promise<Message | Message[] | void> {
		const client = this.client.settings.cache.clients.get(this.client.user!.id)!;
		if (!mode) {
			return msg.util?.reply(`I'm currently set to **${NUMBERS[client.mode]}**.`);
		}

		const number = MODES[mode];
		await this.client.settings.set('client', { id: this.client.user!.id }, { mode: number });
		return msg.util?.reply(`successfully set to **${NUMBERS[number]}**.`);
	}
}

import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
import ms from '@naval-base/ms';

export default class ReminderCommand extends ToolCommand {
	public constructor() {
		super('reminder', {
			channel: 'guild',
			category: 'tools',
			aliases: ['remind', 'remindme', 'reminder'],
			description: {
				content: 'Will remind you about something in a designated time.',
				usage: '<when> <why>',
				examples: ['45m do dishes', '2h walk dog'],
			},
			args: [
				{
					id: 'when',
					type: (_: Message, str: string): number | null => {
						if (!str) return null;
						const duration = ms(str);
						if (duration && duration >= 1000 * 60 && !isNaN(duration)) return duration;
						return null;
					},
					prompt: {
						start: 'When would you like to be reminded? Please say something like `1d` or `3h`. **NO SPACES**.',
						retry:
							"Please provide a valid time for when you'd like to be reminded. Please say something like `1d` or `3h`. **NO SPACES**.",
					},
				},
				{
					id: 'reason',
					type: 'string',
					match: 'rest',
					prompt: {
						start: 'What would you like to be reminded of?',
						retry: 'What would you like to be reminded of?',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { when, reason }: { when: number; reason: string }): Promise<Message | Message[]> {
		const m = await msg.channel.send(`Scheduling reminder...`);
		if (reason.length >= 2000) {
			if (m.editable) return m.edit('Why do you need a reminder with over 2000 characters?');
			return msg.util!.reply('why do you need a reminder with over 2000 characters?');
		}
		if (Date.now() + when < Date.now()) {
			if (m.editable) return m.edit('You think I can time-travel? o_0');
			return msg.util!.reply('you think I can time-travel? o_0');
		}

		await this.client.settings.new('reminder', {
			clientID: this.client.user!.id,
			userID: msg.author.id,
			reason,
			triggerAt: new Date(Date.now() + when),
		});

		if (m.editable) return m.edit(`You got it chump! I'll remind you in ${ms(when, true)}.`);
		return msg.util!.reply(`you got it chump! I'll remind you in ${ms(when, true)}.`);
	}
}

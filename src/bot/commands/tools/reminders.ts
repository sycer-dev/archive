import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
import ms from '@naval-base/ms';
import { Reminder } from '../../models/Reminder';

export default class RemindersCommand extends ToolCommand {
	public constructor() {
		super('reminders', {
			channel: 'guild',
			category: 'tools',
			aliases: ['reminders', 'delreminder'],
			description: {
				content: 'List or delete your reminders',
				usage: '[--del/-D]',
				examples: ['', '--del', '-D'],
			},
			args: [
				{
					id: 'del',
					match: 'flag',
					flag: ['--del', '-D'],
				},
			],
		});
	}

	public async exec(msg: Message, { del }: { del: boolean }): Promise<Message | Message[]> {
		const reminders = this.client.settings.reminder.filter(
			r => r.userID === msg.author.id && !r.actionProcessed && r.clientID === this.client.user!.id,
		);
		if (!reminders.size) return msg.util!.reply(`you have no reminders to ${del ? 'delete' : 'display'}!`);
		if (del) {
			if (!reminders.size) return msg.util!.reply("you don't have any templates to delete!");
			while (reminders.size) {
				const data = reminders
					.array()
					.reduce(
						(prev: string, val: Reminder, index: number): string =>
							`${prev}\`[${index + 1}]\` - ${val.reason.length > 50 ? `${val.reason.substring(50)}...` : val.reason}\n`,
						'',
					);
				const embed = this.client.util
					.toolEmbed()
					.setColor(this.client.config.color)
					.setDescription(
						`What is the number of the reminder you'd like to delete? ...or type \`cancel\` to stop.\n\n${data}`,
					);
				await msg.reply(embed);
				const messages = await msg.channel.awaitMessages(
					m =>
						m.author.id === msg.author.id &&
						((m.content > 0 && m.content <= reminders.size) || m.content.toLowerCase() === 'cancel'),
					{ max: 1, time: 20000 },
				);
				if (!messages.size) return msg.util!.send("Time's up!");
				if (messages.first()!.content.toLowerCase() === 'cancel')
					return msg.util!.send("Welp, it was nice helpin' ya!");

				const index = parseInt(messages.first()!.content, 10) - 1;
				await this.client.settings.remove('reminder', { _id: reminders.array()[index]._id });
				reminders.delete(reminders.keyArray()[index]!);
			}
			return msg.util!.send("That's all folks!");
		}
		const data = reminders
			.array()
			.reduce(
				(prev: string, val: Reminder): string =>
					`${prev}\`[${val.id}]\` [${ms(val.triggerAt.getTime() - Date.now(), true)}] ${
						val.reason.length > 50 ? `${val.reason.substring(50)}...` : val.reason
					}\n`,
				'',
			);
		const embed = this.client.util
			.toolEmbed()
			.setTitle('Your Reminders')
			.setDescription(data.substring(0, 2048));
		return msg.util!.send({ embed });
	}
}

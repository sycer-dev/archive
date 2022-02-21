import { Message } from 'discord.js';
import { stripIndents } from 'common-tags';
import { ToolCommand } from '../../structures/Command';

export default class GmailCommand extends ToolCommand {
	public constructor() {
		super('gmail', {
			channel: 'guild',
			category: 'tools',
			aliases: ['gmail', 'dots'],
			description: {
				content:
					'Takes advantage of Gmail\'s "dot method". What\'s the dot method? Click [here](https://support.google.com/mail/answer/7436150) to learn more.',
				usage: '<gmail>',
			},
			cooldown: 3,
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'gmail',
					type: (_: Message, str: string): null | string => {
						if (!str) return null;
						const parts = str.split('@');
						if (parts[1] && parts[1] === 'gmail.com') return str;
						return null;
					},
					prompt: {
						start: "What's the email address you'd like to do the gmail dot trick with?",
						retry: 'The least you could do is provide me with a real gmail address.',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { gmail }: { gmail: string }): Promise<Message | Message[]> {
		const username = gmail.split('@')[0];
		const mails: string[] = [];

		for (const message of this.generate(username)) {
			mails.push(`${message}@gmail.com`);
		}

		try {
			return msg.author.send(
				stripIndents`
					Here are ${mails.length} different email addresses made from \`${gmail}\`:
					${mails.map(m => `\`${m}\``).join('\n')}
				`.substring(0, 1999),
			);
		} catch {
			return msg.channel.send('Please unlock your DMs and try again!');
		}
	}

	public *generate(email: string): any {
		if (email.length <= 1) {
			yield email;
		} else {
			const head = email[0];
			const tail = email.slice(1);
			for (const item of this.generate(tail)) {
				yield `${head}${item}`;
				yield `${head}.${item}`;
			}
		}
	}
}

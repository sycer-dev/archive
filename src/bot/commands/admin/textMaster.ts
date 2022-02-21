import { Command } from 'discord-akairo';
import type { Message, Role } from 'discord.js';

export default class TextMasterCommand extends Command {
	public constructor() {
		super('textmaster', {
			category: 'admin',
			channel: 'guild',
			aliases: ['textmaster', 'master', 'ruler', 'txtmaster'],
			args: [
				{
					id: 'role',
					type: 'role',
					prompt: {
						start: 'What would you like to set the text master role to?',
						retry: 'I need a real role.',
						optional: true,
					},
				},
				{
					id: 'off',
					flag: ['--off', '-o'],
				},
			],
			userPermissions: (msg: Message) => {
				const missing = msg.author.id === msg.guild!.ownerID;
				if (!missing) return 'notOwner';
				return null;
			},
			description: {
				content:
					"Sets the role that allows control over sending text messages. If none is set, it's limited to the server owner.",
				usage: '[role] [--off]',
				examples: ['@Owner', 'Bot Master', '--off', ''],
			},
		});
	}

	public async exec(
		msg: Message,
		{ role, off }: { role: Role | null; off: boolean },
	): Promise<Message | Message[] | void> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		if (!guild.allowed)
			return msg.util?.reply(
				`this server is not activated! Please active on the user dashboard at https://sms.sycer.dev/server/${
					msg.guild!.id
				}`,
			);
		const botMaster = guild.textMaster;

		if (!off && !role) {
			if (botMaster && msg.guild!.roles.cache.get(botMaster))
				return msg.util?.send(`The current bot master role is **${msg.guild!.roles.cache.get(botMaster)}**.`);
			return msg.util?.send('There is no current text master role.');
		}

		if (off) {
			guild.textMaster = undefined;
			await guild.save();

			return msg.util?.send('Successfully removed the text master role.');
		}

		guild.textMaster = role!.id;
		await guild.save();

		return msg.util?.send(`Set the current text master role to **${role!.name}**.`);
	}
}

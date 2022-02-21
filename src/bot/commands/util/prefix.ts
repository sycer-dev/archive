import { Argument } from 'discord-akairo';
import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class PrefixCommand extends ToolCommand {
	public constructor() {
		super('prefix', {
			category: 'utilities',
			aliases: ['prefix'],
			channel: 'guild',
			args: [
				{
					id: 'prefix',
					type: Argument.validate('string', (_, p) => !/\s/.test(p) && p.length <= 10),
					prompt: {
						start: 'What do you want to set the prefix to?',
						retry: "C'mon. I need a prefix without spaces and less than 10 characters.",
						optional: true,
					},
				},
			],
			description: {
				content: "Changes this server's prefix.",
				usage: '[prefix]',
				examples: ['', '?', '>'],
			},
		});
	}

	public async exec(msg: Message, { prefix }: { prefix: string | null }): Promise<Message | Message[]> {
		if (
			prefix &&
			msg.guild &&
			!msg.member!.permissions.has('MANAGE_GUILD') &&
			!this.client.ownerID.includes(msg.author.id)
		)
			prefix = null;
		if (!prefix) {
			const p = this.handler.prefix;
			return msg.util!.reply(`the current prefix is \`${p}\`.`);
		}

		if (this.client.user!.id === process.env.ID) return msg;
		this.client.config.prefix = prefix;
		this.handler.prefix = prefix;
		await this.client.settings.set('child', { id: this.client.user!.id }, { prefix });
		return msg.util!.reply(`successfully set the prefix to \`${prefix}\`!`);
	}
}

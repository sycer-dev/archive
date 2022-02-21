/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';
import * as nodemoji from 'node-emoji';

export default class PanelCommand extends Command {
	public constructor() {
		super('panel', {
			channel: 'guild',
			category: 'admin',
			aliases: ['panel'],
			clientPermissions: ['EMBED_LINKS', 'ADD_REACTIONS', 'MANAGE_MESSAGES'],
			userPermissions: ['ADMINISTRATOR'],
			description: {
				content: 'Creates a panel where your members can react to join your SMS system.',
				usage: '[emoji]',
				examples: ['', '📞', '<:sycer:583029168468525086>'],
			},
			args: [
				{
					id: 'emoji',
					type: (_: Message, str: string): string | null => {
						const unicode = nodemoji.find(str);
						if (unicode) return unicode.emoji;

						const custom = this.client.util.resolveEmoji(str, this.client.emojis.cache);
						if (custom) return custom.id;
						return null;
					},
					prompt: {
						start: "Which emoji would you like to use? If it's a guild emoji, please ensure I'm in that server.",
						retry:
							"Which emoji would you like to use? If it's a guild emoji, please ensure I'm in that server. Some other regular emojis may not work due to Discord's weird emoji rules.",
						optional: true,
					},
					default: '📲',
				},
			],
		});
	}

	public async exec(msg: Message, { emoji }: { emoji: string }): Promise<Message | Message[] | void> {
		const guild = await this.client.settings.guild(msg.guild!.id);
		if (!guild.allowed)
			return msg.util?.reply(
				`this server is not activated! Please active on the user dashboard at https://sms.sycer.dev/server/${
					msg.guild!.id
				}`,
			);

		if (msg.deletable) await msg.delete();
		const embed = this.client.util
			.embed()
			.setColor(msg.guild?.me?.displayHexColor ?? this.client.config.color)
			.setDescription(
				`Please react with ${this.client.emojis.cache.get(emoji) ?? emoji} to join **${msg.guild!.name}'s** SMS list.`,
			)
			.setFooter('SMS Onboarding');
		const m = await msg.channel.send({ embed });
		await m.react(emoji);
		return m;
	}
}

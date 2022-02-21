import { Message, TextChannel } from 'discord.js';
import * as nodemoji from 'node-emoji';
import { stripIndents } from 'common-tags';
import { ToolCommand } from '../../structures/Command';
import ms from '@naval-base/ms';

export interface Entries {
	string: string;
	entries: number;
}

export default class Giveaways extends ToolCommand {
	public constructor() {
		super('quick', {
			aliases: ['quick', 'gw', 'quickstart'],
			description: {
				content: 'Start a giveaway within one command.',
				usage: '<channel> <winners> <emoji> <duration> <...title>',
				examples: [
					'#giveaways 1 🍕 3h Discord Nitro Code!',
					'giveaways 3 :blobgo: 49min Blob T-Shirt!',
					'222197033908436994 1 🎉 5m FLASH GIVEAWAY! Discord Nitro Code!',
				],
			},
			category: 'staff',
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			clientPermissions: ['EMBED_LINKS', 'ADD_REACTIONS'],
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'What channel would you like to start this giveaway in?',
						retry:
							'What channel would you like to start this giveaway in? Please provide a valid channel name, ID or mention.',
					},
				},
				{
					id: 'winnerCount',
					type: (_, str: string): number | null => {
						const input = parseInt(str, 10);
						if (input && !isNaN(input) && input >= 1) return input;
						return null;
					},
					prompt: {
						start: 'How many winners would you like there to be?',
						retry: 'How many winners would you like there to be? Please provide a valid number over 0.',
					},
				},
				{
					id: 'emoji',
					type: (_: Message, str: string): string | null => {
						const unicode = nodemoji.find(str);
						if (unicode) return unicode.emoji;

						// @ts-ignore
						const custom = this.client.util.resolveEmoji(str, this.client.emojis);
						if (custom) return custom.id;
						return null;
					},
					prompt: {
						start: "Which emoji would you like to use? If it's a guild emoji, please ensure I'm in that server.",
						retry:
							"Which emoji would you like to use? If it's a guild emoji, please ensure I'm in that server. Some other regular emojis may not work due to Discord's weird emoji rules.",
					},
				},
				{
					id: 'duration',
					type: (_: Message, str: string): number | null => {
						if (!str) return null;
						const duration = ms(str);
						if (duration && duration >= 3000 && !isNaN(duration)) return duration;
						return null;
					},
					prompt: {
						start:
							'How long would you like this giveaway to last? Please say something like `1d` or `3h`. **NO SPACES**.',
						retry:
							'How long would you like this giveaway to last? Please say something like `1d` or `3h`. **NO SPACES**.',
					},
				},
				{
					id: 'title',
					match: 'restContent',
					type: 'string',
					prompt: {
						start: 'Finally, what would you like to title this giveaway?',
					},
				},
			],
		});
	}

	public async exec(
		msg: Message,
		{
			channel,
			winnerCount,
			emoji,
			duration,
			title,
		}: { channel: TextChannel; winnerCount: number; emoji: string; duration: number; title: string },
	): Promise<Message | Message[] | undefined> {
		if (
			channel
				.permissionsFor(this.client.user!.id)!
				.has(['ADD_REACTIONS', 'SEND_MESSAGES', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'])
		) {
			return msg.util!.reply(`please make sure I can send messages and react in ${channel}!`);
		}
		const embed = this.client.util
			.embed()
			.setColor(msg.guild!.me!.displayColor || this.client.config.color)
			.setFooter('Ends at')
			.setTimestamp(new Date(Date.now() + duration))
			.setTitle(title).setDescription(stripIndents`
                **Time Remaining**: ${ms(duration, true)}
                
                React with ${this.client.emojis.cache.get(emoji) || emoji} to enter!
            `);
		const m = await channel.send('🎉 **GIVEAWAY** 🎉', { embed });
		await this.client.settings.new('giveaway', {
			title,
			emoji,
			guildID: msg.guild!.id,
			channelID: channel.id,
			messageID: m.id,
			winnerCount,
			endsAt: new Date(Date.now() + duration),
			createdBy: msg.author.id,
		});
		await m.react(emoji);

		return msg.util!.reply(`successfully started giveaway in ${channel}.`);
	}
}

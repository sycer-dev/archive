import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';

export default class ChannelCommand extends Command {
	public constructor() {
		super('channel', {
			aliases: ['channel', 'watch', 'listen'],
			description: {
				content: 'Adds or removes a channel to listen for success in.',
				usage: '<channel>',
				examples: ['#success', 'success', '543350735190884362'],
			},
			category: 'configuration',
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'What channel would you like add/remove from success listening?',
						retry: 'What channel would you like add/remove from success listening? Please provide a valid channel',
						optional: true,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { channel }: { channel: TextChannel }): Promise<Message | Message[] | void> {
		const client = this.client.settings.cache.clients.get(this.client.user!.id)!;
		const channels = client.channels;

		if (!channel) {
			const embed = this.client.util
				.embed()
				.setColor(this.client.config.color)
				.setAuthor('Success Channels', this.client.user!.displayAvatarURL())
				.setDescription(
					channels.length
						? channels.map((t) => `<#${t}>`)
						: `There are no current channels! Run \`${client.prefix} help channel\`.`,
				);
			return msg.util?.reply({ embed });
		}

		if (channels.includes(channel.id)) {
			const index = channels.indexOf(channel.id);
			channels.splice(index, 1);
			this.client.settings.set('client', { id: this.client.user!.id }, { channels });

			return msg.util?.reply(`${channel} has been removed from the channel list.`);
		}

		channels.push(channel.id);
		this.client.settings.set('client', { id: this.client.user!.id }, { channels });

		return msg.util?.reply(`successfully added ${channel} to the channel list.`);
	}
}

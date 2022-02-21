import { CategoryChannel, Message, TextChannel } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class ArchiveCommand extends ToolCommand {
	public constructor() {
		super('archive', {
			aliases: ['archive'],
			description: {
				content:
					'Archives a textchannel.\nProvide no arguments to display the archive category.\nProvide a category argument to set the archive.\nProvide a textchannel argument to archive it.',
				usage: '[channel]',
				examples: ['', 'Archive', '#oct-18-air-force-1-clot-royale-university-blue'],
			},
			category: 'staff',
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			clientPermissions: ['MANAGE_CHANNELS'],
			args: [
				{
					id: 'channel',
					type: (msg: Message, str: string): TextChannel | CategoryChannel | null => {
						const channels = msg.guild!.channels.cache;

						const textChannel = this.client.util.resolveChannel(
							str,
							channels.filter(c => c.type === 'text'),
						);
						if (textChannel) return textChannel as TextChannel;

						const category = this.client.util.resolveChannel(
							str,
							channels.filter(c => c.type === 'category'),
						);
						if (category) return category as CategoryChannel;

						return null;
					},
					prompt: {
						start: 'What channel would you like to archive/set as the archive category?',
						retry: 'Please provide a valid channel you wish to archive/set as the archive category.',
						optional: true,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { channel }: { channel: TextChannel }): Promise<Message | Message[] | undefined> {
		const settings = this.client.settings.child.get(this.client.user!.id)!;
		if (!channel) {
			if (!settings.archive) return msg.util!.reply(`there is no current archive channel.`);
			const get = this.client.channels.cache.get(settings.archive)! as CategoryChannel;
			if (settings.archive && !get) return msg.util!.reply(`the old archive category was deleted.`);
			return msg.util!.send(`the current archive category is \`${get.name}\`.`);
		}

		if (channel instanceof CategoryChannel) {
			await this.client.settings.set(
				'child',
				{ id: this.client.user!.id },
				{ archive: (channel as CategoryChannel).id },
			);
			return msg.util!.reply(`successfully set the archive channel to \`${(channel as CategoryChannel).name}\`.`);
		}

		const category = this.client.channels.cache.get(settings.archive!) as CategoryChannel;
		if (!category) return msg.util!.reply(`there is no archive category!`);
		if (!channel.manageable) return msg.util!.reply(`I don't have enough permissions to manage ${channel}!`);
		if (!category.manageable)
			return msg.util!.reply(`I don't have enough permissions to manage the archive category, \`${category.name}\`.`);

		try {
			await channel.setTopic(`Archived by ${msg.author.tag} (${msg.author.id}) on ${new Date().toLocaleString()}.`);
			await channel.setParent(category);
		} catch (err) {
			return msg.util!.reply(`oh no! An error occurred when archiving that channel: \`${err}\`.`);
		}

		return msg.util!.reply(`successfully archived ${channel}.`);
	}
}

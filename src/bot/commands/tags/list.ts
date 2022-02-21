import { Message, GuildMember } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class TagListCommand extends ToolCommand {
	public constructor() {
		super('tag-list', {
			category: 'tags',
			aliases: ['tags'],
			description: {
				content: 'Lists all tags unless a member parameter is supplied.',
				usage: '[member]',
				examples: ['', 'Fyko#0001'],
			},
			channel: 'guild',
			args: [
				{
					id: 'member',
					type: 'member',
					prompt: {
						start: 'Which tuser would you like to look at tags for?',
						retry: "Please provide a valid user you'd like to look at the tags for.",
						optional: true,
					},
				},
			],
		});
	}

	public async exec(msg: Message, { member }: { member: GuildMember }): Promise<Message | Message[]> {
		if (member) {
			const tags = this.client.settings.tag;
			if (!tags.size) {
				if (member.id === msg.author.id) return msg.util!.send("You don't have any tags!");
				return msg.util!.send(`${member.displayName} doesn\'t have any tags!`);
			}
			const embed = this.client.util
				.toolEmbed()
				.setAuthor(member.displayName, member.user.displayAvatarURL())
				.setDescription(
					tags
						.map((t): string => `\`${t.name}\` - ${t.content.substring(0, 15)}`)
						.sort()
						.join('\n'),
				);
			return msg.util!.send({ embed });
		}

		const tags = this.client.settings.tag.filter(t => t.guildID === msg.guild!.id);
		if (!tags.size) return msg.util!.send("This server doesnt'nt have any tags!");
		const embed = this.client.util
			.toolEmbed()
			.setAuthor(`${msg.guild!.name}'s Tags`, msg.guild!.iconURL() || this.client.user!.displayAvatarURL())
			.setDescription(
				tags
					.map((t): string => `\`${t.name}\` - ${t.content.substring(0, 15)}...`)
					.sort()
					.join('\n')
					.substring(0, 1000),
			);

		return msg.util!.send({ embed });
	}
}

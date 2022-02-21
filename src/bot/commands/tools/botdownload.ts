import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command.js';
import { BOT_LINKS } from '../../util/Constants';

export default class BotDownloadCommand extends ToolCommand {
	public constructor() {
		super('download', {
			channel: 'guild',
			category: 'tools',
			aliases: ['download', 'botdownloads', 'downloads', 'bots'],
			description: {
				content: 'Provides links for 15 differnt bots.',
			},
			clientPermissions: ['EMBED_LINKS'],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const embed = this.client.util
			.toolEmbed()
			.addField(
				'Balko',
				'[Windows](https://s3.amazonaws.com/balkobot.com/Balkobot/balkobot-setup.exe) | [MAC](https://s3.amazonaws.com/balkobot.com/Balkobot/Balkobot.dmg)',
				true,
			);
		for (const link of BOT_LINKS) {
			embed.addField(link.name, `[Windows](${link.link})`, true);
		}
		return msg.util!.send(embed);
	}
}

import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
import { stripIndents } from 'common-tags';

export default class TimeCommand extends ToolCommand {
	public constructor() {
		super('time', {
			channel: 'guild',
			category: 'tools',
			aliases: ['time'],
			description: {
				content: 'Returns the time for multiple regions throughout the world.',
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS'],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const date = new Date();
		const embed = this.client.util.toolEmbed().setTitle('Global Times').setDescription(stripIndents`
                **🗼 Tokyo** - \`${date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })} (JST) +9\`
                **🦆 Beijing** - \`${date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })} (CST) +8\`
                **🇷🇺 Moscow** - \`${date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' })} (MSK) +3\`
                **🍷 Paris** - \`${date.toLocaleString('en-US', { timeZone: 'Europe/Paris' })} (CET) +1\`
                **💂‍♂️ London** - \`${date.toLocaleString('en-US', { timeZone: 'Europe/London' })} (GMT)\`
                **🗽 New York** - \`${date.toLocaleString('en-US', { timeZone: 'America/New_York' })} (EST) -5\`
                **🌇 Chicago** - \`${date.toLocaleString('en-US', { timeZone: 'America/Chicago' })} (CST) -6\`
                **📸 Los Angeles**  - \`${date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} (PST) -8\`
            `);
		return msg.util?.reply({ embed });
	}
}

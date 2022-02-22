import { stripIndents } from 'common-tags';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
const MODES = {
	0: 'Disabled',
	1: 'Automatic',
	2: 'Approval',
} as { [key: number]: string };

export default class ConfigCommand extends Command {
	public constructor() {
		super('config', {
			aliases: ['config', 'status'],
			description: {
				content: "Displays the bot's confirguration status.",
			},
			category: 'configuration',
			userPermissions: ['MANAGE_GUILD'],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const client = this.client.settings.cache.clients.get(this.client.user!.id)!;
		const ready =
			Boolean(client.approvalLog) && Boolean(client.successLog) && client.channels.length && client.format.length;
		const embed = this.client.util.embed().setColor(this.client.config.color).setDescription(stripIndents`
				${ready ? '`✅` READY' : '`❌` NOT READY'}

				\`\✅\` **Prefix**: \`${client.prefix}\`
				\`\✅\` **Mode**: ${MODES[client.mode]}
				\`\✅\` **Anonymous Mode**: \`${client.allowAnonymous ? 'enabled' : 'disabled'}\`
				${client.member ? '`✅`' : '`❌`'}**Member Role**: ${msg.guild?.roles.cache.get(client.member) || 'None set.'}

				${client.channels.length ? '`✅`' : '`❌`'}**Channels**: ${
			client.channels.length ? client.channels.map((c) => `<#${c}>`).join(', ') : 'None set.'
		}
				${client.format.length ? '`✅`' : '`❌`'}**Tweet Formats**: ${
			client.format.length ? client.format.map((c) => `${c}`).join(', ') : 'None set.'
		}
				${client.successLog ? '`✅`' : '`❌`'}**Success Log**: ${
			client.successLog ? `Link hiddden. Run \`${client.prefix}log\` for info` : 'None set.'
		}
				${client.approvalLog ? '`✅`' : '`❌`'}**Approval Channel**: ${
			client.approvalLog ? `Link hiddden. Run \`${client.prefix}approval\` for info` : 'None set.'
		}
			`);
		return msg.reply(embed);
	}
}

import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { stripIndents } from 'common-tags';
import ms from '@naval-base/ms';

export default class ConfigCommand extends Command {
	public constructor() {
		super('config', {
			channel: 'guild',
			aliases: ['config'],
			userPermissions: ['MANAGE_MESSAGES'],
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: 'Displays all the current cart settings.'
			},
			category: 'carts'
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const guild = this.client.settings.guilds.get(msg.guild!.id);
		const embed = this.client.util.embed()
			.setFooter(this.client.config.footerText, this.client.config.footerIcon)
			.setColor(msg.guild!.me!.displayColor || this.client.config.color)
			.setDescription(stripIndents`
				${guild!.privateChannel && guild!.publicChannel && guild!.allowed ? '\\✅ READY' : '\\❌ NOT READY'}
				${guild!.allowed ? '\\✅ **SERVER ACTIVATED**' : '\\❌ **SERVER __NOT__ ACTIVATED**'}

				Cooldown: ${ms(guild!.cooldown, true)} - \`${guild!.cooldown}ms\`
				Max: \`${guild!.max} carts/user/session\`
				${guild!.privateChannel ? `\\✅ Private Channel: <#${guild!.privateChannel}>` : `\\❌ No Private Channel set! You **must** set one with \`${guild!.prefix}private <channe>\` `}
				${guild!.publicChannel ? `\\✅ Public Channel: <#${guild!.publicChannel}>` : `\\❌ No Public Channel set! You **must** set one with \`${guild!.prefix}public <channe>\` `}
			`);
		return msg.util!.send({ embed });
	}
}


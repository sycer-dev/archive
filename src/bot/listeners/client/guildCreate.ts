import { Listener } from 'discord-akairo';
import { Guild, WebhookClient, Message } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class GuildCreateListener extends Listener {
	public constructor() {
		super('guildCreate', {
			emitter: 'client',
			event: 'guildCreate',
			category: 'client',
		});
	}

	public async exec(guild: Guild): Promise<Message | Message[] | Guild> {
		void this.client.settings.guild(guild.id);

		const owner = this.client.users.cache.get(guild.ownerID);

		const embed = this.client.util.embed().setAuthor('Joined a Server').setColor(this.client.config.color)
			.setDescription(stripIndents`
				**Name**: \`${guild.name}\`
				**ID**: \`${guild.id}\`
				**Member Count**: ${guild.memberCount}
				**Created**: ${guild.createdAt.toLocaleString()}
				**Owner**: ${owner} \`[${owner!.tag}]\`
			`);
		const channel = new WebhookClient(process.env.LOG_ID!, process.env.LOG_TOKEN!);

		return channel.send({
			embeds: [embed],
			username: `guild logs n shit`,
			avatarURL: this.client.user!.displayAvatarURL(),
		});
	}
}

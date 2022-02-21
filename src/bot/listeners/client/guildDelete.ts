import { Listener } from 'discord-akairo';
import { Guild } from 'discord.js';

export default class GuildDeleteListener extends Listener {
	public constructor() {
		super('guildDelete', {
			emitter: 'client',
			event: 'guildDelete',
			category: 'client'
		});
	}

	public async exec(guild: Guild): Promise<void> {
		this.client.logger.info(`[LEFT GUILD] Left a server! >:( ${guild.name} | ${guild.memberCount} Member(s)`);
	}
}

import { Listener } from 'discord-akairo';
import { Guild } from 'discord.js';

export default class GuildCreateListener extends Listener {
	public constructor() {
		super('guildCreate', {
			emitter: 'client',
			event: 'guildCreate',
			category: 'client'
		});
	}

	public async exec(guild: Guild): Promise<void> {
		this.client.logger.info(`[NEW GUILD] Joined a new server! ${guild.name} | ${guild.member} Member(s)`);
		const current = this.client.settings.guilds.get(guild.id);
		if (current) return;
		await this.client.settings.new('guild', {
			id: guild.id,
			prefix: 'a',
			ownerID: guild.ownerID,
			allowed: false,
			privateChannel: null,
			publicChannel: null,
			cooldown: 5000,
			max: 50
		});
		if (this.client.user!.id !== '595775542569992192' && this.client.guilds.cache.size >= 2) guild.leave();
	}
}

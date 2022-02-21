import { Listener } from 'discord-akairo';

export default class ReadyListener extends Listener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			category: 'client',
		});
	}

	public exec(): void {
		this.client.logger.info(`[READY] ${this.client.user!.tag} is ready to send some SMS's.`);
		this.client.user!.setActivity(`sending texts! @sycerdev`, { type: 'PLAYING' });

		for (const id of this.client.guilds.cache.keyArray()) this.client.settings.guild(id);
	}
}

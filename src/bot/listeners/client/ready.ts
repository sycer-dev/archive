import { Listener } from 'discord-akairo';

export default class ReadyListener extends Listener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			category: 'client',
		});
	}

	public async exec(): Promise<void> {
		this.client.logger.info(`[READY] ${this.client.user!.tag} is ready to cook 'sm shit.`);
		this.client.giveawayHandler.init();
		this.client.reminderHandler.init();

		setInterval(async () => {
			for (const g2 of this.client.guilds.cache.values()) {
				g2.presences.cache.clear();
			}
		}, 900);
	}
}

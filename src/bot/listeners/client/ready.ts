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
		this.client.logger.info(`[READY] ${this.client.user!.tag} is ready to post some success!`);
		// this.client.user!.setActivity(this.client.config.status!.text!, { type: this.client.config.status!.type });
		setInterval(async () => {
			for (const g2 of this.client.guilds.cache.values()) {
				g2.presences.cache.clear();
			}
		}, 900);

		if (this.client.token === process.env.TOKEN) {
			this.client.logger.debug(`[PROMETHEUS]: ${this.client.user?.tag} will start sending stats now!`);
			this._prometheus();
			setInterval(() => this._prometheus(), 10 * 1000);
		}
	}

	private async _prometheus(): Promise<void> {
		const postCount = await this.client.settings.count('post');
		if (this.client.sendProm) {
			const guilds = this.client.children.flatMap((c) => c.guilds.cache.array());
			const userCount = guilds.reduce((acc, g): number => (acc += g.memberCount), 0);
			this.client.metrics.set('users', userCount);
			this.client.metrics.set('guilds', guilds.length);
			this.client.metrics.set('posts', postCount);
		}
	}
}

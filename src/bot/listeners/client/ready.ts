import { Listener } from 'discord-akairo';
import CartClient from '../../classes/CartClient';

export default class ReadyListener extends Listener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			category: 'client'
		});
	}

	public async exec(): Promise<void> {
		this.client.logger.info(`[READY] ${this.client.user!.tag} is ready.`);

		if (this.client.user!.id !== '595775542569992192') return;

		for (const [id, g] of this.client.guilds.cache) {
			const doc = this.client.settings.guilds.get(id);
			if (!doc) {
				this.client.settings.new('guild', {
					id,
					prefix: 'a',
					ownerID: g.ownerID,
					allowed: false,
					privateChannel: null,
					publicChannel: null,
					cooldown: 5000,
					max: 50
				});
				this.client.logger.info(`[SETTINGS] Created a guild document for ${g.name}.`);
			}

			setInterval(async () => {
				g.presences.cache.clear();
			}, 1000);
		}

		for (const c of this.client.settings.clients.values()) {
			if (!c.active) continue;
			const child = new CartClient({
				token: c.token,
				owner: this.client.ownerID,
				color: c.color,
				footerIcon: c.footerIcon,
				footerText: c.footerText,
				emoji: c.emoji
			});
			await child.load();
			await child.login(c.token);
			child.settings = this.client.settings;
			this.client.logger.info(`[CHILD MANAGER] Successfully launched ${child.user!.tag} (${child.user!.id})`);
		}
	}
}

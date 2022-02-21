import { Listener } from 'discord-akairo';

export default class DebugListener extends Listener {
	public constructor() {
		super('debug', {
			emitter: 'client',
			event: 'debug',
			category: 'client'
		});
	}

	public async exec(event: any): Promise<void> {
		if (this.client.token !== process.env.TOKEN) return;
		this.client.logger.info(`[DEBUG] ${event}`);
	}
}

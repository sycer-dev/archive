import { Listener } from 'discord-akairo';

export default class DebugListener extends Listener {
	public constructor() {
		super('debug', {
			emitter: 'client',
			event: 'debug',
			category: 'client',
		});
	}

	public exec(info: string): void {
		this.client.logger.debug(`[DEBG] ${info}`);
	}
}

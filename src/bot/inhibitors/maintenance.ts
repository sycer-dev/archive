import { Inhibitor } from 'discord-akairo';
import type { Message } from 'discord.js';

export default class MaintenanceModeInhibitor extends Inhibitor {
	public constructor() {
		super('maintenance', {
			reason: 'maintenance',
		});
	}

	public exec(msg: Message): boolean {
		if (this.client.maintenance && !this.client.ownerID.includes(msg.author.id)) return true;
		return false;
	}
}

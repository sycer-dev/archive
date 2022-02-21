import { Message } from 'discord.js';
import { Reminder } from '../models/Reminder';
import ToolClient from './ToolClient';

export default class ReminderHandler {
	protected client: ToolClient;

	protected rate: number;

	protected interval!: NodeJS.Timeout;

	public waiting: Set<string>;

	public constructor(client: ToolClient, { rate = 1000 * 60 } = {}) {
		this.client = client;
		this.rate = rate;
		this.waiting = new Set();
	}

	public async fire(r: Reminder): Promise<Message | Message[] | void> {
		this.client.settings.set('reminder', { _id: r._id }, { actionProcessed: true });
		try {
			const user = await this.client.users.fetch(r.userID);
			if (user) await user.send(`[REMINDER] ${r.reason}`);
		} catch {}
	}

	public queue(r: Reminder): void {
		this.client.logger.verbose(
			`[REMINDER HANDLER] Setting ${r.id} timeout, ${(r.triggerAt.getTime() - Date.now()) / 2} seconds left.`,
		);
		this.waiting.add(r.id);
		this.client.setTimeout(() => {
			this.fire(r);
			this.waiting.delete(r.id);
		}, r.triggerAt.getTime() - Date.now());
	}

	private _check(): void {
		const reminders = this.client.settings.reminder.filter(
			g => !g.actionProcessed && g.clientID === this.client.user!.id,
		);
		const now = Date.now();
		if (reminders.size === 0) return;
		for (const r of reminders.values()) {
			if (r.triggerAt.getTime() - now <= this.rate) this.queue(r);
			if (!this.waiting.has(r.id) && now > r.triggerAt.getTime()) this.fire(r);
		}
	}

	public async init(): Promise<void> {
		this._check();
		this.interval = this.client.setInterval(this._check.bind(this), this.rate);
	}
}

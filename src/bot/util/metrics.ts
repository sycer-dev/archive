import { Gauge, register, collectDefaultMetrics } from 'prom-client';
import { User, Guild } from '../../database';

export default class Metrics {
	public constructor() {
		collectDefaultMetrics({ prefix: 'smsnext_' });
	}

	public readonly metrics = (() => {
		const metrics = {
			userCount: new Gauge({
				name: 'smsv2_user_count',
				help: 'Total number of users registered with sycerSMS.',
				async collect() {
					const userCount = await User.count();
					this.set(userCount);
				},
			}),
			smsCount: new Gauge<string>({
				name: 'smsv2_sms_count',
				help: 'Total number of text messages sent with sycerSMS.',
				async collect() {
					const [{ total }]: { total: string }[] = await Guild.query(`SELECT SUM(count) AS total FROM logs`);
					this.set(parseInt(total, 10));
				},
			}),
			register,
		};

		return metrics;
	})();

	public async getStats() {
		const userCount = await User.count();
		const [{ smsCount }]: { smsCount: string }[] = await Guild.query(`SELECT SUM(count) AS smsCount FROM logs`);

		return { userCount, smsCount };
	}
}

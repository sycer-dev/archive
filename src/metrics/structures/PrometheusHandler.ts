import { register, Registry, GaugeConfiguration, Gauge } from 'prom-client';
import { Collection } from 'discord.js';

export interface PrometheusOptions {
	gauges: GaugeConfiguration<string>[];
	path: '/metrics';
	port: number;
	prefix: string;
}

export default class PrometheusHandler {
	private readonly options: PrometheusOptions;
	private readonly _gauges: Collection<string, Gauge<string>> = new Collection();

	public readonly registry: Registry = register;

	public constructor(options: PrometheusOptions) {
		this.options = options;
	}

	public set(metric: string, value: number): void {
		const met = this._gauges.get(metric);
		if (met) met.set(value);
	}

	public inc(metric: string, value?: number) {
		const met = this._gauges.get(metric);
		if (met) met.inc(value ?? 1);
	}

	private _registerGauge(config: GaugeConfiguration<string>): Gauge<string> {
		const gauge = new Gauge({
			...config,
			name: `${this.options.prefix}${config.name}`,
		});
		this._gauges.set(config.name, gauge);
		return gauge;
	}

	private registerGauges(): this {
		for (const gauge of this.options.gauges) this._registerGauge(gauge);

		return this;
	}

	public init(): void {
		this.registerGauges();
	}
}

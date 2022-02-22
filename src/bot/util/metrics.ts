import PrometheusHandler from '../../metrics/structures/PrometheusHandler';

export const metrics = new PrometheusHandler({
	port: 5505,
	path: '/metrics',
	prefix: 'success_poster_',
	gauges: [
		{
			name: 'messages',
			help: 'The total amount of messages the system has seen.',
		},
		{
			name: 'guilds',
			help: 'The total number of guilds the system is in.',
		},
		{
			name: 'commands',
			help: 'The total number of commands the system has processed.',
		},
		{
			name: 'gateway_events',
			help: 'The total amount of gateway events the system has seen.',
		},
		{
			name: 'users',
			help: 'The average amount of users in cache.',
		},
		{
			name: 'posts',
			help: 'The total amount of success posts the system has processed.',
		},
	],
});

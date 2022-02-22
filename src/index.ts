import ParentClient from './bot/client/SuccessClient';
import { metrics } from './bot/util/metrics';

(async () => {
	metrics.init();
	const parent = new ParentClient({
		owners: process.env.OWNERS!.split(','),
		color: process.env.COLOR!,
		// credentials for 19131940
		twitConfig: {
			consumer_key: '',
			consumer_secret: '',
			access_token: '',
			access_token_secret: '',
		},
		token: process.env.TOKEN!,
		isParent: true,
	});

	parent._metricsClient = metrics;
	await parent.settings.init();

	await parent.launch();
	await new Promise((resolve) => setTimeout(resolve, 3000));
	const clients = parent.settings.cache.clients
		.filter((c) => c.id !== parent.user!.id)
		.map(async (child) => {
			const { config } = child;
			// const twitConfig = child.newFormat
			// 	? (config as TwitterOptions)
			// 	: {
			// 			api_key: (config as DeprecatedKeysFormat).consumer_key,
			// 			api_secret: (config as DeprecatedKeysFormat).consumer_secret,
			// 			access_token: config.access_token,
			// 			access_token_secret: config.access_token_secret,
			// 	  };

			const client = new ParentClient({
				owners: parent.ownerID,
				color: Number(child.color!),
				twitConfig: config,
				token: child.token,
			});
			client.parent = parent;
			parent.children.push(client);
			return client.launch();
		});

	await Promise.all(clients);

	parent.sendProm = true;
})();

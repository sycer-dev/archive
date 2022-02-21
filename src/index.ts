import CartClient from './bot/classes/CartClient';

(async () => {
	const main = new CartClient({
		token: process.env.TOKEN!,
		owner: '492374435274162177',
		color: process.env.COLOR!,
		footerIcon: 'https://avatars1.githubusercontent.com/u/51143171',
		footerText: 'Powered by Sycer Development',
		emoji: '🛒'
	});

	main.launch();
})();


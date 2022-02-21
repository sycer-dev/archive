import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '..', '.env') });

import ParentClient from './bot/classes/ToolClient';
import Settings from './bot/classes/SettingsProvider';

(async () => {
	const parent = new ParentClient({
		owners: process.env.OWNERS!.split(','),
		color: Number(process.env.COLOR!),
		prefix: process.env.PREFIX!,
		token: process.env.TOKEN!,
	});

	parent.settings = new Settings(parent);
	await parent.settings.init();

	await parent.launch();

	for (const c of parent.settings.child.values()) {
		if (c.id === parent.user!.id) continue;
		const child = new ParentClient({
			owners: parent.ownerID,
			color: c.color,
			prefix: process.env.PREFIX!,
			token: c.token,
		});
		child.settings = parent.settings;
		child.launch();

		parent.children.push(child);
	}
})();

process.on('unhandledRejection', err => {
	console.error('An unhandled promise rejection occured');
	console.error(err);
});

import { Command, Argument } from 'discord-akairo';
import { Message } from 'discord.js';

export default class WebHookCommand extends Command {
	public constructor() {
		super('webhook', {
			category: 'configuration',
			channel: 'guild',
			aliases: ['log', 'success-log'],
			args: [
				{
					id: 'link',
					type: Argument.validate('string', (_, p) => p.includes('https://discordapp.com/api/webhooks')),
					prompt: {
						start: 'What do you want to set the logging webhook to?',
						retry: "C'mon. I need a legit webhook.",
						optional: true,
					},
				},
				{
					id: 'off',
					flag: ['--off', '-disable'],
				},
			],
			userPermissions: ['MANAGE_WEBHOOKS'],
			clientPermissions: ['MANAGE_WEBHOOKS'],
			description: {
				content: 'Assigns a webhook for success-logging.',
				usage: '<link>',
				examples: ['', '--off', 'https://discordapp.com/api/webhooks.....'],
			},
		});
	}

	public async exec(msg: Message, { link, off }: { link: string; off: boolean }): Promise<Message | Message[] | void> {
		if (off) {
			await this.client.settings.set('client', { id: this.client.user!.id }, { successLog: undefined });
			return msg.util?.send(`Successfully **removed** the log webhook.`);
		}

		const hooks = await msg.guild!.fetchWebhooks();

		if (!link) {
			const query = this.client.settings.cache.clients.get(this.client.user!.id)!.successLog;
			if (!query) return msg.util?.reply('there is no current logging webhook configured.');
			const link = query.split('/');
			const id = link[link.length - 2];
			const hook = hooks.get(id);
			if (!hook)
				return msg.util?.reply(
					'the previously configured webhook was deleted. This is a big problemo. Please set a new one before I blow up.',
				);
			return msg.util?.reply(
				`the current webhook link is **${hook.name}** in ${this.client.channels.cache.get(hook.channelID)}.`,
			);
		}

		const hook = link.split('/');
		const id = hook[hook.length - 2];
		if (!id || !hooks.has(id)) return msg.util?.reply("that webhook doesn't exist! You 'aint foolin' me.");
		await this.client.settings.set('client', { id: this.client.user!.id }, { successLog: link });
		const client = hooks.get(id);
		const m = await msg.reply('sending test payload...');
		await client!.send(this.client.util.embed().setColor(this.client.config.color));
		return m.edit(
			`${msg.author}, successfully set the logging webhook to **${client!.name}** in ${this.client.channels.cache.get(
				client!.channelID,
			)}.`,
		);
	}
}

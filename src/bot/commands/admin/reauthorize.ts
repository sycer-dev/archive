import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import Twitter from 'twit';

export default class extends Command {
	public constructor() {
		super('reauthorize', {
			category: 'configuration',
			channel: 'guild',
			aliases: ['reauthorize', 'reauth'],
			userPermissions: ['MANAGE_GUILD'],
			description: {
				content: 'Reauthoizes your success Twitter account to process success posts.',
			},
			ratelimit: 120,
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const client = this.client.settings.cache.clients.get(this.client.user!.id);
		if (!client) return msg.util?.reply('no.');

		const sessionID = this.client.parent.newHandler.generateSession();

		await msg.channel.send(
			`Please go to <https://external.sycer.dev/success/new/start?session=${sessionID}> to reauthorize.`,
		);

		this.client.parent.successAPI.app.once(`error_${sessionID}`, (err: string) => {
			console.error(err);
			msg.util?.reply(`an error occurred when trying to authenticate you.\n\nError: \`${err}\`.`);
		});

		this.client.parent.successAPI.app.once(
			`internally_authenticated_${sessionID}`,
			async (access_token: string, access_token_secret: string) => {
				const exists = this.client.settings.cache.clients.find((c) => c.id === this.client.user!.id)!;
				const config = {
					consumer_key: this.client.parent.config.twitConfig.consumer_key,
					consumer_secret: this.client.parent.config.twitConfig.consumer_secret,
					access_token,
					access_token_secret,
				};

				await this.client.settings.set(
					'client',
					{ _id: exists._id },
					{
						config,
					},
				);

				this.client.config.twitConfig = config;
				this.client.twitter.twitter = new Twitter(config);

				return msg.util?.reply(`successfully updated my twitter credentials!`);
			},
		);
	}
}

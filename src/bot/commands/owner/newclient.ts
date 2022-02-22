import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import Twitter, { ConfigKeys } from 'twit';
import { Client as ClientModel } from '../../../database/models/Client';
import SuccessClient from '../../client';
import fetch from 'node-fetch';

export interface APIUserData {
	id: string;
	username: string;
	discriminator: string;
	avatar: string | null;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	locale?: string;
	verified?: boolean;
	email?: string | null;
}

export default class NewClientCommand extends Command {
	public constructor() {
		super('newclient', {
			ownerOnly: true,
			category: 'owner',
			aliases: ['newclient'],
			description: {
				content: 'Collects info and creates a new client.',
			},
			args: [
				{
					id: 'token',
					type: 'string',
					prompt: {
						start: "Please provide the Discord Bot's token.",
					},
				},
			],
			clientPermissions: ['EMBED_LINKS'],
		});
	}

	public async exec(msg: Message, { token }: { token: string }): Promise<Message | Message[] | void> {
		const m = await msg.channel.send('Verifying Discord Token...');

		let user: APIUserData | null = null;
		try {
			const res = await fetch('https://discord.com/api/users/@me', {
				headers: {
					Authorization: `Bot ${token}`,
				},
			});
			if (res.ok) {
				user = (await res.json()) as APIUserData;
			}
		} catch (err) {
			return m.edit(`Error Validating Token: \`${err}\`. Setup cancelled.`);
		}
		await msg.delete();
		const tag = `${user!.username}#${user!.discriminator}`;
		msg.author.send(`The token for ${tag} (\`${user!.id}\`) is ||${token}||.`);

		const invite = `https://fyko.net/bot?id=${user!.id}&p=8`;

		await m.edit('Token verified! Launching Twitter OAuth server...');

		const sessionID = this.client.newHandler.generateSession();

		await m.edit(
			`Please go to <https://external.sycer.dev/success/new/start?session=${sessionID}> to continue with setup.`,
		);

		this.client.successAPI.app.once(`error_${sessionID}`, (err: string) => {
			console.error(err);
			void msg.util?.reply(`an error occurred when trying to authenticate that user.\n\nError: \`${err}\`.`);
		});

		this.client.successAPI.app.once(
			`internally_authenticated_${sessionID}`,
			async (access_token: string, access_token_secret: string) => {
				const exists = this.client.settings.cache.clients.find((c) => c.id === user!.id);
				const config = {
					consumer_key: this.client.config.twitConfig.consumer_key,
					consumer_secret: this.client.config.twitConfig.consumer_secret,
					access_token,
					access_token_secret,
				};

				if (exists) {
					await this.client.settings.set(
						'client',
						{ _id: exists._id },
						{
							config,
						},
					);
					const child = this.client.children.find((c) => c.user?.id === exists.id);
					if (child) {
						child.config.twitConfig = config;
						child.twitter.twitter = new Twitter(config);
						return msg.util?.reply(`successfully updated \`${tag}\`'s twitter credentials!`);
					}
				} else
					await this.client.settings.new('client', {
						id: user!.id,
						token,
						used: true,
						prefix: '$',
						newFormat: true,
						config,
						mode: 0,
					});

				const doc = this.client.settings.cache.clients.find((c) => c.id === user!.id)!;
				this.launchClient(doc);
				return msg.util?.send(
					`Successfully created and launched a new client for ${tag} (${user!.id}).\nInvite link: <${invite}>`,
				);
			},
		);
	}

	public async launchClient(client: ClientModel): Promise<string> {
		const child = new SuccessClient({
			owners: this.client.ownerID,
			token: client.token,
			color: client.color!,
			twitConfig: client.config as ConfigKeys,
		});
		// @ts-ignore
		child.parent = this.client;

		return child.launch();
	}
}

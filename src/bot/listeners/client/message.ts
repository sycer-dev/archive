import { stripIndents } from 'common-tags';
import { Listener } from 'discord-akairo';
import { Message, Permissions, TextChannel } from 'discord.js';
import { Twitter } from 'twit';

export default class MessageListener extends Listener {
	public constructor() {
		super('message', {
			emitter: 'client',
			event: 'message',
			category: 'client',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		if (!msg.author || msg.author.bot) return;
		const client = this.client.settings.cache.clients.get(this.client.user!.id)!;

		if (client.blocklist.includes(msg.author.id)) return;
		if (!client.channels.includes(msg.channel.id) && msg.guild) return;
		if (!msg.attachments.size) return;

		// mode 0 = disabled
		if (client.mode === 0) return;

		if (!msg.guild) {
			return this._handleAnon(msg);
		}

		const successCount =
			(await this.client.settings.get('post', { clientID: this.client.user!.id }, false))!.length + 1;
		const userCount =
			(await this.client.settings.get('post', { clientID: this.client.user!.id, userID: msg.author.id }, false))!
				.length + 1;
		// mode 1 = automatic
		if (client.mode === 1) {
			await this.client.settings.new('post', {
				clientID: this.client.user!.id,
				userID: msg.author.id,
				channelID: msg.channel.id,
				messageID: msg.id,
				sent: false,
				approved: null,
			});

			const embed = this.client.util
				.embed()
				.setTimestamp()
				.setColor(this.client.config.color)
				.setThumbnail(this.client.user!.displayAvatarURL())
				.setFooter(`Success Post #${successCount}`)
				.setTitle(`${msg.guild.name} Success`).setDescription(stripIndents`
                    Thank you for posting your success photo${msg.attachments.size === 1 ? '' : 's'}!
                    You've posted a total of ${userCount} success posts for us.
                    
                    **Mode**: Automatic
                    **Status**: Uploading...
                `);

			const m = (await msg.author.send({ embed }).catch(() => null)) as Message;
			let tweet: Twitter.Status | null = null;

			try {
				tweet = await this.client.twitter.tweet(msg);
				if (!tweet || !tweet.id_str) throw Error(`${tweet}`);
			} catch (err) {
				embed.setDescription(stripIndents`
                    Thank you for posting your success photo${msg.attachments.size === 1 ? '' : 's'}!
                    You've posted a total of ${userCount} success posts for us.

                    **Mode**: Automatic
                    **Status**: **FAILED**
                    **Error Message**: \`${err}\`
                `);
				return m.edit({ embed });
			}

			await this.client.settings.set(
				'post',
				{ messageID: msg.id },
				{
					panelID: m ? m.id : undefined,
					approvalPanelID: undefined,
					sent: true,
					approved: undefined,
					tweetID: tweet.id_str,
				},
			);

			embed.setDescription(stripIndents`
                Thank you for posting your success photo${msg.attachments.size === 1 ? '' : 's'}!
                You've posted a total of ${userCount} success posts for us.

                **Mode**: Automatic
                **Status**: Uploaded
                **Link**: [Open in Browser](https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}/)
			`);
			if (msg.channel instanceof TextChannel && msg.channel.permissionsFor(this.client.user!.id)?.has('ADD_REACTIONS'))
				await msg.react('👍');
			m.edit({ embed });
			if (client.successLog) {
				try {
					const hook = await this.client.fetchWebhook(client.successLog.split('/')[5]);
					return hook.send(
						`[SUCCESS POST] Successfully processed Success Post #${successCount} for ${msg.author.tag} (${msg.author.id})`,
					);
				} catch {}
			}
		} else if (client.mode === 2) {
			const panel = this.client.util
				.embed()
				.setColor(this.client.config.color)
				.setAuthor(`Success from ${msg.author.tag}`, msg.author.displayAvatarURL())
				.setImage(msg.attachments.first()!.proxyURL)
				.setDescription('Please react with 🐦 to approve or 🗑 to deny this success post.');
			let panelMsg;
			try {
				const hook = await this.client.fetchWebhook(client.approvalLog!.split('/')[5]);
				panelMsg = await hook.send({ embeds: [panel] });
			} catch (err) {
				this.client.logger.error(`[ERROR in message.ts, line 99] ${err}`);
				return msg.reply(
					"I couldn't process your success post because there is no approval channel set in this server!",
				);
			}

			const embed = this.client.util
				.embed()
				.setTimestamp()
				.setColor(this.client.config.color)
				.setThumbnail(this.client.user!.displayAvatarURL())
				.setFooter(`Success Post #${successCount}`)
				.setTitle(`${msg.guild.name} Success`).setDescription(stripIndents`
                    Thank you for posting your success photo${msg.attachments.size === 1 ? '' : 's'}!
                    You've posted a total of ${userCount} success posts for us.
                    
                    **Mode**: Approval
                    **Status**: Pending Approval...
                `);

			const m = await msg.author.send({ embed }).catch(() => null);
			await this.client.settings.new('post', {
				clientID: this.client.user!.id,
				userID: msg.author.id,
				channelID: msg.channel.id,
				messageID: msg.id,
				panelID: m?.id,
				approvalPanelID: panelMsg.id,
				sent: false,
				approved: false,
			});

			await panelMsg.react('🐦');
			await panelMsg.react('🗑');
			return m || msg;
		}
	}

	private async _handleAnon(msg: Message): Promise<Message | Message[] | void> {
		const { member, allowAnonymous, successLog, channels } = this.client.settings.cache.clients.get(
			this.client.user!.id,
		)!;
		if (!allowAnonymous) {
			return msg.author.send(
				`Sorry! Anonymous mode is currently disabled. Please ask an admin to enable it if you wish to post success anonymously.`,
			);
		}
		if (!member) {
			return msg.author.send(
				`Sorry! There is no configured Member role. Therefore, I cannot handle your anonymous success. Please ask an admin to set the member role.`,
			);
		}
		const members = this.client.guilds.cache.flatMap((m) => m.members.cache).filter((m) => m.roles.cache.has(member));
		const hasRole = members.some((m) => m.roles.cache.has(member));
		if (!hasRole)
			return msg.util?.reply(
				`Sorry chap! You're not authorized to post anonymous success because you don't have the configured Member role.`,
			);

		const successCount =
			(await this.client.settings.get('post', { clientID: this.client.user!.id }, false))!.length + 1;
		const userCount =
			(await this.client.settings.get('post', { clientID: this.client.user!.id, userID: msg.author.id }, false))!
				.length + 1;

		await this.client.settings.new('post', {
			clientID: this.client.user!.id,
			userID: msg.author.id,
			channelID: msg.channel.id,
			messageID: msg.id,
			sent: false,
			approved: null,
		});

		const embed = this.client.util
			.embed()
			.setTimestamp()
			.setColor(this.client.config.color)
			.setThumbnail(this.client.user!.displayAvatarURL())
			.setFooter(`Success Post #${successCount}`)
			.setTitle(`${this.client.user?.username}`).setDescription(stripIndents`
				Thank you for posting your success photo${msg.attachments.size === 1 ? '' : 's'}!
				You've posted a total of ${userCount} success posts for us.
				
				**Mode**: Automatic
				**Status**: Uploading...
			`);

		const m = (await msg.author.send({ embed }).catch(() => null)) as Message;
		let tweet: Twitter.Status | null = null;

		try {
			tweet = await this.client.twitter.tweet(msg, true);
			if (!tweet || !tweet.id_str) throw Error(`${tweet}`);
		} catch (err) {
			embed.setDescription(stripIndents`
				Thank you for posting your success photo${msg.attachments.size === 1 ? '' : 's'}!
				You've posted a total of ${userCount} success posts for us.

				**Mode**: Automatic
				**Status**: **FAILED**
				**Error Message**: \`${err}\`
			`);
			return m.edit({ embed });
		}

		await this.client.settings.set(
			'post',
			{ messageID: msg.id },
			{
				panelID: m ? m.id : undefined,
				approvalPanelID: undefined,
				sent: true,
				approved: undefined,
				tweetID: tweet.id_str,
			},
		);

		embed.setDescription(stripIndents`
			Thank you for posting your success photo${msg.attachments.size === 1 ? '' : 's'}!
			You've posted a total of ${userCount} success posts for us.

			**Mode**: Automatic
			**Status**: Uploaded
			**Link**: [Open in Browser](https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}/)
		`);
		m.edit({ embed });
		if (successLog) {
			try {
				const hook = await this.client.fetchWebhook(successLog.split('/')[5]);
				return hook.send(
					`[SUCCESS POST] Successfully processed Success Post #${successCount} for ${msg.author.tag} (${msg.author.id})`,
				);
			} catch {}
		}
		if (channels.length) {
			const resolvedChannels = channels.map((c) => this.client.channels.cache.get(c) as TextChannel);
			const successChannel = resolvedChannels.find((c) => c.name.includes('success'));
			if (successChannel) {
				if (
					successChannel
						.permissionsFor(this.client.user?.id!)
						?.has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.ATTACH_FILES])
				) {
					await successChannel.send(`Success from an Anonymous User`, {
						files: msg.attachments.map((i) => i.url),
					});
				}
			}
		}
	}
}

import { Listener } from 'discord-akairo';
import { Message, MessageReaction, User, TextChannel } from 'discord.js';

export default class MessageReactionAddListener extends Listener {
	public constructor() {
		super('messageReactionAdd', {
			emitter: 'client',
			event: 'messageReactionAdd',
			category: 'client',
		});
	}

	public async exec(reaction: MessageReaction, user: User): Promise<Message | Message[] | void> {
		let msg = reaction.message;
		if (msg.partial) msg = await msg.fetch();
		if (user.bot || !msg.guild) return;
		const emoji = reaction.emoji.name;

		if (emoji === '🗑') {
			if (msg.guild) {
				const approvalPanel = await this.client.settings.get('post', {
					approvalPanelID: msg.id,
				});
				if (!approvalPanel) return;

				const u = await this.client.users.fetch(approvalPanel.userID).catch(() => null);
				if (!u) return;

				const _panel = await u.createDM().catch(() => null);
				if (!_panel) return;

				const message = await _panel.messages.fetch(approvalPanel.panelID).catch(() => null);
				if (!message) return;

				const embed = this.client.util.embed(message.embeds[0]);
				embed.description = embed.description!.replace('Pending Approval...', 'Denied');
				if (message.editable) await message.edit({ embed });

				if (msg.deletable) return msg.delete();
			}
		} else if (emoji === '🐦') {
			const approvalPanel = await this.client.settings.get('post', {
				approvalPanelID: msg.id,
			})!;
			if (!approvalPanel) return;

			try {
				const m = await msg.channel.send('Processing tweet...');
				const message = await (this.client.channels.cache.get(approvalPanel.channelID) as TextChannel).messages
					.fetch(approvalPanel.messageID)
					.catch(() => null);

				const u = await this.client.users.fetch(approvalPanel.userID).catch(() => null);
				if (!u) {
					await m.edit(`Tweet processing failed. Reason: \`I couldn't find that user!\`.`);
					await msg.delete().catch(() => undefined);
					return void setTimeout(() => m.delete(), 10000);
				}

				const _panel = await u.createDM();
				if (!_panel) {
					await m.edit(`Tweet processing failed. Reason: \`I couldn't find that user!\`.`);
					await msg.delete().catch(() => undefined);
					return void setTimeout(() => m.delete(), 10000);
				}

				const panel = await _panel.messages.fetch(approvalPanel.panelID).catch(() => null);

				if (!message) {
					await m.edit(`Tweet processing failed. Reason: \`The user's message was deleted!\`.`);
					await msg.delete().catch(() => undefined);
					return void setTimeout(() => m.delete(), 10000);
				}

				if (!panel) {
					await m.edit(`Tweet processing failed. Reason: \`The success posts' panel was deleted!\`.`);
					await msg.delete().catch(() => undefined);
					return void setTimeout(() => m.delete(), 10000);
				}

				const tweet = await this.client.twitter.tweet(message).catch(async (err: Error) => {
					this.client.logger.error(`[ERROR on reactionAdd, line 53.`, err);
					await m.edit(`Tweet processing failed. Reason: \`${tweet}\`.`);
					await msg.delete().catch(() => undefined);
					return void setTimeout(() => m.delete(), 10000);
				});

				if (!tweet || tweet instanceof Message) return;

				await m.edit('Successfully processed.').catch(() => undefined);

				await msg.delete().catch(() => undefined);
				setTimeout(() => m.delete().catch(() => undefined), 10000);

				const embed = this.client.util.embed(panel.embeds[0]);
				// @ts-ignore
				embed.description = embed.description.replace(
					'Pending Approval...',
					`Approved\n**Link**: [Open in Browser](https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}/)`,
				);
				return panel.edit({ embed });
			} catch (err) {
				this.client.logger.error(`[ERROR ON TWEET APPROVAL] ${err}`);
			}
		}
	}
}

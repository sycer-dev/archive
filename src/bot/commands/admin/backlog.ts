import ms from '@naval-base/ms';
import { Command } from 'discord-akairo';
import { Message, TextChannel, Util } from 'discord.js';
import { messageHasImages } from '../../util';

export default class BacklogCommand extends Command {
	public constructor() {
		super('backlog', {
			aliases: ['backlog'],
			description: {
				content: 'Fetchs all messages in the range you provide and will process them as success posts.',
				usage: '<channel> <oldest message> <youngest message>',
				examples: ['#success 703305213754212413 703305525697314868'],
			},
			category: 'configuration',
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'What channel would you like to?',
						retry: 'What channel would you like to index? Please provide a valid channel',
						optional: true,
					},
				},
				{
					id: 'first',
					type: 'string',
					prompt: {
						start: "what is the oldest message you'd like to fetch?",
						retry: "please provide the ID of the oldest message you'd like to fetch.",
					},
				},
				{
					id: 'second',
					type: 'string',
					prompt: {
						start: "what is the youngest message you'd like to fetch?",
						retry: "please provide the ID of the youngest message you'd like to fetch.",
					},
				},
			],
		});
	}

	private readonly delay = 5000;

	private async _handleBacklog(messages: Message[]): Promise<void> {
		for (const m of messages) {
			await Util.delayFor(this.delay);
			await this.client.twitter.tweet(m);
		}
	}

	public async exec(
		msg: Message,
		{ channel, first, second }: { channel: TextChannel; first: string; second: string },
	): Promise<Message | Message[] | void> {
		const doc = await this.client.settings.get('client', {
			id: this.client.user?.id,
		});
		if (!doc || !doc.channels.includes(channel.id))
			return msg.util?.reply(
				`${channel} isn't configured as one of your success channels! Please add it before you index the channel.`,
			);

		const m = await msg.channel.send('Fetching messages...');
		const msgs = await channel.messages.fetch({
			limit: 100,
			after: first,
			before: second,
		});
		const filteredMessages = msgs.filter((m) => messageHasImages(m));

		if (!msgs.size) return msg.util?.reply("operation exited - didn't fetch any messages.");
		await m.edit(`Successfully fetched ${msgs.size} messages! Filtering...`);

		const posts = await this.client.settings.get('post', { clientID: this.client.user?.id }, false);
		const has = (messageID: string) => posts.some((p) => p.messageID === messageID);
		const filtered = filteredMessages.filter(({ id }) => !has(id));

		if (!filtered.size)
			return m.edit(
				`Index complete! All of \`${posts.length.toLocaleString('en-US')}\` posts have already been processed!`,
			);

		this._handleBacklog(filtered.array());

		if (m.deletable) m.delete().catch(() => undefined);

		return msg.util?.reply(
			`successfully indexed ${channel}. Queued ${filtered.size} posts for processing. This will take about ${ms(
				this.delay * filtered.size,
				true,
			)}`,
		);
	}
}

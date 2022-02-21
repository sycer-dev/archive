import { stripIndents } from 'common-tags';
import { Message, MessageReaction, Snowflake, TextChannel, User } from 'discord.js';
import ms from '@naval-base/ms';
import { Giveaway } from '../models/Giveaway';
import ToolClient from './ToolClient';

interface FetchReactionUsersOptions {
	limit?: number;
	after?: Snowflake;
	before?: Snowflake;
}

export default class GiveawayHandler {
	protected client: ToolClient;

	protected rate: number;

	protected interval!: NodeJS.Timeout;

	public waiting: Set<string>;

	public constructor(client: ToolClient, { rate = 1000 * 60 } = {}) {
		this.client = client;
		this.rate = rate;
		this.waiting = new Set();
	}

	private async fetchUsers(reaction: MessageReaction, after?: string): Promise<User[]> {
		const opts: FetchReactionUsersOptions = { limit: 100, after };
		const reactions = await reaction.users.fetch(opts);
		if (!reactions.size) return [];

		const last = reactions.first()?.id;
		const next = await this.fetchUsers(reaction, last);
		return reactions.array().concat(next);
	}

	public async end(g: Giveaway): Promise<Message | Message[] | void> {
		await this.client.settings.set('giveaway', { messageID: g.messageID }, { complete: true });

		const channel = this.client.channels.cache.get(g.channelID);
		const message = await (channel as TextChannel)?.messages.fetch(g.messageID).catch(() => undefined);
		if (!message || !message.embeds.length) return;

		const reaction = message.reactions.cache.get(g.emoji);
		if (!reaction) return;

		const _users = await this.fetchUsers(reaction);
		const _members = await message.guild!.members.fetch();
		const list = _users.filter(u => u.id !== message.author.id);

		const used: string[] = [];
		if (g.boosted?.length) {
			const boosts = g.boosted.sort((a, b) => b.entries - a.entries);
			for (const b of boosts) {
				for (const [id, m] of _members) {
					if (!m.roles.cache.has(b.string)) continue;
					if (!used.includes(id)) {
						// start i as 1 to account for the initial entry from L32
						for (let i = 1; i < b.entries; i++) list.push(m.user);
						used.push(id);
					}
				}
			}
		}

		const embed = this.client.util
			.embed()
			.setColor(3553599)
			.setTimestamp()
			.setTitle(message.embeds[0].title);

		if (!list.length) {
			embed.setFooter('Ended at').setDescription('No winners! 😒');
			if (message.editable) return message.edit({ content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
			return message;
		}

		const winners = this.draw(list, g.winnerCount);
		this.client.logger.verbose(`[GIVEAWAY HANDLER]: Drew giveaway ${g._id}.`);

		embed
			.setDescription(`**Winner${winners.length === 1 ? '' : 's'}**:\n ${winners.map(r => r.toString()).join('\n')}`)
			.setFooter(`${winners.length} Winner${winners.length === 1 ? '' : 's'} • Ended`)
			.setTimestamp();

		if (message && message.editable) await message.edit({ content: '🎉 **GIVEAWAY ENDED** 🎉', embed });
		if ((message.channel as TextChannel).permissionsFor(this.client.user!)!.has('SEND_MESSAGES'))
			message.channel.send(
				`🎉 Congratulations, ${winners
					.map(u => u.toString())
					.join(', ')
					.substring(0, 1500)}! You won the giveaway for *${g.title}*!`,
			);
	}

	public shuffle<T>(data: T[]): T[] {
		const array = data.slice();
		for (let i = array.length; i; i--) {
			const randomIndex = Math.floor(Math.random() * i);
			[array[i - 1], array[randomIndex]] = [array[randomIndex], array[i - 1]];
		}
		return array;
	}

	public drawOne<T>(shuffled: T[]): T {
		return shuffled[Math.floor(Math.random() * shuffled.length)];
	}

	public draw<T>(array: T[], winners: number, filterDuplicates = true): T[] {
		if (array.length <= winners) return array;
		const shuffled = this.shuffle(array);
		const draw: T[] = [];
		while (draw.length < winners) {
			const w = this.drawOne(shuffled);
			if (filterDuplicates && !draw.includes(w)) draw.push(w);
		}
		return draw;
	}

	public async edit(g: Giveaway): Promise<void> {
		const channel = this.client.channels.cache.get(g.channelID);
		const message = await (channel as TextChannel)?.messages.fetch(g.messageID).catch(() => undefined);
		if (!message || !message.embeds.length) return;

		const baseEmbed = this.client.util.embed(message.embeds[0]);

		const embed = this.client.util.embed(baseEmbed).setDescription(stripIndents`
				**Time Remaining**: ${ms(g.endsAt.getTime() - Date.now(), true)}
										
				React with ${this.client.emojis.cache.get(g.emoji) || g.emoji} to enter!

				__Entries__
				${message.guild!.roles.everyone} - \`1\` Entry
				${g.boosted!.map(e => `<@&${e.string}> - \`${e.entries}\` entries`).join('\n')}
			`);
		if (message.editable) message.edit({ embed });
	}

	public queue(g: Giveaway): void {
		this.client.logger.info(
			`[GIVEAWAY HANDLER] Setting ${g.messageID} timeout, ${(g.endsAt.getTime() - Date.now()) / 2} seconds left.`,
		);
		this.waiting.add(g.messageID);
		this.client.setTimeout(() => {
			this.end(g);
			this.waiting.delete(g.messageID);
		}, g.endsAt.getTime() - Date.now());
	}

	private _check(): void {
		const giveaways = this.client.settings.giveaway.filter(g => !g.complete && g.clientID === this.client.user!.id);
		const now = Date.now();
		if (giveaways.size === 0) return;
		for (const g of giveaways.values()) {
			if (g.endsAt.getTime() - now <= this.rate) this.queue(g);
			if (g.endsAt.getTime() - now >= 5000) this.edit(g);
			if (!this.waiting.has(g.messageID) && now > g.endsAt.getTime()) this.end(g);
		}
	}

	public async init(): Promise<void> {
		this._check();
		this.interval = this.client.setInterval(this._check.bind(this), this.rate);
	}
}

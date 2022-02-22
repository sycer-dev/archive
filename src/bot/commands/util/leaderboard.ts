import { Command } from 'discord-akairo';
import { Message, Collection } from 'discord.js';
import { Post } from '../../../database/models/Post';

export interface User {
	id: string;
	count: number;
}

export default class LeaderboardCommand extends Command {
	public constructor() {
		super('leaderboard', {
			aliases: ['leaderboard', 'top'],
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: "Generates a leaderboard for the top 10 people who've posted success in your server.",
			},
			category: 'utilities',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		const posts = await this.client.settings.get('post', { clientID: this.client.user!.id }, false);
		const embed = this.client.util.embed().setColor(this.client.config.color);

		if (!posts || !posts.length) {
			embed.setDescription('**Nothing to show here!**');
			return msg.util?.send({ embed });
		}

		const all: Collection<string, Post> = new Collection();
		for (const post of posts) all.set(post.id, post);

		let lifetime: Collection<string, User> = new Collection();
		for (const a of all.values()) {
			const doc = lifetime.get(a.userID);
			if (doc) {
				const count = doc.count + 1;
				lifetime.set(a.userID, { id: a.userID, count });
			} else lifetime.set(a.userID, { id: a.userID, count: 1 });
		}

		let month: Collection<string, User> = new Collection();
		for (const a of all.values()) {
			if (!a.createdAt) continue;
			if (a.createdAt.getMonth() !== new Date().getMonth()) continue;
			const doc = month.get(a.userID);
			if (doc) {
				const count = doc.count + 1;
				month.set(a.userID, { id: a.userID, count });
			} else month.set(a.userID, { id: a.userID, count: 1 });
		}

		lifetime = lifetime.sort((a, b) => b.count - a.count);
		month = month.sort((a, b) => b.count - a.count);

		const lifetimeReduced = await Promise.all(
			lifetime.first(10).map(async (u: User) => {
				const user = await this.client.users.fetch(u.id).catch(() => ({ tag: 'Unknown#0000' }));

				return {
					tag: user.tag,
					count: u.count,
				};
			}),
		);

		const monthlyReduced = await Promise.all(
			month.first(10).map(async (u: User) => {
				const user = await this.client.users.fetch(u.id).catch(() => ({ tag: 'Unknown#0000' }));

				return {
					tag: user.tag,
					count: u.count,
				};
			}),
		);

		embed
			.addField(
				'This Month',
				monthlyReduced.length
					? monthlyReduced.map(({ tag, count }, i) => `${1 + i}. **${tag}**: \`${count}\` posts.`)
					: 'Nothing yet!',
			)
			.addField(
				'Lifetime',
				lifetimeReduced.length
					? lifetimeReduced.map(({ tag, count }, i) => `${1 + i}. **${tag}**: \`${count}\` posts.`)
					: 'Nothing yet!',
			);
		embed.setFooter(`${msg.guild!.name} Success Count: ${all.size}`);

		return msg.util?.send({ embed });
	}
}

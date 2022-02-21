import { Listener } from 'discord-akairo';
import { MessageReaction, Message, User } from 'discord.js';
import ms from '@naval-base/ms';

export default class MessageReactionAddListener extends Listener {
	public queue: Set<string>;

	public cooldown: Set<string>;

	public constructor() {
		super('messageReactionAdd', {
			emitter: 'client',
			event: 'messageReactionAdd',
			category: 'client'
		});
		this.queue = new Set();
		this.cooldown = new Set();
	}

	public async exec(reaction: MessageReaction, user: User): Promise<Message | Message[] | void| boolean> {
		if (![reaction.emoji.id, reaction.emoji.name].includes(this.client.config.emoji)) return;

		const cart = this.client.carts!.get(reaction.message.id);
		if (!cart) return;

		if (reaction.message.partial) await reaction.message.fetch();
		if (!reaction.message.guild) return;
		if (reaction.message.author!.id !== this.client.user!.id) return;

		const key = `${reaction.message.guild!.id}:${user.id}`;
		const guild = this.client.settings.guilds.get(reaction.message.guild!.id);
		if (!guild!.allowed) return;
		if (user.bot) return;

		// check if the title says claimed
		if (reaction.message.embeds[0].title === 'Cart Claimed') return;

		// checking if they've hit the max
		const person = this.client.people.get(key);
		if (person && person! >= guild!.max) return;

		// checks if they're still on cooldown
		if (this.client.cooldown.has(key)) return;

		// adds to queue so nobody else can steal
		if (this.queue.has(reaction.message.id)) return;
		this.queue.add(reaction.message.id);

		this.client.logger.info(`[CARTS]: Added ${reaction.message.id} to the queue.`);

		try {
			await user.send(`You can claim another cart in ${ms(guild!.cooldown, true)}.`, { embed: cart });
			this.client.logger.info(`[CARTS]: Sent cart to ${user.tag}.`);
		} catch (err) {
			this.client.logger.error(`[ERROR ON SENDING] [${user.tag}]: ${err}`);
			return this.queue.delete(reaction.message.id);
		}


		const exited = this.client.util.embed()
			.setColor(0x36393F)
			.setFooter(this.client.config.footerText, this.client.config.footerIcon)
			.setTitle('Cart Claimed')
			.setDescription(`This cart was claimed by ${user} \`[${user.tag}]\`!`);
		reaction.message.edit(exited);

		this.client.people.set(key, (person || 0) + 1);

		// add the key to cooldown and rmeove in x seconds
		this.client.cooldown.add(key);
		setTimeout(() => {
			this.client.cooldown.delete(key);
		}, guild!.cooldown);
	}
}

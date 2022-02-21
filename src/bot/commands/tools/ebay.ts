import { Message } from 'discord.js';
import request from 'node-superfetch';
import { delay } from '../../util/util';
import { ToolCommand } from '../../structures/Command';
import ms from '@naval-base/ms';

export default class EbayCommand extends ToolCommand {
	public constructor() {
		super('ebay', {
			channel: 'guild',
			category: 'tools',
			aliases: ['ebay'],
			description: {
				content:
					"Bots an eBay item at a low rate to avoide the lister from being banned. View count will default to the client's requested default view count value.",
				usage: '<link> [times]',
			},
			cooldown: 30,
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'link',
					type: 'string',
					prompt: {
						start: 'What eBay item do you want me to view?',
					},
				},
				{
					id: 'amount',
					type: 'integer',
					default: 50,
				},
			],
		});
	}

	public async exec(msg: Message, { link, amount }: { link: string; amount: string }): Promise<Message | Message[]> {
		if (Number(amount) > 100) return msg.util!.send("You're a funny guy. Try again but with 100 or less.");
		const timeout = Math.floor(Math.random() * (10 - 0.01) * 100) + 10;
		let total = 0;
		for (let i = 0; i < Number(amount); i++) { //eslint-disable-line
			total += timeout;
		}
		if (!link.includes('ebay')) return msg.util!.send("You think I'm that dumb? That 'aint an eBay link.");
		const embed = this.client.util
			.toolEmbed()
			.setTitle('eBay View Bot')
			.setDescription(
				`Processing ${amount} views on [your product](${link}).\nThis should take around ${ms(total, true)}.`,
			);
		await msg.channel.send(embed);
		try {
			for (let i = 0; i < Number(amount); i++) {
				await request.get(link);
				await delay(timeout);
			}
			const done = this.client.util
				.toolEmbed()
				.setTitle('eBay View Bot')
				.setDescription(`Successfully processed ${amount} views on [your product](${link}).`);
			return msg.util!.reply(done);
		} catch (err) {}
		return msg;
	}
}

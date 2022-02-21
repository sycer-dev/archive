import { Message } from 'discord.js';
import { formatNumber } from '../../util/util';
import { ToolCommand } from '../../structures/Command';
import fetch from 'node-superfetch';

interface Fees {
	paypal: number;
	ebay: number;
	goat: number;
	grailed: number;
	stockx: {
		1: number;
		2: number;
		3: number;
		4: number;
	};
}

export default class FeesCommand extends ToolCommand {
	public constructor() {
		super('fees', {
			channel: 'guild',
			category: 'tools',
			aliases: ['fees', 'fees-calc', 'fee'],
			description: {
				content: 'Calculates how much you recieve after fees on popular resale sites/apps like PayPal and eBay. (USD)',
				usage: '<amount>',
			},
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'amount',
					type: 'integer',
					prompt: {
						start: 'how much do you want to convert? Do not use symbols.',
						retry: 'valid number please.',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { amount }: { amount: number }): Promise<Message | Message[]> {
		const req = await fetch.get(`https://fyko.net/tools/fees/${amount}`);
		const body = req.body as { code: number; message: Fees };
		const { paypal, ebay, goat, grailed, stockx } = body.message;

		const embed = this.client.util
			.toolEmbed()
			.setTitle('Fees Calulator')
			.addField('PayPal (2.5% + 30¢)', `$${formatNumber(paypal)}`)
			.addField('eBay (10% + 2.9%)', `$${formatNumber(ebay)}`)
			.addField('GOAT (9.5% + $5)', `$${formatNumber(goat)}`)
			.addField('Grailed (8.9%)', `$${formatNumber(grailed)}`)
			.addField('StockX Tier 1', `$${formatNumber(stockx[1])}`)
			.addField('StockX Tier 2', `$${formatNumber(stockx[2])}`)
			.addField('StockX Tier 3', `$${formatNumber(stockx[3])}`)
			.addField('StockX Tier 4', `$${formatNumber(stockx[4])}`)
			.setDescription(
				`All values are estimations are in no way 100% accurate.\nThey have been formatted in order from lowest to highest.\n\n**Input**: $${amount}`,
			);
		embed.fields.sort(
			({ value }: { value: string }, { value: valueb }: { value: string }) =>
				parseInt(value.split('').pop()!, 10) - parseInt(valueb.split(' ').pop()!, 10),
		); // eslint-disable-line radix
		return msg.util!.send({ embed });
	}
}

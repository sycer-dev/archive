import { Argument } from 'discord-akairo';
import { Message } from 'discord.js';
import request from 'node-superfetch';
import { formatNumber } from '../../util/util';
import { ToolCommand } from '../../structures/Command';
import { CURRENCY } from '../../util/Constants';
const TopFive = ['USD', 'CAD', 'JPY', 'AUD', 'GBP', 'KRW'];

export default class CurrencyCommand extends ToolCommand {
	protected rates = new Map();

	public constructor() {
		super('currency', {
			channel: 'guild',
			category: 'tools',
			aliases: ['currency', 'exchange', 'money'],
			description: {
				content: `Converts a given number value to another currency. Base will default to the client\'s requested currency. Target will default to top five global currencies.\n\nPossible currencies are ${Object.keys(
					CURRENCY,
				)
					.map(c => `\`${c}\``)
					.join(', ')}.`,
				usage: '<amount> [base] [target]',
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
				{
					id: 'base',
					type: Argument.validate('string', (_, p) => p.length === 3),
					default: 'USD' // eslint-disable-line
				},
				{
					id: 'target',
					type: Argument.validate('string', (_, p) => p.length === 3),
				},
			],
		});
	}

	public async exec(
		msg: Message,
		{ amount, base, target }: { amount: number; base: string; target: null | string },
	): Promise<Message | Message[]> {
		base = base.toUpperCase();
		target = target ? target.toUpperCase() : null;
		if (base === target) return msg.util!.reply(`Converting ${base} to ${target} is that same thing, dummy.`);
		try {
			const embed = this.client.util.toolEmbed().setTitle('Currency Exchange');
			if (!target) { // eslint-disable-line
				for (const val of TopFive) {
					if (val === base) continue;
					const rate = await this.fetchRate(base, val);
					embed.addField(CURRENCY[val].name, `${formatNumber(rate * amount)} ${CURRENCY[val].symbol}`, true);
				}
				embed.setDescription('Because you didnt provide a target currency, I provided my favorite 5.');
			} else {
				const rate = await this.fetchRate(base, target);
				embed.addField(
					CURRENCY[target].name,
					`${formatNumber(rate * amount)} ${CURRENCY[target].symbol}`, // eslint-disable-line
					true,
				);
			}
			return msg.util!.send({ embed });
		} catch (err) {
			if (err.status === 400) return msg.util!.reply("You aint foolin' me! Invalid base or target.");
			return msg.util!.reply(`Crap, an error occurred: \`${err.message}\`. Try again later... I guess.`);
		}
	}

	public async fetchRate(base: string, target: string): Promise<any> {
		const query = `${base}-${target}`;
		if (this.rates.has(query)) return this.rates.get(query);
		const { body } = await request.get('https://api.exchangeratesapi.io/latest').query({
			base,
			symbols: target,
		});
		// @ts-ignore
		this.rates.set(query, body.rates[target]);
		setTimeout(() => this.rates.delete(query), 1.8e6);
		// @ts-ignore
		return body.rates[target];
	}
}

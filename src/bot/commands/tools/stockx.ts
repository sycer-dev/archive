import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
import request from 'request-promise';

interface Media {
	imageUrl: string;
	smallImageUrl: string;
	thumbUrl: string;
	gallery: string[];
}

interface Trait {
	filterable: boolean;
	highlight: boolean;
	name: string;
	value: string;
	visible: boolean;
}

interface Item {
	name: string;
	brand: string;
	thumbnail_url: string;
	media: Media;
	url: string;
	categories: string[];
	release_date: string;
	product_category: string;
	ticker_symbol: string;
	make: string;
	model: string;
	short_description: string;
	gender: string;
	colorway: string;
	price: number;
	description?: string;
	highest_bid: number;
	total_dollars: number;
	lowest_ask: number;
	last_sale: number;
	sales_last_72: number;
	deadstock_sold: number;
	quality_bid: number;
	traits: Trait[];
	searchable_traits: {
		Season: string;
		Color: string;
		Colorway: string;
		Style?: string;
		'Release Date': string;
		Retail: number;
		'Retail Price': number;
	};
}

export default class GmailCommand extends ToolCommand {
	public constructor() {
		super('stockx', {
			channel: 'guild',
			category: 'tools',
			aliases: ['stockx'],
			description: {
				content: 'Searches StockX for the item you provide.',
				usage: '<item>',
			},
			cooldown: 3,
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'input',
					type: 'string',
					match: 'restContent',
					prompt: {
						start: 'What item do you want to search on StockX?',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { input }: { input: string }): Promise<Message | Message[]> {
		const m = await msg.channel.send('Fetching item...');
		const get = await this.getItem(encodeURI(input));
		if (typeof get === 'string') return msg.util!.reply(get);
		const item = get[0];
		const release_date = new Date(item.release_date);
		const retail = item.searchable_traits.Retail || item.searchable_traits['Retail Price'] || 'Unknown';
		const embed = this.client.util
			.toolEmbed()
			.setAuthor(item.name, undefined, `https://stockx.com/${item.url}`)
			.setTimestamp(release_date)
			.addField('Retail', `$${retail.toLocaleString('en-US')}`)
			.setThumbnail(item.media.thumbUrl)
			.addField('Brand', item.brand)
			.addField('Color', item.colorway || item.searchable_traits.Color || item.searchable_traits.Colorway || 'Unknown')
			.addField('Highest Bid', `$${item.highest_bid.toLocaleString('en-US')}`)
			.addField('Lowest Ask', `$${item.lowest_ask.toLocaleString('en-US')}`)
			.addField('Last Sale', `$${item.last_sale.toLocaleString('en-US')}`)
			.addField('Sales last 72 hours', `$${item.sales_last_72.toLocaleString('en-US')}`)
			.setFooter(`${item.deadstock_sold} sold • $${item.total_dollars.toLocaleString('en-US')} • Released on`);
		if (item.description)
			embed.setDescription(
				item.description.length > 2048 ? `${item.description.substr(0, 2048)}...` : item.description,
			);
		for (const f of embed.fields) f.inline = true;
		if (m.editable) return m.edit('', embed);
		return msg.util!.send({ embed });
	}

	private async getItem(query: string): Promise<string | Item[]> {
		const url = 'https://xw7sbct9v6-dsn.algolia.net/1/indexes/products/query';

		const opts = {
			url,
			method: 'POST',
			qs: {
				'x-algolia-agent': 'Algolia for vanilla JavaScript 3.22.1',
				'x-algolia-application-id': 'XW7SBCT9V6',
				'x-algolia-api-key': '6bfb5abee4dcd8cea8f0ca1ca085c2b3',
			},
			body: {
				params: `query=${query}&hitsPerPage=15&facets=*`,
			},
			json: true,
		};

		try {
			const res = await request(opts);

			const results = res.hits;

			if (!results || results.length < 1) {
				return 'no products found!';
			}

			return results;
		} catch (err) {
			return `oh no, an error occurred: \`${err}\`.`;
		}
	}
}

import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
import request from 'request-promise';

interface AvailableSize {
	[i: number]: { [j: number]: number };
}

interface Item {
	id: number;
	slug: string;
	name: string;
	sku: string;
	status: string;
	color: string;
	details: string;
	brand_id: number;
	release_date: string;
	special_type: string;
	search_sku: string;
	lowest_price_cents: number;
	new_lowest_price_cents: number;
	used_lowest_price_cents: number;
	available_sizes_new: AvailableSize[];
	minimum_offer_cents: number;
	maximum_offer_cents: number;
	special_display_price_cents: number;
	retail_price_cents: number;
	silhouette: 'Air Jordan 6';
	designer: 'Tinker Hatfield';
	midsole: 'Air';
	nickname: 'Olive';
	upper_material: '';
	internal_shot: 'taken';
	with_defect_for_sale_count: number;
	picture_url: string;
	main_picture_url: string;
	grid_picture_url: string;
	original_picture_url: string;
	release_date_unix: number;
	trending_timestamp_unix: number;
	brand_name: 'Air Jordan';
	three_day_rolling_want_count: number;
	seven_day_rolling_want_count: number;
	want_count: number;
	objectID: '527961';
}

export default class GmailCommand extends ToolCommand {
	public constructor() {
		super('goat', {
			channel: 'guild',
			category: 'tools',
			aliases: ['goat'],
			description: {
				content: 'Searches goat for the item you provide.',
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
						start: 'What item do you want to search on GOAT?',
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
		const retail = item.retail_price_cents / 100;
		const embed = this.client.util
			.toolEmbed()
			.setAuthor(item.name, undefined, `https://goat.com/search?query=${encodeURI(item.sku)}`)
			.setFooter('Released on')
			.setTimestamp(release_date)
			.setThumbnail(item.picture_url)
			.addField('Retail', `$${retail.toLocaleString('en-US')}`)
			.addField('Brand', item.brand_name)
			.addField('Color', item.color)
			.addField('Want Count', item.want_count.toLocaleString('en-US'))
			.addField('Highest Offer', `$${(item.maximum_offer_cents / 100).toLocaleString('en-US')}`)
			.addField('Lowest Offer', `$${(item.lowest_price_cents / 100).toLocaleString('en-US')}`);
		for (const f of embed.fields) f.inline = true;
		if (m.editable) return m.edit('', embed);
		return msg.util!.send({ embed });
	}

	private async getItem(query: string): Promise<string | Item[]> {
		const url = 'https://2fwotdvm2o-dsn.algolia.net/1/indexes/ProductTemplateSearch/query';

		const opts = {
			url,
			method: 'POST',
			qs: {
				'x-algolia-agent': 'Algolia for Swift (4.8.1); iOS (11.2)',
				'x-algolia-application-id': '2FWOTDVM2O',
				'x-algolia-api-key': '7af2c6fc3991edee5a9f375062c19d21',
			},
			body: {
				params: `facetFilters=(status:active, status:active_edit)&hitsPerPage=5&numericFilters=[]&page=0&query=${query}`,
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

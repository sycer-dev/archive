import { Message } from 'discord.js';
import request from 'node-superfetch';
import { ToolCommand } from '../../structures/Command';

interface VariantObject {
	product: Product;
}

interface Variant {
	id: string;
	title: string;
}

interface Image {
	src: string;
}

interface Product {
	id: number;
	title: string;
	body_html: string;
	vendor: string;
	product_type: string;
	createdAt: string;
	handle: string;
	publishedAt: string;
	template_suffix: string;
	tags: string;
	published_scope: string;
	variants: Variant[];
	image: Image;
}

export default class VariantCommand extends ToolCommand {
	public constructor() {
		super('variant', {
			channel: 'guild',
			category: 'tools',
			aliases: ['variants', 'variant', 'atc', 'atcs'],
			description: {
				content: 'Collects all the different links for a Shopify link..',
				usage: '<link>',
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'link',
					type: 'string',
					prompt: {
						start: 'What Shopify item do you want me to format?',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { link }: { link: string }): Promise<Message | Message[]> {
		try {
			const req = await request.get(`${link}.json`);
			const body = req.body as VariantObject;
			const variants = body.product.variants.map(
				a => `${a.title} - https://${link.split('//')[1].split('/')[0]}/cart/${a.id}:1`,
			);
			if (!variants.length) return msg.util!.send("Couldn't find any variants for that link!");
			const embed = this.client.util
				.toolEmbed()
				.setAuthor(body.product.title.toString(), this.client.user!.displayAvatarURL())
				.setThumbnail(body.product.image.src)
				.setDescription(variants.join('\n'));
			return msg.util!.send({ embed });
		} catch (err) {
			return msg.util!.send("Couldn't find any variants for that link.");
		}
	}
}

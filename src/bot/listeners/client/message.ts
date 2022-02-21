import { Listener } from 'discord-akairo';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { Guild } from '../../models/Guild';

export default class MessageListener extends Listener {
	public constructor() {
		super('message', {
			emitter: 'client',
			event: 'message',
			category: 'client'
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | void> {
		if (!msg.guild) return;
		const guild = this.client.settings.guilds.get(msg.guild!.id);
		if (!guild || !msg.webhookID || !msg.embeds.length || !msg.embeds[0] || msg.channel.id !== guild!.privateChannel) return;
		for (const e of msg.embeds) this.createCart(msg, e, guild);
	}

	public async createCart(msg: Message, embed: MessageEmbed, guild: Guild): Promise<Message | Message[] | void> {
		const proxyInfo = embed.fields.find(e => e.name.toLowerCase() === 'proxy');
		if (proxyInfo) {
			const index = embed.fields.indexOf(proxyInfo);
			embed.fields.splice(index, 1);
		}

		const size = embed.fields.find(r => r.name.toLowerCase() === 'size');
		let sku = embed.fields.find(r => ['product', 'sku'].includes(r.name.toLowerCase()));
		if (!sku || !sku.value) {
			sku = embed.fields.find(r => r.name.toLowerCase() === 'product');
		}

		const image = embed.thumbnail ? embed.thumbnail.proxyURL : embed.image ? embed.image.proxyURL : null;

		let panel: MessageEmbed;
		if (embed.footer && embed.footer.text && embed.footer.text.toLowerCase().includes('sole aio adidas mode')) {
			const title = embed.title!.replace(/[|]/ig, '').split(' ');
			const proxyInfo = embed.fields.find(e => e.name.toLowerCase() === 'proxy');
			if (proxyInfo) {
				const index = embed.fields.indexOf(proxyInfo);
				embed.fields.splice(index, 1);
			}

			panel = this.client.util.embed()
				.setColor(msg.guild!.me!.displayColor || this.client.config.color)
				.setFooter(this.client.config.footerText!, this.client.config.footerIcon!)
				.setDescription(`**Size**: ${title[2] || '?'}\n\n**SKU**: ${title[0] || '?'}`);
		} else {
			panel = this.client.util.embed()
				.setColor(msg.guild!.me!.displayColor || this.client.config.color)
				.setFooter(this.client.config.footerText!, this.client.config.footerIcon!)
				.setDescription(`**Size**: ${size ? size.value : '?'}\n\n**SKU**: ${sku ? sku.value : '?'}`);
		}

		if (image) panel.setThumbnail(image);

		const pub = this.client.channels.cache.get(guild.publicChannel!) as TextChannel;
		if (!pub || !pub.permissionsFor(this.client.user!)!.has(['EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL'])) return msg.channel.send(`I'm missing \`Send Messages\`, \`Embed Links\`, or \`View Channel\` in ${pub}!`);

		const m = await pub.send({ embed: panel }) as Message;
		this.client.carts.set(m.id, embed);

		try {
			await m.react(this.client.config.emoji);
		} catch {
			this.client.config.emoji = '🛒';
			await m.react('🛒');
		}

		return m;
	}
}

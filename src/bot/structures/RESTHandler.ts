import twit, { Twitter } from 'twit';
import SuccessClient from '../client/SuccessClient';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { extname } from 'path';
import { TextChannel } from 'discord.js';

export default class RESTHandler {
	protected client: SuccessClient;

	public twitter: twit;

	public constructor(client: SuccessClient) {
		this.client = client;
		this.twitter = new twit(this.client.config.twitConfig);
	}

	public async tweet(msg: Message, anon?: boolean): Promise<Twitter.Status | null> {
		const client = this.client.settings.cache.clients.get(this.client.user!.id);
		const item = client!.format.length ? this.randomElement(client!.format) : `Success from {user} in ${msg.guild!.id}`;
		let text = item.replace(/{user}/gi, anon ? 'Anonymous#0000' : msg.author.username);
		const images = msg.attachments.map((m) => m.url);

		if (client!.includeContent && msg.content) {
			text = `"${msg.content}", ${text}`.substring(0, 280);
		}

		this.client.logger.info(`[REST HANDLER] [${msg.id}] Checking for images... Found: ${images.length} images.`);
		if (!images || !images.length) throw Error('No images!');

		/* encoding images to base 64 because twitter is retarded */
		this.client.logger.info(`[REST HANDLER] [${msg.id}] Encoding ${images.length} images.`);
		const encodedImages: string[] = [];
		for (const [index, img] of images.entries()) {
			const str = await this.encode(img);
			this.client.logger.verbose(
				`[REST HANDLER] [${msg.id}] Encoded Image ${index + 1} of ${images.length}: ${str.substring(0, 15)}...`,
			);
			encodedImages.push(str);
		}
		if (!encodedImages.length) throw Error('Error encoding images!');

		/* uploading images to twitter because twitter is still retarded */
		this.client.logger.info(`[REST HANDLER] [${msg.id}] Uploading ${encodedImages.length} images.`);
		const mediaIDs = [];
		for (const [index, m] of encodedImages.entries()) {
			const up = await this.upload(m);
			if (!up) continue;
			this.client.logger.verbose(`[REST HANDLER] [${msg.id}] Uploaded Image ${index + 1} of ${images.length}: ${up}`);
			mediaIDs.push(up);
		}
		if (!mediaIDs.length) throw Error('Error uploading images to twitter!');

		/* finally posting our tweet with the text template and media IDs */
		this.client.logger.info(`[REST HANDLER] [${msg.id}] Sending update with ${mediaIDs.length} images.`);
		const status = await this.update(text, mediaIDs.splice(0, 4));

		if (typeof status === 'string') throw Error(`Error sending tweet! Reason: ${status}`);

		if (anon) {
			const channel = this.client.channels.cache.get(client?.channels[0] ?? '') as TextChannel | undefined;
			if (channel) {
				const webhooks = await channel.fetchWebhooks();
				const _webhook = webhooks.find((w) => w.name.includes('Anon'));
				const webhook =
					_webhook ??
					(await channel
						.createWebhook('Anonymous', {
							avatar: 'https://cdn.sycer.dev/Qc5rkqn2.png',
						})
						.catch(() => channel));
				// @ts-expect-error
				void webhook.send({ files: msg.attachments.map((a) => a.url) });
			}
		}

		return status;
	}

	public async update(item: string, imgs: string[]): Promise<Twitter.Status | string> {
		const status = item.replace(/@/g, '');
		return this.twitter
			.post('statuses/update', { media_ids: imgs, status })
			.then((obj) => {
				this.client.logger.verbose(`[REST HANDLER] [UPDATE FUNCTION]: Status Code: ${obj.resp.statusCode}`);
				if (obj.data && (obj.data as Twitter.Status).id_str) return obj.data as Twitter.Status;
				return obj.resp.statusMessage || 'Undefined error.';
			})
			.catch((err) => {
				return err;
			});
	}

	public async upload(data: string): Promise<string | null> {
		const post = await this.twitter.post('media/upload', { media_data: data });
		this.client.logger.verbose(`[REST HANDLER] [IMAGE UPLOAD]: Status Code: ${post.resp.statusCode}`);
		const body = post.data as any;

		if (body.media_id_string) return body.media_id_string.toString();
		return post.resp.statusMessage || null;
	}

	public async getTweet(id: string): Promise<Twitter.Status | null> {
		try {
			const get = await this.twitter.get('statuses/show', { id });
			const { data, resp } = get;
			if (resp.statusCode !== 200) {
				this.client.logger.error(`[REST HANDLER] [GET STATUS]: ${resp.statusMessage}`);
				return null;
			}
			// @ts-ignore
			return data as Twitter.Status;
		} catch {}
		return null;
	}

	public async encode(link: string): Promise<string> {
		const request = await fetch(link);
		return (await request.buffer()).toString('base64');
	}

	public randomElement(arr: any[]): any {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	public findAttachments(msg: Message): string[] | undefined | null {
		const images: string[] = [];

		const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.mov'];
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|webp|gif|mp4|mov)/;

		const richEmbed = msg.embeds.find(
			(embed) => embed.type === 'rich' && embed.image && extensions.includes(extname(embed.image.url)),
		);
		if (richEmbed) {
			images.push(richEmbed.image!.url);
		}

		const attachments = msg.attachments.filter((file) => extensions.includes(extname(file.url)));
		if (attachments.size) {
			attachments.forEach((i) => images.push(i.proxyURL));
		}

		if (!attachments.size) {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const linkMatch = msg.content.match(linkRegex);
			if (linkMatch && extensions.includes(extname(linkMatch[0]))) {
				images.push(linkMatch[0]);
			}
		}

		return images;
	}
}

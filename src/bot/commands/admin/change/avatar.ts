import { Message } from 'discord.js';
import { Command } from 'discord-akairo';
import fetch from 'node-fetch';
import { HypervisorAPIResponse } from './change';
import path from 'path';

export default class ChangeAvatarCommand extends Command {
	public constructor() {
		super('change-avatar', {
			channel: 'guild',
			category: 'staff',
			description: {
				content: "Changes the bot's avatar.",
				usage: '<avatar>',
				examples: ['https://i.imgur.com/xyz123', '*uploads image*'],
			},
			args: [
				{
					id: 'avatar',
					type: (msg: Message, str: string): string | null => {
						if (str) {
							const matches = this._findFromString(str);
							if (matches?.length) return matches[0];
						}
						const matches = this._findAttachments(msg);
						if (matches?.length) return matches[0];

						return null;
					},
					prompt: {
						start: "What would you like to set the bot's avatar to? Please upload an image or post an image URL.",
						retry: 'Please upload a valid image or image URL.',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { avatar }: { avatar: string }): Promise<Message | Message[] | void> {
		const profile = await fetch('https://external.sycer.dev/manager/api/group', {
			method: 'POST',
			body: JSON.stringify({
				guildID: msg.guild!.id,
				authorID: msg.author.id,
			}),
			headers: {
				Authorization: Buffer.from(this.client.user!.id).toString('base64'),
				'Content-Type': 'application/json',
			},
		});
		if (profile.status === 401) return msg.util?.reply(`sorry chap, you're not authorized to perform that action!`);
		if (profile.status === 404)
			return msg.util?.reply(`not quite sure what happened, the manager couldn't find the group settings.`);
		const json = (await profile.json()) as HypervisorAPIResponse;
		if (json.code === 200) {
			if (typeof json.message === 'string') return msg.util?.reply(json.message);
			const theItem = json.message.items.find((i) => i.botID === this.client.user?.id);
			if (theItem) {
				if (theItem.nextAvatarChange && theItem.nextAvatarChange.getTime() > Date.now())
					return msg.util?.send(
						`sorry pal, you can't change the bot's avatar for another \`${(
							(theItem.nextAvatarChange.getTime() - Date.now()) /
							60
						).toFixed(0)}\` minutes - there is a 1 hour cooldown between changes.`,
					);
				try {
					await this.client.user?.setAvatar(avatar);
					await fetch('https://external.sycer.dev/manager/api/bot', {
						method: 'POST',
						body: JSON.stringify({
							botID: this.client.user?.id,
							change: 'avatar',
						}),
						headers: {
							Authorization: Buffer.from(this.client.user!.id).toString('base64'),
							'Content-Type': 'application/json',
						},
					});
					return msg.util?.reply(`successfully updated the bot's avatar. It can be updated again in \`1 hour\`.`);
				} catch (err) {
					return msg.util?.reply(
						`oh no, looks like an error occurred when trying to set the bot's avatar: \`${err}\`.`,
					);
				}
			}
			return msg.util?.send(
				`looks like this bot hasn't been added to ${json.message.name}'s profile yet. Please dm Fyko#0001 in the Sycer Development client server to add it.`,
			);
		}
	}

	private _findAttachments(msg: Message): string[] | null {
		const images: string[] = [];
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		const linkRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:png|jpg|jpeg|gif|webp)/g;

		const richEmbed = msg.embeds.find(
			(embed) => embed.type === 'rich' && embed.image && extensions.includes(path.extname(embed.image.url)),
		);
		if (richEmbed) {
			images.push(richEmbed.image!.url);
		}

		const attachments = msg.attachments.filter((file) => extensions.includes(path.extname(file.url)));
		if (attachments.size) {
			for (const a of attachments.values()) images.push(a.proxyURL || a.url);
		}

		const linkMatch = msg.content.match(linkRegex);
		if (linkMatch && linkMatch.length && extensions.includes(path.extname(linkMatch[0]))) {
			for (const a of linkMatch) images.push(a);
		}

		if (images.length) return images;
		return null;
	}

	private _findFromString(str: string): string[] | null {
		const images: string[] = [];
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		const linkRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:png|jpg|jpeg|gif|webp)/g;
		const linkMatch = str.match(linkRegex);
		if (linkMatch && linkMatch.length) {
			for (const a of linkMatch) {
				if (extensions.includes(path.extname(a))) images.push(a);
			}
		}

		if (images.length) return images;
		return null;
	}
}

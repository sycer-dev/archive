/* eslint-disable */
import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
// const EMOJIS = ['🌈', '🔗', '👤', '🎩', '💬', '🔌', '📌', '🌆', '👟', '⌚', '👀', '✅', '🗑'];
// const time = 90000;

export default class EmbedCommand extends ToolCommand {
	public constructor() {
		super('embed', {
			channel: 'guild',
			category: 'staff',
			aliases: ['embed', 'embedged'],
			description: {
				content: 'Opens up a panel where you can embed a message.',
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS', 'ADD_REACTIONS', 'ATTACH_FILES'],
			userPermissions: ['MANAGE_MESSAGES'],
			// args: [
			// 	{
			// 		id: 'channel',
			// 		type: Argument.union(
			// 			'textChannel',
			// 			async (_: Message, str: string): Promise<null | Webhook> => {
			// 				if (!str.includes('discordapp.com/api/webhooks')) return null;
			// 				const link = str.split('/');
			// 				const id = link[link.length - 2];
			// 				try {
			// 					const hook = await this.client.fetchWebhook(id);
			// 					return hook;
			// 				} catch {}
			// 				return null;
			// 			},
			// 		),
			// 		prompt: {
			// 			start: 'What channel or webhook would you like to post the generated embed on?',
			// 			retry: 'Please provide a valid webhook link or channel mention, id, or name.',
			// 		},
			// 	},
			// ],
		});
	}

	public async exec(msg: Message/*, { channel }: { channel: Webhook | TextChannel }*/): Promise<Message | Message[] | void> {
		return msg.util?.send('This command has been deprecated in favor of https://discohook.org/');
		// const embed = this.client.util.embed();
		// let live = true;
		// let i = 0;
		// const m = await msg.channel.send('🔨 Embed Builder');
		// while (live) {
		// 	const prompt = this.client.util
		// 		.embed()
		// 		.setColor(this.client.config.color)
		// 		.setDescription('Please react with the corresponding phrase for the action you wish to perform.')
		// 		.setAuthor('Embed Builder', this.client.user!.displayAvatarURL())
		// 		.addField(
		// 			'Possible Methods',
		// 			stripIndents`
		// 			\`🌈\` - Color
		// 			\`🔗\` - URL
		// 			\`👤\` - Author Text, Icon, and URL
		// 			\`🎩\` - Title
		// 			\`💬\` - Description
		// 			\`🔌\` - Add Field
		// 			\`📌\` - Thumbnail
		// 			\`🌆\` - Image
		// 			\`👟\` - Footer Text & Icon
		// 			\`⌚\` - Timestamp

		// 			\`👀\` - Preview
		// 			\`✅\` - Send
		// 			\`🗑\` - Dispose
		// 		`,
		// 			true,
		// 		)
		// 		.addField(
		// 			'Current Settiings',
		// 			stripIndents`
		// 			\`🌈\` Color: \`${embed.color || 'None set.'}\`
		// 			\`🔗\`	URL: \`${(embed.url && embed.url.substring(0, 100)) || 'None set.'}\`
		// 			\`👤\` Author Text: \`${(embed.author && embed.author.name! && embed.author.name!.substring(0, 100)) || 'None set.'}\`
		// 			\`👤\` Author Icon: \`${(embed.author && embed.author.iconURL && embed.author.iconURL.substring(0, 100)) ||
		// 				'None set.'}\`
		// 			\`👤\` Author URL: \`${(embed.author && embed.author.url && embed.author.url.substring(0, 100)) || 'None set.'}\`
		// 			\`🎩\` Title: \`${(embed.title && embed.title.substring(0, 100)) || 'None set.'}\`
		// 			\`💬\` Description: \`${(embed.description && `${embed.description.substring(0, 100)}...`) || 'None set.'}\`
		// 			\`🔌\` Total Fields: \`${embed.fields.length}\`
		// 			\`📌\` Thumbail Image: \`${(embed.thumbnail && embed.thumbnail.url && `${embed.thumbnail.url.substring(0, 100)}...`) ||
		// 				'None set.'}\`
		// 			\`🌆\` Image: \`${(embed.image && embed.image.url && `${embed.image.url.substring(0, 100)}...`) || 'None set.'}\`
		// 			\`👟\` Footer Text: \`${(embed.footer && embed.footer.text! && `${embed.footer.text!.substring(0, 100)}...`) ||
		// 				'None set.'}\`
		// 			\`👟\` Footer Icon: \`${(embed.footer && embed.footer.iconURL! && `${embed.footer.iconURL!.substring(0, 100)}...`) ||
		// 				'None set.'}\`
		// 			\`⌚\` Timestamp: \`${embed.timestamp ? new Date(embed.timestamp).toUTCString() : 'None set.'}\`
		// 		`,
		// 			true,
		// 		);

		// 	if (i === 0) {
		// 		for (const e of EMOJIS) await m.react(e);
		// 		i++;
		// 	}
		// 	await m.edit({ embed: prompt });

		// 	const collector = await m.awaitReactions(
		// 		(r: MessageReaction, u: User): boolean => msg.author.id === u.id && EMOJIS.includes(r.emoji.name),
		// 		{
		// 			max: 1,
		// 			time,
		// 		},
		// 	);
		// 	if (!collector || collector.size !== 1) {
		// 		return msg.util!.send('You took too long! Embed builder closed.');
		// 	}
		// 	const emoji = collector.first()!.emoji.name;
		// 	await m.reactions.cache.get(emoji)!.users.remove(msg.author.id);

		// 	if (emoji === '🌈') {
		// 		const w = await msg.channel.send(
		// 			'What would you like to set the **color** to? Please provide a valid hex code, decimal code, or say RANDOM.',
		// 		);
		// 		const colors = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!colors || colors.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const collected = colors.first()!;
		// 		await w.delete().catch(() => {});
		// 		await collected.delete().catch(() => {});
		// 		try {
		// 			const color = Util.resolveColor(collected.content);
		// 			embed.setColor(color);
		// 		} catch {}
		// 		const o = await msg.channel.send(`Successfully set the color to \`${embed.color}\`.`);
		// 		o.delete({ timeout: 3000 });
		// 	} else if (emoji === '👟') {
		// 		const w = await msg.channel.send(
		// 			'What would you like to set the **footer text** to? Please provide a string or say `none`.',
		// 		);
		// 		const collect = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect || collect.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawTEXT = collect.first()!;
		// 		const text = collect.first()!.content.toLowerCase() === 'none' ? null : rawTEXT.content;
		// 		await w.delete();
		// 		await rawTEXT.delete();

		// 		const x = await msg.channel.send(
		// 			'What would you like to set the **footer icon** to? Please provide a valid image URL, attach a photo or say `none`.',
		// 		);
		// 		const collect2 = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect2 || collect2.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawICON = collect2.first()!;
		// 		const icon = this.findAttachment(rawICON);
		// 		await x.delete();
		// 		await rawICON.delete();
		// 		embed.setFooter(text, icon);
		// 	} else if (emoji === '📌') {
		// 		const x = await msg.channel.send(
		// 			'What would you like to set the **thumbnail image** to? Please provide a valid image URL or attach a photo.',
		// 		);
		// 		const collect2 = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect2 || collect2.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawTHUMBNAIL = collect2.first()!;
		// 		const thumbnail = this.findAttachment(rawTHUMBNAIL);
		// 		await x.delete();
		// 		await rawTHUMBNAIL.delete();
		// 		if (thumbnail) embed.setThumbnail(thumbnail);
		// 	} else if (emoji === '🌆') {
		// 		const x = await msg.channel.send(
		// 			'What would you like to set the **image** to? Please provide a valid image URL or attach a photo.',
		// 		);
		// 		const collect2 = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect2 || collect2.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawIMAGE = collect2.first()!;
		// 		const image = this.findAttachment(rawIMAGE);
		// 		await x.delete();
		// 		await rawIMAGE.delete();
		// 		if (image) embed.setImage(image);
		// 	} else if (emoji === '💬') {
		// 		const w = await msg.channel.send('What would you like to set the **description** to? Please provide a string.');
		// 		const collect = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time: 300000,
		// 		});
		// 		if (!collect || collect.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawDESC = collect.first()!;
		// 		const desc = rawDESC.content.substring(0, 2000);
		// 		await w.delete();
		// 		await rawDESC.delete();
		// 		embed.setDescription(desc);
		// 	} else if (emoji === '🔗') {
		// 		const a = await msg.channel.send('What would you like to set the **URL** to? Please provide a string.');
		// 		const collect = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect || collect.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawLINK = collect.first()!;
		// 		const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
		// 		const url = rawLINK.content.match(regex) ? rawLINK.content : null;
		// 		await a.delete();
		// 		await rawLINK.delete();
		// 		if (url) embed.setURL(url);
		// 	} else if (emoji === '👤') {
		// 		// collecting the name
		// 		const w = await msg.channel.send('What would you like to set the **author name** to? Please provide a string.');
		// 		const collect = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect || collect.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawNAME = collect.first()!;
		// 		const name = rawNAME.content.substring(0, 100);
		// 		await w.delete();
		// 		await rawNAME.delete();

		// 		// collecting avatar
		// 		const x = await msg.channel.send(
		// 			'What would you like to set the **author icon** to? Please provide a valid image URL, attach a photo or say `none`.',
		// 		);
		// 		const collect2 = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect2 || collect2.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawICON = collect2.first()!;
		// 		const icon = this.findAttachment(rawICON);
		// 		await x.delete();
		// 		await rawICON.delete();

		// 		// collecting link
		// 		const y = await msg.channel.send('What would you like to set the **URL** to? Please provide a string.');
		// 		const collect3 = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect3 || collect3.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawLINK = collect3.first()!;
		// 		const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
		// 		const url = rawLINK.content.match(regex) ? rawLINK.content : null;
		// 		try {
		// 			await y.delete();
		// 			await rawLINK.delete();
		// 		} catch {}

		// 		embed.setAuthor(name || undefined, icon || undefined, url || undefined);
		// 	} else if (emoji === '⌚') {
		// 		embed.setTimestamp();
		// 	} else if (emoji === '👀') {
		// 		const w = await msg.channel.send(
		// 			'Please react with 🗑 after viewing to continue with adding your settings or sending the embed.',
		// 			{ embed },
		// 		);
		// 		await w.react('🗑');
		// 		const reactions = await w.awaitReactions((r: Message, u: User): boolean => msg.author.id === u.id, {
		// 			max: 1,
		// 			time: 300000,
		// 		});
		// 		if (!reactions || reactions.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		await w.delete();
		// 	} else if (emoji === '✅') {
		// 		live = false;
		// 	} else if (emoji === '🗑') {
		// 		live = false;

		// 		await m.reactions.removeAll().catch(() => null);

		// 		return m.edit('Embed bulder closed.', { embed: null });
		// 	} else if (emoji === '🎩') {
		// 		const w = await msg.channel.send('What would you like to set the **title** to? Please provide a string.');
		// 		const collect = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 			max: 1,
		// 			time,
		// 		});
		// 		if (!collect || collect.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 		const rawTITLE = collect.first()!;
		// 		const desc = rawTITLE.content.substring(0, 1000);
		// 		await w.delete();
		// 		await rawTITLE.delete();
		// 		embed.setTitle(desc);
		// 	} else if (emoji === '🔌') {
		// 		if (embed.fields.length >= 25) {
		// 			const m = await msg.channel.send("You've already hit your field max of 25!");
		// 			m.delete({ timeout: 3000 });
		// 		} else {
		// 			// collecting the "title" value
		// 			const w = await msg.channel.send(
		// 				"What would you like to set this field's **title** to? Please provide a string.",
		// 			);
		// 			const collect = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 				max: 1,
		// 				time: 60000,
		// 			});
		// 			if (!collect || collect.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 			const rawNAME = collect.first()!;
		// 			const name = rawNAME.content.substring(0, 100);
		// 			await w.delete();
		// 			await rawNAME.delete();

		// 			// collecting the "text" value
		// 			const x = await msg.channel.send(
		// 				"What would you like to set this field's **text** to? Please provide a string.",
		// 			);
		// 			const collect2 = await msg.channel.awaitMessages((m): boolean => msg.author.id === m.author.id, {
		// 				max: 1,
		// 				time: 120000,
		// 			});
		// 			if (!collect2 || collect2.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 			const rawTEXT = collect2.first()!;
		// 			const text = rawTEXT.content.substring(0, 900);
		// 			await x.delete();
		// 			await rawTEXT.delete();

		// 			// collecting the "text" value
		// 			const y = await msg.channel.send(
		// 				'Would you like to put this embed in-line with the rest of the fields? 👍 for yes, 👎 for no.',
		// 			);
		// 			await y.react('👍');
		// 			await y.react('👎');
		// 			const reactions = await y.awaitReactions(
		// 				(r: MessageReaction, u: User): boolean => msg.author.id === u.id && ['👎', '👍'].includes(r.emoji.name),
		// 				{
		// 					max: 1,
		// 					time: 60000,
		// 				},
		// 			);
		// 			if (!reactions || reactions.size !== 1) return msg.util!.send('You took too long! Embed builder closed.');
		// 			const rawREACTION = reactions.first()!;
		// 			const inline = rawREACTION.emoji.name === '👎' ? false : true;
		// 			await y.delete();

		// 			embed.addField(name, text, inline);
		// 		}
		// 	}
		// }
		// try {
		// 	if (channel instanceof Webhook) return channel.send({ embeds: [embed] });
		// 	return channel.send({ embed });
		// } catch {
		// 	return msg.util!.send({ embed });
		// }
	}

	// public findAttachment(msg: Message): string | undefined {
	// 	let attachmentImage = undefined;
	// 	const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
	// 	const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;

	// 	const richEmbed = msg.embeds.find(
	// 		embed => embed.type === 'rich' && embed.image && extensions.includes(path.extname(embed.image.url)),
	// 	);
	// 	if (richEmbed) {
	// 		attachmentImage = richEmbed.image!.url;
	// 	}

	// 	const attachment = msg.attachments.find(file => extensions.includes(path.extname(file.url)));
	// 	if (attachment) {
	// 		attachmentImage = attachment.proxyURL;
	// 	}

	// 	if (!attachmentImage) {
	// 		const linkMatch = msg.content.match(linkRegex);
	// 		if (linkMatch && extensions.includes(path.extname(linkMatch[0]))) {
	// 			attachmentImage = linkMatch[0];
	// 		}
	// 	}

	// 	return attachmentImage;
	// }
}

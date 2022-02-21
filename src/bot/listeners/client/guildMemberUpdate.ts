import { stripIndents } from 'common-tags';
import { Listener } from 'discord-akairo';
import { Client as DiscordClient, GuildMember, Message, MessageReaction, User, Util, Guild } from 'discord.js';
import path from 'path';
import CartClient from '../../classes/CartClient';
import { Client } from '../../models/Client';

export default class GuildMemberUpdateListener extends Listener {
	public constructor() {
		super('guildMemberUpdate', {
			emitter: 'client',
			event: 'guildMemberUpdate',
			category: 'client'
		});
	}

	public async exec(oldMember: GuildMember, newMember: GuildMember): Promise<Message | Message[] | void> {
		if (oldMember.guild.id !== '581633886828625930') return;
		if (this.client.user!.id !== '595775542569992192') return;

		/* handle business class recieving */
		if (!oldMember.roles.cache.has('597823990253355014') && newMember.roles.cache.has('597823990253355014')) {
			return this.handleNewBusiness(newMember);
		} else if (oldMember.roles.cache.has('597823990253355014') && !newMember.roles.cache.has('597823990253355014')) {
			return this.handleExpiredBusiness(newMember);
		}

		/* if they recieve the role */
		if (!oldMember.roles.cache.has('595788980037877760') && newMember.roles.cache.has('595788980037877760')) {
			const guilds = this.client.guilds.cache.filter(g => g.ownerID === oldMember.user.id);
			// handle if there are no mutual servers
			if (!guilds.size) {
				try {
					const embed = this.client.util.embed()
						.setColor(Number(this.client.config.color!!))
						.setFooter(`Powered by Sycer Development • Version ${this.client.version}`, this.client.user!.displayAvatarURL())
						.setTitle('Acitvation')
						.setDescription(`Thank you for purchasing access to **Adidas Carts**. I searched for any servers that you're owner in but I couldn't find any! Please invite me to your server with [this link](https://discordapp.com/oauth2/authorize?client_id=595775542569992192&permissions=604499152&scope=bot) and run \`async\`!`);
					return oldMember.send(embed);
				} catch { }
			}
			// handle if there is only one guilds
			if (guilds.size === 1) {
				await this.client.settings.set('guild', { id: guilds.first()!.id }, { allowed: true });
				const embed = this.client.util.embed()
					.setColor(Number(this.client.config.color!!))
					.setFooter(`Powered by Sycer Development • Version ${this.client.version}`, this.client.user!.displayAvatarURL())
					.setTitle('Acitvation')
					.setDescription(`Thank you for purchasing **Adidas Carts**! I've given your server, **${guilds.first()!.name}** access to use me. If you cancel your pledge on Patreon, your access will be revoked once the month has expired.`)
					.setTimestamp();
				try {
					await oldMember.send(embed);
				} catch { }
			}
			// handle if there is more than one guild
			if (guilds.size > 1) {
				const embed = this.client.util.embed()
					.setColor(Number(this.client.config.color!!))
					.setFooter(`Powered by Sycer Development • Version ${this.client.version}`, this.client.user!.displayAvatarURL())
					.setTitle('Acitvation')
					.setDescription(`Thank you for purchasing **Adidas Carts**! I see that I'm in more than one server with you, of which you are the owner. Please run \`async\` in the server of your choice to activate.`)
					.setTimestamp();
				try {
					await oldMember.send(embed);
				} catch { }
			}
		}

		/* if they get the role removed */
		if (oldMember.roles.cache.has('595788980037877760') && !newMember.roles.cache.has('595788980037877760')) {
			const activated = this.client.settings.guilds.find(g => g.allowed && g.ownerID === oldMember.user.id);
			if (!activated) return;
			await this.client.settings.set('guild', { id: activated.id }, { allowed: false });
			const embed = this.client.util.embed()
				.setColor(Number(this.client.config.color!!))
				.setFooter(`Powered by Sycer Development • Version ${this.client.version}`, this.client.user!.displayAvatarURL())
				.setTitle('Supscription Expiry')
				.setDescription(`Oh no! Your subscription has expired. If you'd like to reactivate, please visit [our Patreon](https://www.patreon.com/carts).`)
				.setTimestamp();
			try {
				await oldMember.send(embed);
			} catch { }
		}
	}

	public async handleNewBusiness(member: GuildMember): Promise<Message | Message[] | void> {
		let name = this.client.user!.username;
		let avatar = this.client.user!.displayAvatarURL();

		try {
			const m = await member.send('Hello! You\'re just recieving this message to see if your DMs are unlocked. Pay this no mind.') as Message;
			await m.delete({ timeout: 2000 });
		} catch {
			return this.client.users.cache.get(this.client.ownerID[0])!.send(`New business class member ${member} with ID of ${member.id} has their DMs locked. Go figure it out or whatever.`);
		}

		// searching for an unused child
		const child = this.client.settings.clients.find(c => !c.active);

		// handle if there are no available children
		if (!child) {
			const embed = this.client.util.embed()
				.setColor(Number(this.client.config.color!!))
				.setFooter(`Powered by Sycer Development - Version ${this.client.version}`, this.client.user!.displayAvatarURL())
				.setTitle('Acitvation')
				.setDescription(`Thank you for purchasing **Adidas Carts Business Class**! By the looks of it, we've ran out of custom clients. I've alerted Fyko and he should be with you shortly.`)
				.setTimestamp();
			try {
				member.send(embed);
				return this.client.users.cache.get(this.client.ownerID[0])!.send(`New business class member ${member} with ID of ${member.id} needs a client but I ran out. Go figure it out or whatever.`);
			} catch { }
		}

		const embed = this.client.util.embed()
			.setColor(Number(this.client.config.color!!))
			.setFooter(`Powered by Sycer Development - Version ${this.client.version}`, this.client.user!.displayAvatarURL())
			.setTitle('Business Class Acitvation')
			.setDescription(stripIndents`
				Thank you for purchasing **Adidas Carts Business Class**! 
				I\'m ready to start the registration process when you are!
				I will need the all items listed below.

				• A username for the bot
				• An avatar for the bot (link or attachment)
				
				All other options such as the embed color, footer icon and text are all customizable via command.
				
				**Once you are ready, please react with the 🛒**.
				
			`);
		const m = await member.send(embed) as Message;
		await m.react('🛒');
		await m.awaitReactions((r: MessageReaction, u: User): boolean => member.id === u.id && r.emoji.name === '🛒', {
			max: 1
		});

		await member.send('Alrighty! What would you like the username of the bot to be set to? Under 24 characters please.');
		let completed = false;

		while (!completed) {
			const alsoACollector = await m.channel.awaitMessages((m): boolean => member.id === m.author.id, {
				max: 1
			});
			const raw = alsoACollector.first()!.content;
			if (raw.length <= 24) {
				completed = true;
				name = raw;
			} else {
				await m.channel.send('That username is not less than 24 characters. Please try again.');
			}
		}
		completed = false;

		await member.send(`Damn, ${name} sounds like a pretty cool name. Now, please attach an image or provide a URL for the bot's avatar.`);

		while (!completed) {
			const alsoACollector = await m.channel.awaitMessages((m): boolean => member.id === m.author.id, {
				max: 1
			});
			const raw = alsoACollector.first()!;
			const link = this.findAttachment(raw);
			if (link) {
				completed = true;
				avatar = link as string;
			} else {
				await m.channel.send('That is not a valid image. Please try again.');
			}
		}

		const alsoAnEmbed = this.client.util!.embed()
			.setColor(Number(this.client.config.color!!))
			.setFooter(`Powered by Sycer Development - Version ${this.client.version}`, this.client.user!.displayAvatarURL())
			.setTitle('Business Class Acitvation')
			.setDescription(`Username: \`${name}\`\nAvatar: [Click Here](${avatar})`)
			.setThumbnail(avatar);
		const alsoAMsg = await member.send('Everything look good? If so, please click 🛒. If you see a mistake, please still react and contact Fyko after.', { embed: alsoAnEmbed }) as Message;
		await alsoAMsg.react('🛒');
		await alsoAMsg.awaitReactions((r: MessageReaction, u: User): boolean => member.id === u.id && r.emoji.name === '🛒', {
			max: 1
		});

		const status = await member.send('Sandboxing new client... <a:loading:598737483328389140>') as Message;
		const client = new DiscordClient();

		await client.login(child!.token);
		await Util.delayFor(2000);
		await status.edit('\\✅ New client launched! (0/2)');
		await Util.delayFor(2000);
		await status.edit('Setting username... <a:loading:598737483328389140>');
		await client.user!.setUsername(name);
		await status.edit('\\✅ Username set! (1/2)');
		await Util.delayFor(2000);
		await status.edit('Setting avatar... This may take a minute. <a:loading:598737483328389140>');
		client.user!.setAvatar(avatar);
		await status.edit('\\✅ Due to the nature of Discord\'s API, I may have been unable to set the bot\'s avatar. Please contact Fyko with your requested avatar if it wasn\'t set.\n\nPlease follow the insutrctions below for activation.');

		await member.send(`Please use the link below to invite the bot to your server. **This is server your bot will be activated in**. The bot will not be activated until you invite it.\n<${await client.generateInvite(8)}>`);

		client.once('guildCreate', async (guild: Guild) => {
			await this.client.settings.set('client', { id: child!.id }, {
				active: true,
				guildID: guild.id
			});

			await this.launchChild(child!);

			await this.client.settings.set('guild', { id: guild.id }, { allowed: true, ownerID: guild.ownerID });

			client.destroy();

			return member.send('Activation successful. Your bot is now ready for cart distribution. Please leave a review in <#597823990253355014> if possible.');
		});
	}

	public async handleExpiredBusiness(member: GuildMember): Promise<void> {
		const activated = this.client.settings.guilds.find(g => g.allowed && g.ownerID === member.user.id);
		if (!activated) return;

		const child = this.client.settings.clients.find(c => c.guildID === activated.id);
		if (!child) return;

		await this.client.settings.set('guild', { id: activated.id }, { allowed: false });
		await this.client.settings.set('client', { id: child.id }, { active: false });

		const client = this.client.children.get(child.id);
		if (client) client.destroy();

		const embed = this.client.util.embed()
			.setColor(Number(this.client.config.color!!))
			.setFooter(`Powered by Sycer Development • Version ${this.client.version}`, this.client.user!.displayAvatarURL())
			.setTitle('Supscription Expiry')
			.setDescription(`Oh no! Your subscription has expired. If you'd like to reactivate, please visit [our Patreon](https://www.patreon.com/carts).`)
			.setTimestamp();
		try {
			await member.send(embed);
		} catch { }
	}

	public findAttachment(msg: Message): string | undefined {
		let attachmentImage = undefined;
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;

		const richEmbed = msg.embeds.find(embed => embed.type === 'rich' &&
			embed.image &&
			extensions.includes(path.extname(embed.image.url)));
		if (richEmbed) {
			attachmentImage = richEmbed.image!.url;
		}

		const attachment = msg.attachments.find(file => extensions.includes(path.extname(file.url)));
		if (attachment) {
			attachmentImage = attachment.proxyURL;
		}

		if (!attachmentImage) {
			const linkMatch = msg.content.match(linkRegex);
			if (linkMatch && extensions.includes(path.extname(linkMatch[0]))) {
				attachmentImage = linkMatch[0];
			}
		}

		return attachmentImage;
	}

	public async launchChild(c: Client): Promise<string> {
		const child = new CartClient({
			token: c.token,
			owner: this.client.ownerID,
			color: c.color,
			footerIcon: c.footerIcon,
			footerText: c.footerText,
			emoji: c.emoji
		});
		await child.launch();
		this.client!.children.set(child.user!.id, child);
		return child.token!;
	}
}

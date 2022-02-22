import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class InfoCommand extends Command {
	public constructor() {
		super('info', {
			aliases: ['guide', 'info', 'whatdoido', 'plshelp'],
			clientPermissions: ['SEND_MESSAGES'],
			description: {
				content: 'Returns a guide on using this bot.',
			},
			category: 'utilities',
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | undefined> {
		if (this.client.user!.id === '592975963290337300') return;
		const dev = await this.client.users.fetch('492374435274162177');
		const format = dev.avatar && dev.avatar.startsWith('a_') ? 'gif' : 'png';

		const client = this.client.settings.cache.clients.get(this.client.user!.id)!;
		const prefix = client.prefix;

		const embed = this.client.util
			.embed()
			.setColor(this.client.config.color)
			.setAuthor(this.client.user!.username, this.client.user!.displayAvatarURL())
			.setFooter('Made with love by Fyko 💘', dev.displayAvatarURL({ format })).setDescription(stripIndents`
				All the command example listed below are linked to the help command which displays all the information you'd need!

				**You can run \`${prefix}config\` at any time to view the server configuration.**

				**Setup**
				• Add a channel you'd like to watch for success in with \`${prefix}help channel\`
				• Add a tweet format (the tweet text) (example: success from {user}) with \`${prefix}help format\`
				• Set a webhook for the success log with \`${prefix}help log\`
				• Set a webhook for the authentication panels with \`${prefix}help approval\`
				• Set your mode to automatic or approval with \`${prefix}help mode\`
				• Change your custom-branding color with \`${prefix}help color\`
				
				**Important Notes**
				• Each tweet-text template is chosen randomly
				• Please take it easy with processing approval-mode success photos. If you go too fast, your Twitter API Application may be locked.
				• If you forgot the prefix, you can simply mention the bot like this: \`@${
					this.client.user!.tag
				} <command> [arguments]\`
				• When running a command do **NOT** include the <>\'s or []\'s. <> means required and [] means optional
			`);
		return msg.util?.send({ embed });
	}
}

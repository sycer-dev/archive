import { Command } from 'discord-akairo';
import { Client, Message } from 'discord.js';

export default class ChildCommand extends Command {
	public constructor() {
		super('child', {
			category: 'owner',
			aliases: ['child', 'client', 'register'],
			args: [
				{
					id: 'token',
					prompt: {
						start: 'What is the token you\'d like to create a new child with?'
					}
				}
			],
			clientPermissions: ['SEND_MESSAGES'],
			description: 'Creates a new child for stage two patrons.',
			ownerOnly: true
		});
	}

	public async exec(msg: Message, { token }: { token: string }): Promise<Message | Message[]> {
		await msg.channel.send('Validating that token...');
		const client = new Client();

		try {
			await client.login(token);
		} catch (err) {
			return msg.util!.send(`The token you provided failed to validate. Reason: \`${err}\`.`);
		}

		await msg.channel.send(`Logged in as ${client.user!.tag} (${client.user!.id}). Creating new child document...`);

		await this.client.settings.new('client', {
			id: client.user!.id,
			active: false,
			token: client.token,
			guildID: null,
			color: Number(this.client.config.color),
			footerText: this.client.config.footerText,
			footerIcon: this.client.config.footerIcon,
			emoji: '🛒'
		});

		client.destroy();

		return msg.util!.send(`Created new document and child destroyed. Now at \`${this.client.settings.clients.size}\` children.`);
	}
}

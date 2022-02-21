import { Client, Message } from 'discord.js';
import ToolClient from '../../classes/ToolClient';
import { Child } from '../../models/Child';
import { ToolCommand } from '../../structures/Command';

export default class NewClientCommand extends ToolCommand {
	public constructor() {
		super('newclient', {
			ownerOnly: true,
			category: 'owner',
			aliases: ['newclient'],
			description: {
				content: 'Collects info and creates a new client.',
			},
			args: [
				{
					id: 'token',
					type: 'string',
					prompt: {
						start: "Please provide the Discord Bot's token.",
					},
				},
			],
			clientPermissions: ['EMBED_LINKS'],
		});
	}

	public async exec(msg: Message, { token }: { token: string }): Promise<Message | Message[] | void> {
		const m = await msg.channel.send('Verifying Discord Token...');
		const client = new Client();
		try {
			await client.login(token);
		} catch (err) {
			return m.edit(`Error Validating Token: \`${err}\`. Setup cancelled.`);
		}
		const user = client.user!;
		const invite = await client.generateInvite(8);
		client.destroy();

		await this.client.settings.new('child', {
			id: user.id,
			token,
			used: true,
			prefix: process.env.PREFIX,
		});

		const doc = this.client.settings.child.find(c => c.id === user.id)!;

		this.launchClient(doc);
		if (m.editable)
			return m.edit(
				`Successfully 😲 created ☀ and launched 🚀 a new client 🤖 for ${user.tag} (${user.id}).\n\nInvite link: <${invite}>`,
			);
		return msg.util!.send(
			`Successfully 😲 created ☀ and launched 🚀 a new client 🤖 for ${user.tag} (${user.id}).\nInvite link: <${invite}>`,
		);
	}

	public async launchClient(client: Child): Promise<string> {
		const child = new ToolClient({
			owners: this.client.ownerID,
			prefix: client.prefix,
			token: client.token,
			color: client.color,
		});

		child.settings = this.client.settings;

		return child.launch();
	}
}

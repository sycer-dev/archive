import { Command } from 'discord-akairo';
import { TextChannel, Message } from 'discord.js';


export default class PublicChannel extends Command {
	public constructor() {
		super('public', {
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			aliases: ['public', 'pub'],
			description: {
				content: 'Sets the channel where cart panels are opened. The first to react gets the cart!'
			},
			category: 'carts',
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'What would you like to set the public channel? Please provide a valid channel name, mention, or ID.',
						retry: 'What would you like to set the public channel? Please provide a valid channel name, mention, or ID.',
						optional: true
					}
				}
			]
		});
	}

	public async exec(msg: Message, { channel }: { channel: TextChannel }): Promise<Message | Message[]> {
		if (!channel) {
			const guild = this.client.settings.guilds.get(msg.guild!.id);
			return msg.util!.send(`The current public channel is <#${guild!.publicChannel}>.`);
		}

		this.client.settings.set('guild', { id: msg.guild!.id }, { publicChannel: channel });
		return msg.util!.send(`\\✅ The public channel has been set to ${channel}.`);
	}
}

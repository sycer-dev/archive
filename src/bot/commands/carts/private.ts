import { Command } from 'discord-akairo';
import { TextChannel, Message } from 'discord.js';


export default class PrivateChannel extends Command {
	public constructor() {
		super('private', {
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			aliases: ['private', 'prib'],
			description: {
				content: 'Sets the channel where the Bot/AIO posts carts via a webhook. These messages are picked up and psoted in the public channel.'
			},
			category: 'carts',
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'What would you like to set the private channel? Please provide a valid channel name, mention, or ID.',
						retry: 'What would you like to set the private channel? Please provide a valid channel name, mention, or ID.',
						optional: true
					}
				}
			]
		});
	}

	public async exec(msg: Message, { channel }: { channel: TextChannel }): Promise<Message | Message[]> {
		if (!channel) {
			const guild = this.client.settings.guilds.get(msg.guild!.id);
			return msg.util!.send(`The current private channel is <#${guild!.privateChannel}>.`);
		}

		this.client.settings.set('guild', { id: msg.guild!.id }, { privateChannel: channel });
		return msg.util!.send(`\\✅ The private channel has been set to ${channel}.`);
	}
}


import { Command } from 'discord-akairo';
import { Message } from 'discord.js';


export default class MaxCommand extends Command {
	public constructor() {
		super('max', {
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			aliases: ['max', 'limit'],
			description: {
				content: 'Changes the max amount of carts one user can get in a single session. Sessions can be reset with the `reset` command.'
			},
			category: 'carts',
			args: [
				{
					id: 'max',
					type: 'integer',
					prompt: {
						start: 'What would you like to change max-carts value to?',
						retry: 'What would you like to change the max-carts value to? This can be reset after a carts-session with the `reset` command.',
						optional: true
					}
				}
			]
		});
	}

	public async exec(msg: Message, { max }: { max: number}): Promise<Message | Message[]> {
		if (!max) {
			const guild = this.client.settings.guilds.get(msg.guild!.id);
			return msg.util!.send(`The current max is \`${guild!.max}\`.`);
		}

		this.client.settings.set('guild', { id: msg.guild!.id }, { max });
		return msg.util!.send(`\\✅ The max has been set to \`${max}\`.`);
	}
}


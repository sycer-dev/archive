import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import ms from '@naval-base/ms';

export default class CooldownCommand extends Command {
	public constructor() {
		super('cooldown', {
			channel: 'guild',
			userPermissions: ['MANAGE_MESSAGES'],
			aliases: ['cooldown', 'break'],
			description: {
				content: 'Changes the cooldown before someone can claim another cart.'
			},
			category: 'carts',
			args: [
				{
					id: 'cooldown',
					type: (_: Message, str: string): number | null => {
						if (!str) return null;
						const duration = ms(str);
						if (duration && !isNaN(duration)) return duration;
						return null;
					},
					prompt: {
						start: 'What would you like to change the cart redemption cooldown to? Please provide a time formatted like `5m` or `10s`.',
						retry: 'Please follow a valid time format including the abbrviation for time, such as `10s` or `1m`.',
						optional: true
					}
				}
			]
		});
	}

	public async exec(msg: Message, { cooldown }: { cooldown: number}): Promise<Message | Message[]> {
		if (!cooldown) {
			const guild = this.client.settings.guilds.get(msg.guild!.id);
			return msg.util!.send(`The current cooldown is \`${ms(guild!.cooldown, true)}\`.`);
		}

		this.client.settings.set('guild', { id: msg.guild!.id }, { cooldown });
		return msg.util!.send(`\\✅ The cooldown has been set to \`${ms(cooldown, true)}\`.`);
	}
}


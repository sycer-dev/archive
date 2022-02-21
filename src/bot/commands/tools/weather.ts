import { Message } from 'discord.js';
import request from 'node-fetch';
import { ToolCommand } from '../../structures/Command';

export default class WeatherCommand extends ToolCommand {
	public constructor() {
		super('weather', {
			channel: 'guild',
			category: 'tools',
			aliases: ['weather'],
			description: {
				content: 'Returns the weather from a specificed region.',
				usage: '<location> [-metric]',
				examples: ['Denver', 'Paris --m', 'Rome -metric'],
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'location',
					type: 'string',
					match: 'restContent',
					prompt: {
						start: 'What location do you want the weather for?',
						retry: 'Where would you like to get the weather for?',
					},
				},
				{
					id: 'metric',
					type: 'flag',
					match: 'flag',
					flag: ['--m', '-metric'],
				},
			],
		});
	}

	public async exec(
		msg: Message,
		{ location, metric }: { location: string; metric: boolean },
	): Promise<Message | Message[]> {
		try {
			const req = await request(`https://wttr.in/${encodeURIComponent(location)}?0TFQ${metric ? '?m' : ''}`, {
				headers: {
					'User-Agent': 'curl',
				},
			});

			const text = await req.text();

			return msg.util!.send(text, { code: '' });
		} catch (err) {
			return msg.util!.reply(`oh no, an error occurred when trying to fetch the weather: \`${err}\``);
		}
	}
}

import { Argument } from 'discord-akairo';
import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';

export default class DelayCommand extends ToolCommand {
	public constructor() {
		super('delay', {
			channel: 'guild',
			category: 'tools',
			aliases: ['delay'],
			description: {
				content: 'Determines an optimal delay for how many tasks and proxies you are running.',
				usage: '<tasks> <proxies>',
			},
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'tasks',
					type: Argument.validate('integer', (_, str: string): boolean => Number(str) > 0),
					prompt: {
						start: 'How many tasks are you running?',
						retry: 'Number please.',
					},
				},
				{
					id: 'proxies',
					type: Argument.validate('integer', (_, str: string): boolean => Number(str) > 0),
					prompt: {
						start: 'How many proxies do you have?',
						retry: 'Number please.',
					},
				},
			],
		});
	}

	// one task & one proxy = 3500
	// one task & two proxies = 1750
	public async exec(
		msg: Message,
		{ tasks, proxies }: { tasks: number; proxies: number },
	): Promise<Message | Message[]> {
		const delay = 3500 / (proxies / tasks);
		const embed = this.client.util
			.toolEmbed()
			.setTitle('Delay Calculator')
			.setDescription(
				'Shopify will ban at around 3200 ms. This calulator uses 3500 ms for safety. Remember that you can always run below the suggested delay.',
			)
			.addField('Tasks', tasks.toLocaleString('en-US'), true)
			.addField('Proxies', proxies.toLocaleString('en-US'), true)
			.addField('Recommended  Delay', `${delay}ms`);
		return msg.util!.send(embed);
	}
}

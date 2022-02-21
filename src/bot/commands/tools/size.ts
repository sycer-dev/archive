import { Argument } from 'discord-akairo';
import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
const COUNTRIES = ['US', 'EU', 'UK'];

export default class SizeCommand extends ToolCommand {
	public constructor() {
		super('size', {
			channel: 'guild',
			category: 'tools',
			aliases: ['size', 'shoe-size'],
			description: {
				content:
					"Calculates a Male show size in different countries. Country will default to the client's requested default country.",
				usage: '<size> [country]',
			},
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'size',
					type: 'integer',
					prompt: {
						start: 'What size?',
						retry: 'Valid number please.',
					},
				},
				{
					id: 'country',
					type: Argument.validate(
						'string',
						(_: Message, str: string) => Boolean(str) && COUNTRIES.includes(str.toUpperCase()),
					),
					default: 'USA',
				},
			],
		});
	}

	public async exec(msg: Message, { size, country }: { size: number; country: string }): Promise<Message | Message[]> {
		size = Math.round(size);
		const embed = this.client.util
			.toolEmbed()
			.setTitle('Shoe Size Calulator')
			.setDescription(
				`All values are estimations are in no way 100% accurate.\nThey are all in Mens size.\n\n**Input**: ${size}`,
			);
		if (country === 'USA') {
			embed
				.addField('USA', size)
				.addField('UK', size - 0.5)
				.addField('EU', size + 33);
		} else if (country === 'UK') {
			embed
				.addField('USA', size + 0.5)
				.addField('UK', size)
				.addField('EU', size + 33.5);
		} else if (country === 'EU') {
			embed
				.addField('USA', size - 33)
				.addField('UK', size - 33.5)
				.addField('EU', size);
		}
		return msg.util!.send({ embed });
	}
}

import { stripIndents } from 'common-tags';
import { createHmac } from 'crypto';
import { Argument } from 'discord-akairo';
import { GuildMember, Message, User } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
const TOKENCHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

export default class TokenCommand extends ToolCommand {
	public constructor() {
		super('token', {
			channel: 'guild',
			category: 'tools',
			aliases: ['token', 'token-gen'],
			description: {
				content: 'Generates a Discord Authorization Token from a user ID.',
				usage: '[user/snowflake]',
				examples: ['', '593598404182147095'],
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'snowflake',
					type: Argument.union('member', 'user'),
					prompt: {
						start:
							"What is the user ID for the token you'd like to create? Please provide a valid user ID, mention, username, or tag.",
						retry: 'Please provide a valid user ID, mention, username, or tag.',
						optional: true,
					},
					default: (msg: Message): User => msg.author,
				},
			],
		});
	}

	public async exec(msg: Message, { snowflake }: { snowflake: GuildMember | User }): Promise<Message | Message[]> {
		const head = Buffer.from(snowflake.id).toString('base64');
		const middle = this.numberToBase(Date.now() - 1293840000, '');

		const id = this.makesha(64);
		const tail = createHmac('sha256', id)
			.update(middle)
			.digest('base64');
		const embed = this.client.util
			.toolEmbed()
			.setTitle('Token Generation')
			.setImage('https://i.imgur.com/7WdehGn.png')
			.addField('Provided Snowflake', `\`${snowflake.id}\``)
			.addField('Snowflake Bearer', `**${snowflake.constructor.name}**`, true)
			.addField(
				'Snowflake Data',
				stripIndents`
				**Head**: \`${head}\`
				**Middle**: \`${middle}\`
				**Tail**: \`${tail}\`

				**Token**: \`${head}.${middle}.${tail}\`
			`,
			);
		return msg.util!.send({ embed });
	}

	public numberToBase(number: number, res: string): string {
		const mod = number % 64;
		const remaining = Math.floor(number / 64);
		const chars = CHARS.charAt(mod) + res;

		if (remaining <= 0) return chars;
		return this.numberToBase(remaining, chars);
	}

	public makesha(length: number): string {
		const letters = [];
		const charactersLength = TOKENCHARS.length;
		for (let i = 0; i < length; i++) {
			letters.push(TOKENCHARS.charAt(Math.floor(Math.random() * charactersLength)));
		}
		return letters.join('');
	}
}

import { Argument } from 'discord-akairo';
import { SnowflakeUtil, Message, Role, Channel, GuildMember, Guild, User } from 'discord.js';
import { stripIndents } from 'common-tags';
import { ToolCommand } from '../../structures/Command';

export default class SnowflakeCommand extends ToolCommand {
	public constructor() {
		super('snowflake', {
			channel: 'guild',
			category: 'tools',
			aliases: ['snowflake', 'snowflake-gen', 'snow'],
			description: {
				content: 'Deconstructs or generates a Discord Snowflake.',
				usage: '[user/snowflake]',
				examples: ['', '593598404182147095', '--gen'],
			},
			cooldown: 5,
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'snowflake',
					type: Argument.union('role', 'channel', 'member', 'guild', 'user', 'message', 'guildMessage'),
					prompt: {
						start:
							"What is the snowflake you'd like to convert? Please provide an ID or mention of a role, channel, user, emoji or server.",
						retry: 'Please provide an ID or mention of a role, channel, user or server.',
						optional: true,
					},
					default: (msg: Message): User => msg.author,
				},
				{
					id: 'generate',
					match: 'flag',
					flag: ['--gen', '-g'],
				},
			],
		});
	}

	public async exec(
		msg: Message,
		{ snowflake, generate }: { snowflake: Message | Role | Channel | GuildMember | Guild | User; generate: boolean },
	): Promise<Message | Message[]> {
		if (generate) {
			const id = SnowflakeUtil.generate();
			const data = SnowflakeUtil.deconstruct(id);
			const embed = this.client.util
				.toolEmbed()
				.setTitle('Snowflake Generation')
				.setImage('https://discordapp.com/assets/94722171abc49573d1a129e2264da4ad.png')
				.setDescription(
					stripIndents`
					A Twitter snowflake, except the epoch is 2015-01-01T00:00:00.000Z
					\`\`\`fix
					If we have a snowflake '266241948824764416' we can represent it as binary:
					
					64                                          22     17     12          0
					000000111011000111100001101001000101000000  00001  00000  000000000000
						number of ms since Discord epoch       worker  pid    increment
					\`\`\`
					Sources: [\`1\`](https://github.com/discordjs/discord.js/blob/42505b78c15306491ac3a605f86a3e010bc80958/src/util/Snowflake.js#L17) [\`2\`](https://discordapp.com/developers/docs/reference#snowflakes)
				`,
				)
				.addField('Generated Snowflake', `\`${id}\``)
				.addField(
					'Snowflake Data',
					stripIndents`
					**Timestamp**: \`${data.timestamp}\`
					**Worker ID**: \`${data.workerID}\`
					**Proces ID**: \`${data.processID}\`
					**Increment**: \`${data.increment}\`
					**Binary**: \`${data.binary}\`
					**Date**: \`${data.date.toUTCString()}\`
				`,
				);
			return msg.util!.send({ embed });
		}
		const data = SnowflakeUtil.deconstruct(snowflake.id);
		const embed = this.client.util
			.toolEmbed()
			.setTitle('Snowflake Deconstruction')
			.setImage('https://discordapp.com/assets/94722171abc49573d1a129e2264da4ad.png')
			.setDescription(
				stripIndents`
					A Twitter snowflake, except the epoch is 2015-01-01T00:00:00.000Z
					\`\`\`fix
					If we have a snowflake '266241948824764416' we can represent it as binary:
					
					64                                          22     17     12          0
					000000111011000111100001101001000101000000  00001  00000  000000000000
						number of ms since Discord epoch       worker  pid    increment
					\`\`\`
					Sources: [\`1\`](https://github.com/discordjs/discord.js/blob/42505b78c15306491ac3a605f86a3e010bc80958/src/util/Snowflake.js#L17) [\`2\`](https://discordapp.com/developers/docs/reference#snowflakes)
				`,
			)
			.addField('Provided Snowflake', `\`${snowflake.id}\``)
			.addField('Snowflake Bearer', `**${snowflake.constructor.name}**`, true)
			.addField(
				'Snowflake Data',
				stripIndents`
					**Timestamp**: \`${data.timestamp}\`
					**Worker ID**: \`${data.workerID}\`
					**Proces ID**: \`${data.processID}\`
					**Increment**: \`${data.increment}\`
					**Binary**: \`${data.binary}\`
					**Date**: \`${data.date.toUTCString()}\`
				`,
			);
		return msg.util!.send({ embed });
	}
}

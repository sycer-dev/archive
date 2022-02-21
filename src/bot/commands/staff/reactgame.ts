import { Message, MessageReaction, User } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
const EMOJIS = ['🔥', '⚡', '🔌', '🍍', '🍒', '🍇', '🍊', '🥝', '🍌'];

export default class ReactionGame extends ToolCommand {
	public constructor() {
		super('reactgame', {
			channel: 'guild',
			category: 'staff',
			aliases: ['reactgame', 'reactiongame'],
			description: {
				content: 'First person to react to the message is the winner!',
			},
			clientPermissions: ['ADD_REACTIONS'],
			userPermissions: ['MANAGE_MESSAGES'],
		});
	}

	public async exec(msg: Message): Promise<Message | Message[]> {
		const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
		const m = await msg.channel.send(`First person to react with ${emoji} is the winner!`);
		m.react(emoji);
		const collector = await m.awaitReactions(
			(r: MessageReaction, u: User): boolean => r.emoji.name === emoji && !u.bot,
			{
				max: 1,
			},
		);
		const collected = collector.first();
		const user = collected!.users.cache.find(r => !r.bot);
		return m.edit(`~~First person to react with ${emoji} is the winner!~~\n\nLooks like ${user} won this round.`);
	}
}

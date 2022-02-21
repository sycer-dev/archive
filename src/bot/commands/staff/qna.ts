import { Command } from 'discord-akairo';
import { Message, TextChannel, MessageReaction, User } from 'discord.js';
import { stripIndents } from 'common-tags';
const EMOJIS = ['✋', '🛑', '✅'];

export default class QNACommand extends Command {
	public constructor() {
		super('qnd', {
			channel: 'guild',
			category: 'staff',
			aliases: ['qna'],
			description: {
				content: 'Creates a Q&A channel.',
			},
			cooldown: 5,
			clientPermissions: ['MANAGE_CHANNELS', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'channel',
					type: 'textChannel',
					prompt: {
						start: 'What channel do you wish to host this Q&AQ in?',
						retry: 'Pleae provide a valid text channel where you want to host this Q&A.',
						optional: true,
					},
					default: (msg: Message) => msg.channel,
				},
			],
		});
	}

	public async exec(msg: Message, { channel }: { channel: TextChannel }): Promise<Message | Message[]> {
		if (!channel.manageable) return msg.util!.reply(`I don't have permissions to change permissions in that channel!`);
		await channel.updateOverwrite(msg.guild!.id, {
			SEND_MESSAGES: false,
		});

		const embed = this.client.util
			.toolEmbed()
			.setAuthor('Q&A', msg.guild!.iconURL() || this.client.user!.displayAvatarURL()).setDescription(stripIndents`
                This message marks the beginning of this Q&A.

                If you would like to ask a question, please react with ✋.
                
                **Host Instructions**
                When you're ready to move onto the next person, react to their message with 👏.
                If you would like to end the Q&A session, simply react to this message with 🛑.
                If you'd like to skip a user, react to the bot's introduction message ({user}, you have the floor) with ⏭.

                When you are ready to begin, please react with ✅. You have 5 minutes before this action times out.
            `);
		const m = await channel.send({ embed });
		for (const e of EMOJIS) await m.react(e);

		const whyTFareYouReacting = m.createReactionCollector((reaction: MessageReaction): boolean =>
			EMOJIS.includes(reaction.emoji.name),
		);
		whyTFareYouReacting.on('collect', async (reaction: MessageReaction, user: User) => {
			const emoji = reaction.emoji;

			if (['🛑', '✅'].includes(emoji.name) && user.id !== msg.author.id) {
				try {
					await reaction.users.remove(user.id);
				} catch {}
			}
		});

		const goCollector = await m.awaitReactions(
			(reaction: MessageReaction, user: User): boolean => reaction.emoji.name === '✅' && user.id === msg.author.id,
			{
				time: 300000,
				max: 1,
			},
		);
		if (goCollector.size !== 1) {
			if (m.editable)
				return m.edit(`Oh no! You took more than 5 minutes to start the Q&A. Session cancelled.`, { embed: null });
			return channel.send(`Oh no! You took more than 5 minutes to start the Q&A. Session cancelled.`);
		}
		let currentSpeaker: User | null = null;
		let live = true;

		const stopCollector = m.createReactionCollector(
			(reaction: MessageReaction, user: User): boolean => reaction.emoji.name === '🛑' && user.id === msg.author.id,
		);
		stopCollector.on('collect', () =>
			channel.send(`This Q&A session is over. Thank you to everyone that participated.`),
		);

		while (live) {
			const waitingUsers = m.reactions.cache.find(r => r.emoji.name === '✋');
			if (!waitingUsers) return channel.send(`Oh no, I couldn't find the ✋ reactions!`);
			const filtered = waitingUsers.users.cache.filter(e => e.id !== this.client.user!.id);
			if (filtered.size === 0) {
				live = false;
				continue;
			}
			const next = filtered.first()!;
			waitingUsers.users.remove(next.id);
			await channel.updateOverwrite(next.id, {
				SEND_MESSAGES: true,
				EMBED_LINKS: true,
			});
			const nextUser = await channel.send(
				`${currentSpeaker ? `Thank you ${currentSpeaker}. ` : ''}${next}, you have the floor.`,
			);

			currentSpeaker = next;

			await new Promise((resolve): void => {
				const handler = (reaction: MessageReaction, user: User) => {
					const message = reaction.message;
					if (message.partial) return;
					if (
						reaction.emoji.name === '⏭' &&
						message.channel.id === channel.id &&
						user.id === msg.author.id &&
						message.id === nextUser.id
					) {
						channel.permissionOverwrites.get(currentSpeaker!.id)!.delete();
						resolve();
						this.client.removeListener('messageReactionAdd', handler);
					}
					if (
						reaction.emoji.name === '👏' &&
						message.channel.id === channel.id &&
						user.id === msg.author.id &&
						message.author.id === currentSpeaker!.id
					) {
						channel.permissionOverwrites.get(currentSpeaker!.id)!.delete();
						resolve();
						this.client.removeListener('messageReactionAdd', handler);
					}
				};
				// @ts-ignore
				this.client.on('messageReactionAdd', handler);
			});
		}

		stopCollector.stop();
		whyTFareYouReacting.stop();

		return msg.channel.send(`This Q&A is now over. Thank you to everyone that participated.`);
	}
}

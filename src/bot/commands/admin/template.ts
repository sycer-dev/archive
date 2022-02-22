import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class TemplateCommand extends Command {
	public constructor() {
		super('template', {
			aliases: ['template', 'format'],
			description: {
				content:
					"Adds or removes a template for tweets (they are chosen randomly). A template must contain `{user}`, which will be replaced with the user's username when tweeting.",
				usage: '<template>',
				examples: [
					'{user} is eating it up over here in @GroupName',
					'{user} invited everyone to the feast tonight! 😋',
					'success from {user} in Group Name',
				],
			},
			category: 'configuration',
			userPermissions: ['MANAGE_GUILD'],
			args: [
				{
					id: 'template',
					match: 'rest',
					type: (_: Message, str: string): null | string => {
						if (!str) return null;
						if (str.includes('{user}')) return str;
						return null;
					},
					prompt: {
						start:
							"What template would you like to add? Please include {user} to replace for the user's username. IE: `{user} is eatin' it up here in @GroupMention`.",
						retry:
							"Please provide a valid template that include {user} to replace for the user's username. IE: `{user} is eatin' it up here in @GroupMention`.",
						optional: true,
					},
				},
				{
					id: 'del',
					type: 'flag',
					match: 'flag',
					flag: ['--del', '-d'],
				},
			],
		});
	}

	public async exec(
		msg: Message,
		{ template, del }: { template: string; del: boolean },
	): Promise<Message | Message[] | void> {
		const client = this.client.settings.cache.clients.get(this.client.user!.id)!;
		const formats = client.format;
		this.client.logger.info(`[TEMPLATES] Delete: ${del}.`);
		if (del) {
			if (!formats.length) return msg.util?.reply("you don't have any templates to delete!");
			while (formats.length) {
				const data = formats.reduce((prev: string, val: string, index: number) => {
					return `${prev}\`[${index + 1}]\` - ${val}\n`;
				}, '');
				const embed = this.client.util
					.embed()
					.setColor(this.client.config.color)
					.setDescription(
						`What is the number of the template you'd like to delete? ...or type \`cancel\` to stop.\n\n${data}`,
					);
				await msg.reply(embed);
				const messages = await msg.channel.awaitMessages(
					(m) =>
						m.author.id === msg.author.id &&
						((m.content > 0 && m.content <= formats.length) || m.content.toLowerCase() === 'cancel'),
					{ max: 1, time: 20000 },
				);
				if (!messages.size) return msg.util?.send("Time's up!");
				if (messages.first()!.content.toLowerCase() === 'cancel')
					return msg.util?.send("Welp, it was nice helpin' ya!");

				const index = parseInt(messages.first()!.content, 10) - 1;
				formats.splice(index, 1)[0];
				this.client.settings.set('client', { id: this.client.user!.id }, { format: formats });
			}
			return msg.util?.send("That's all folks!");
		}

		if (!template) {
			const embed = this.client.util
				.embed()
				.setColor(this.client.config.color)
				.setAuthor('Tweet Formats', this.client.user!.displayAvatarURL())
				.setDescription(
					formats.length
						? formats.map((t) => `\`${t}\``)
						: `There are no current templates! Run \`${client.prefix} help template\`.`,
				);
			return msg.util?.reply({ embed });
		}

		if (formats.includes(template)) {
			const index = formats.indexOf(template);
			formats.splice(index, 1);
			this.client.settings.set('client', { id: this.client.user!.id }, { format: formats });

			return msg.util?.reply(`\`${template}\` has been removed from the template list.`);
		}

		formats.push(template);
		this.client.settings.set('client', { id: this.client.user!.id }, { format: formats });

		return msg.util?.reply(`successfully added \`${template}\` to the templates list.`);
	}
}

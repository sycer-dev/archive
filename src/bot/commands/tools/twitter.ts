import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command';
import { Twitter } from 'twit';
import { stripIndents } from 'common-tags';

export default class TwitterCommand extends ToolCommand {
	public constructor() {
		super('twitter', {
			channel: 'guild',
			category: 'tools',
			aliases: ['twitter'],
			description: {
				content: 'Searches for a Twitter user.',
				usage: '<user>',
				examples: ['@sycerdev', '1187082493968543744'],
			},
			args: [
				{
					id: 'id',
					prompt: {
						start: 'What is the tweet ID or twitter user would you like to loop up?',
						retry: "What is the tweet ID or twitter user you'd like to search?",
					},
				},
			],
			cooldown: 6,
		});
	}

	public async exec(msg: Message, { id }: { id: string }): Promise<Message | Message[]> {
		const m = await msg.channel.send(`Searching for user...`);
		try {
			const get = await this.client.twitter.get('users/show', { screen_name: id, id });
			if (get.resp.statusCode !== 200) throw Error(get.resp.statusMessage);
			const user = get.data as Twitter.User;
			const url = `https://twitter.com/${user.screen_name}`;
			const embed = this.client.util
				.toolEmbed()
				.setAuthor(user.name, user.profile_image_url_https.replace('_normal', ''), `${url}#${msg.guild!.nameAcronym}`)
				.addField(
					'`📋` Info',
					stripIndents`
                    \`🤝\` Followers - [\`${user.followers_count.toLocaleString('en-US')}\`](${url}/followers#${
						msg.guild!.nameAcronym
					})
                    \`👀\` Following - [\`${user.friends_count.toLocaleString('en-US')}\`](${url}/following#${
						msg.guild!.nameAcronym
					})
                    \`💖\` Likes - [\`${user.favourites_count.toLocaleString('en-US')}\`](${url}/likes#${
						msg.guild!.nameAcronym
					})
                `,
				)
				.setImage(user.profile_banner_url)
				.setThumbnail(user.profile_image_url_https.replace('_normal', ''));
			if (user.status) {
				const { status } = user;
				embed.addField(
					'`🐦` Last Tweet',
					stripIndents`
                    ${
											status.text
												? status.text.replace(/@(\w+)/gm, m => `[\`${m}\`](https://twitter.com/${m.slice(1)})`)
												: ''
										}

                    \`💖\` \`${
											status.favorite_count ? status.favorite_count.toLocaleString('en-US') : '0'
										}\` - \`🗣\` \`${status.retweet_count ? status.retweet_count.toLocaleString('en-US') : '0'}\`
                    [\`Open in Browser 🌐\`](${url}/status/${status.id_str}#${msg.guild!.nameAcronym})
                `,
				);
			}
			if (user.description)
				embed.setDescription(
					user.description.replace(/@(\w+)/gm, m => `[\`${m}\`](https://twitter.com/${m.slice(1)})`).substring(0, 2048),
				);
			if (m.editable) return m.edit('', embed);
			return msg.util!.reply({ embed });
		} catch (err) {
			if (err.statusCode === 404) {
				if (m.editable) return m.edit(`User not found!`);
				return msg.util!.reply(`user not found!`);
			}
			if (m.editable) return m.edit(`Looks like an error occurred! Error: \`${err}\`.`);
			return msg.util!.reply(`looks like an error occurred! Error: \`${err}\`.`);
		}
	}
}

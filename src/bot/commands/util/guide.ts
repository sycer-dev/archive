import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';

export default class GuideCommand extends Command {
	public constructor() {
		super('guide', {
			aliases: ['info', 'about', 'guide'],
			description: {
				content: 'Returns a guide explaining how to use the bot.'
			},
			category: 'utilities'
		});
	}

	public async exec(msg: Message): Promise<Message | Message[] | undefined> {
		if (this.client.user!.id !== '595775542569992192') return;

		const embed = this.client.util.embed()
			.setFooter(`Powered by Sycer Development • Version ${this.client.version}`, this.client.user!.displayAvatarURL())
			.setColor(msg.guild!.me!.displayColor || this.client.config.color)
			.addField('Activation', oneLine`
				To be able to use this carts bot, you must purchase access via our [Patreon page](https://patreon.com/carts).
				Before purchasing, join our [client server](https://discord.sycer.dev/) so you can gain access to the bot.
				In the case your activation doesn't setup properly, you can run the \`sync\` command.
			`)
			.addField('Configuration', stripIndents`
				Adidas Carts makes cart distribution quick and easy. All you have to do is run the \`private\` and \`public\` commands.

				The \`private\` channel sets the one that your AIO/Bot will be posting the cart messages to. This is the channel of the webhook you inputted into your bot.
				The \`public\` channel sets the one where cart panels will be opened. The first person to react with \`🛒\` will get a DM containg the cart details.
			`)
			.addField('Other', stripIndents`
				Well, that's it! If you have any other questions or concerns please don't heistate to reach out.

				**Links**
				[Client Server](https://discord.sycer.dev/)
				[Patreon Page](https://patreon.com/carts)
				[Invite Link](${await this.client.generateInvite(604499152)})
			`);
		return msg.util!.send({ embed });
	}
}


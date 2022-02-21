// import { Listener } from 'discord-akairo';
// import { Message, TextChannel } from 'discord.js';
// const COST = Number(process.env.COST);

// class MessageListener extends Listener {
// 	public constructor() {
// 		super('message', {
// 			emitter: 'client',
// 			event: 'message',
// 			category: 'client',
// 		});
// 	}

// 	public async exec(msg: Message): Promise<Message | Message[] | void> {
// 		if (!msg.guild || !msg.mentions.everyone || msg.author.id !== '602906814736236554') return;
// 		const clients = this.client.settings.cache.users.filter((u) => u.guild === msg.guild!.id && u.active);
// 		const theMsg = await (this.client.channels.cache.get('598345679529705512') as TextChannel).send(
// 			`Processing an SMS for message in ${msg.channel}.`,
// 		);
// 		const content = msg.content.replace(/- @everyone/gi, '');
// 		const { messages } = this.client.smsHandler.counter.count(
// 			`${msg.guild.name}: ${msg.content.replace(/- @everyone/gi, '')}`,
// 		);
// 		const cost = this.client.isParent ? COST * messages * clients.size : 0.0075 * messages * clients.size;
// 		return this.client.smsHandler.process(theMsg, content, clients, cost);
// 	}
// }

export const DEPRECATED = true;

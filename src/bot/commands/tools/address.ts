import { Message } from 'discord.js';
import { ToolCommand } from '../../structures/Command.js';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default class AddressCommand extends ToolCommand {
	public constructor() {
		super('address', {
			channel: 'guild',
			category: 'tools',
			aliases: ['address', 'addy'],
			description: {
				content:
					'Alter your address multiple different ways to help prevent 1 item/person transactions from getting cancelled. ONLY input your street address. See examples below.',
				usage: '<address>',
				examples: ['1234 Sesame St.', '6314 N. 97th Place'],
			},
			cooldown: 3,
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'address',
					match: 'rest',
					prompt: {
						start: "What's the address you'd like me to alter?",
					},
				},
			],
		});
	}

	public async exec(msg: Message, { address }: { address: string }): Promise<Message | Message[]> {
		if (msg.deletable) await msg.delete();
		const m = await msg.channel.send('Generating addresses...');
		const arr: string[] = [];
		for (let i = 0; i < 10; ) {
			const gen = this.create(address);
			if (arr.includes(gen)) continue;
			i++;
			arr.push(gen);
			continue;
		}
		const embed = this.client.util
			.toolEmbed()
			.setTitle('Address Generator')
			.setDescription(`Original: \`${address}\`\n\n${arr.map(a => `\`${a}\``).join('\n')}||`);
		try {
			await msg.author.send({ embed });
		} catch (err) {
			if (m.editable) return m.edit('Please unlock your DMs and try again!');
			return msg.util!.send('Please unlock your DMs and try again!');
		}
		if (m.editable) return m.edit("I've sent you a DM with your generated addresses!");
		return msg.util!.send("I've sent you a DM with your generated addresses!");
	}

	private create(addy: string): string {
		const randomFour = '####'
			.split('')
			.map((): string => this.randomElem(LETTERS))
			.join('');
		const shouldAbbreviate = Math.random() >= 0.5;
		if (shouldAbbreviate) {
			if (addy.toLowerCase().includes('street')) {
				addy = addy.replace('street', 'St.');
				addy = addy.replace('Street', 'St.');
			} else if (addy.toLowerCase().includes('st')) {
				addy = addy.replace('st', 'Street');
				addy = addy.replace('st.', 'Street');
				addy = addy.replace('St', 'Street');
				addy = addy.replace('St.', 'Street');
			} else if (addy.toLowerCase().includes('court')) {
				addy = addy.replace('court', 'Ct.');
				addy = addy.replace('Court', 'Ct.');
			} else if (addy.toLowerCase().includes('ct')) {
				addy = addy.replace('ct', 'Court');
				addy = addy.replace('ct.', 'Court');
				addy = addy.replace('Ct', 'Court');
				addy = addy.replace('Ct.', 'Court');
			} else if (addy.toLowerCase().includes('road')) {
				addy = addy.replace('road', 'Rd.');
				addy = addy.replace('Roat', 'Rd.');
			} else if (addy.toLowerCase().includes('rd')) {
				addy = addy.replace('rd', 'Road');
				addy = addy.replace('rd.', 'Road');
				addy = addy.replace('Rd', 'Road');
				addy = addy.replace('Rd.', 'Road');
			} else if (addy.toLowerCase().includes('drive')) {
				addy = addy.replace('drive', 'Dr.');
				addy = addy.replace('Drive', 'Dr.');
			} else if (addy.toLowerCase().includes('dr')) {
				addy = addy.replace('dr', 'Drive');
				addy = addy.replace('dr.', 'Drive');
				addy = addy.replace('Dr', 'Drive');
				addy = addy.replace('Dr.', 'Drive');
			} else if (addy.toLowerCase().includes('lane')) {
				addy = addy.replace('lane', 'Ln.');
				addy = addy.replace('Lane', 'Ln.');
			} else if (addy.toLowerCase().includes('ln')) {
				addy = addy.replace('ln', 'Lane');
				addy = addy.replace('ln.', 'Lane');
				addy = addy.replace('Ln', 'Lane');
				addy = addy.replace('Ln.', 'Lane');
			}
		}
		const randomNum = Math.floor(Math.random() * 99).toFixed();
		const extras = ['Apt.', 'Apartment', 'Un.', 'Unit', 'Rm.', 'Room', 'Suite', 'St.'];
		const randomExtra = extras[Math.floor(Math.random() * extras.length)];
		return `${randomFour} ${addy} ${randomExtra} ${randomNum}`;
	}

	public randomElem(arr: string): string {
		return arr[this.randomInt(0, arr.length - 1)];
	}

	public randomInt(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

import { stripIndents } from 'common-tags';
import { Flag, PrefixSupplier } from 'discord-akairo';
import { Message } from 'discord.js';
import { ToolCommand } from '../../../structures/Command';

interface Group {
	customerID?: string;
	guildIDs: string[];
	name: string;
	owner: string;
	staff: string[];
	items: Item[];
}

interface Item {
	botID: string;
	group: Group;
	groupID: string;
	item: number;
	type: 'monthly' | 'lifetime';
	nextAvatarChange?: Date;
	nextUsernameChange?: Date;
}

export interface HypervisorAPIResponse {
	code: number;
	message: string | Group;
}

export default class ChangeCommand extends ToolCommand {
	public constructor() {
		super('change', {
			channel: 'guild',
			category: 'staff',
			aliases: ['change', 'update'],
			description: {
				content: stripIndents`
					Available Methods:

						• avatar <image>
						• username <new username>
					
					Required: \`<>\` ~ Optional: \`[]\`
					
					For additional information, refer to the examples below.
				`,
				usage: '<method> [arguments]',
				examples: ['avatar https://i.imgur.com/xyz...', 'username Picke Pings Success'],
			},
			userPermissions: ['ADMINISTRATOR'],
		});
	}

	public *args(): object {
		const method = yield {
			type: [
				['change-avatar', 'avatar', 'af', 'pfp', 'img'],
				['change-username', 'username', 'name'],
			],
			otherwise: (msg: Message): string => {
				const prefix = (this.handler.prefix as PrefixSupplier)(msg);
				return `There's a lot to learn here pal. Run \`${prefix}help reaction\` to see all the different methods.`;
			},
		};

		return Flag.continue(method);
	}
}

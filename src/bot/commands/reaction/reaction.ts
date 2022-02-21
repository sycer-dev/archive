import { Flag } from 'discord-akairo';
import { stripIndents } from 'common-tags';
import { ToolCommand } from '../../structures/Command';

export default class ReactionCommand extends ToolCommand {
	public constructor() {
		super('reaction', {
			channel: 'guild',
			category: 'Reaction Roles',
			aliases: ['reaction', 'rr'],
			description: {
				content: stripIndents`
					Available Methods:

						• add <channel> <message id> <emoji> <role>
						• removerole <ref id>
					
					Required: \`<>\` ~ Optional: \`[]\`
					
					For additional information, refer to the examples below.
				`,
				usage: '<method> [arguments]',
				examples: [
					'add 1 #reaction-roles 603009228180815882 🍕 Member',
					'add 2 welcome 603009471236538389 :blobbouce: Blob',
					'add 3 roles 602918902141288489 :apple: Apples',
					'removerole xya-10ana',
				],
			},
			userPermissions: ['ADMINISTRATOR'],
		});
	}

	public *args(): object {
		const method = yield {
			type: [
				['rr-add', 'add', 'new'],
				['rr-remove', 'remove', 'delete', 'del'],
			],
			otherwise: (): string => {
				const prefix = this.handler.prefix;
				return `There's a lot to learn here pal. Run \`${prefix}help reaction\` to see all the different methods.`;
			},
		};

		return Flag.continue(method);
	}
}

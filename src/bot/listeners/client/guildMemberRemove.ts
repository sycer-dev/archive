import { Listener } from 'discord-akairo';
import { Constants, GuildMember } from 'discord.js';
import { User } from '../../../database';

export default class extends Listener {
	public constructor() {
		super(Constants.Events.GUILD_MEMBER_REMOVE, {
			emitter: 'client',
			event: Constants.Events.GUILD_MEMBER_REMOVE,
			category: 'client',
		});
	}

	public async exec(member: GuildMember): Promise<void> {
		const row = await User.findOne({ userID: member.id, guildID: member.guild.id, active: true });

		if (row) {
			row.active = false;
			void row.save();

			this.client.smsHandler.sendShortLog(
				`[MEMBER LEFT] Removed ${member.user.tag} (\`${member.id}\`) from the list as they've left the server.`,
				member.guild.id,
			);
		}
	}
}

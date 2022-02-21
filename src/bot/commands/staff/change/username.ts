import { Argument, Command } from 'discord-akairo';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { HypervisorAPIResponse } from './change';

export default class ChangeUsernameCommand extends Command {
	public constructor() {
		super('change-username', {
			channel: 'guild',
			category: 'staff',
			description: {
				content: "Changes the bot's username - one hour cooldown after changing.",
				usage: '<username>',
				examples: ['Pickle Pings Success', 'PicklePings Toolkit'],
			},
			args: [
				{
					id: 'username',
					type: Argument.validate('string', (_: Message, str: string): boolean => str.length <= 32 && str.length >= 2),
					match: 'restContent',
					prompt: {
						start:
							"What would you like to set the bot's username to? Please provide a string between 2 and 32 characters in length.",
						retry: 'Please provide a new username between 2 and 32 characters in length.',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { username }: { username: string }): Promise<Message | Message[] | void> {
		const profile = await fetch('https://external.sycer.dev/manager/api/group', {
			method: 'POST',
			body: JSON.stringify({
				guildID: msg.guild?.id,
				authorID: msg.author.id,
			}),
			headers: {
				Authorization: Buffer.from(this.client.user!.id).toString('base64'),
				'Content-Type': 'application/json',
			},
		});
		if (profile.status === 401) return msg.util?.reply(`sorry chap, you're not authorized to perform that action!`);
		if (profile.status === 404)
			return msg.util?.reply(`not quite sure what happened, the manager couldn't find the group settings.`);
		const json = (await profile.json()) as HypervisorAPIResponse;
		if (json.code === 200) {
			if (typeof json.message === 'string') return msg.util?.reply(json.message);
			const theItem = json.message.items.find(i => i.botID === this.client.user?.id);
			if (theItem) {
				if (theItem.nextUsernameChange && theItem.nextUsernameChange.getTime() > Date.now())
					return msg.util?.send(
						`sorry pal, you can't change the bot's username for another \`${(
							(theItem.nextUsernameChange.getTime() - Date.now()) /
							60
						).toFixed(0)}\` minutes - there is a 1 hour cooldown between changes.`,
					);
				try {
					await this.client.user?.setUsername(username);
					await fetch('https://external.sycer.dev/manager/api/bot', {
						method: 'POST',
						body: JSON.stringify({
							botID: this.client.user?.id,
							change: 'username',
						}),
						headers: {
							Authorization: Buffer.from(this.client.user!.id).toString('base64'),
							'Content-Type': 'application/json',
						},
					});
					return msg.util?.reply(`successfully updated the bot's username. It can be updated again in \`1 hour\`.`);
				} catch (err) {
					return msg.util?.reply(
						`oh no, looks like an error occurred when trying to set the bot's username: \`${err}\`.`,
					);
				}
			}
			return msg.util?.send(
				`looks like this bot hasn't been added to ${json.message.name}'s profile yet. Please dm Fyko#0001 in the Sycer Development client server to add it.`,
			);
		}
	}
}

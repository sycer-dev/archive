import type { RESTPostOAuth2AccessTokenResult } from 'discord-api-types';
import { MessageEmbed } from 'discord.js';
import type { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';
import twilio from 'twilio';
import { client, log, stripe } from '../..';
import { Guild, User } from '../../database';
import { fetchUser, fetchUserGuilds } from '../util';

export function setupAPI(fastify: FastifyInstance, _: any, done: () => void) {
	fastify.get('/api/@me', async (req, res) => {
		const token: RESTPostOAuth2AccessTokenResult | undefined = req.session.get('token');

		if (!token) return res.status(401).send('Unauthorized.');
		const user = await fetchUser(token);
		return res.type('application/json').send(user);
	});

	fastify.post('/api/alerts/create', async (req, res) => {
		const apikey = req.headers.authorization;
		const row = await Guild.findOne({ apikey });
		if (row) return res.status(404).send({ error: 'A row for that guild was not found in the database.' });

		const { content } = req.body as { content?: string };
		if (!content) return res.status(400).send({ error: 'The required "content" body was not included.' });

		const guild = client.guilds.cache.get(row!.id);

		const sms = twilio(row!.twilio!.sid, row!.twilio!.token);
		const service = sms.notify.services(row!.twilio!.notify);

		const body = `${guild!.name}: ${content}\nrates may apply.`;
		const clients = await User.find({ guildID: row!.id, active: true });

		const toBinding = clients.map((number) => JSON.stringify({ binding_type: 'sms', address: number.number }));
		const notif = await service.notifications.create({ toBinding, body }).catch((err: Error) => err);
		if (notif instanceof Error) {
			return res.status(500).send({ error: `An error was thrown when processing the alert: ${notif}` });
		}

		return res.status(200).send({ message: 'The alert was successfully processed.' });
	});

	fastify.post('/api/activate/:serverID', async (req, res) => {
		const token: RESTPostOAuth2AccessTokenResult | undefined = req.session.get('token');
		if (!token) return res.status(401).send('Unauthorized.');

		const user = await fetchUser(token);
		const guilds = await fetchUserGuilds(token);

		const server = guilds.find((g) => g.id === (req.params as Record<string, string>).serverID);
		if (!server) return res.status(401).send('Unauthorized.');

		const row = await Guild.findOne(server.id);
		if (!row) return res.status(409).send({ message: 'Guild document not found!', type: 'error' });

		const session = await stripe.checkout.sessions.create({
			client_reference_id: `sms_activate_${server.id}`,
			payment_method_types: ['card'],
			subscription_data: {
				items: [
					{
						plan: process.env.SMS_PLAN_ID!,
						quantity: 1,
					},
				],
			},
			success_url: `${process.env.BASE_URL!}server/${server.id}`,
			cancel_url: `${process.env.BASE_URL!}server/${server.id}`,
		});

		void log.send({
			embeds: [
				new MessageEmbed()
					.setColor('#36393f')
					.setTitle('Activation Redirection')
					.setDescription(
						`<@${user.id}> [${user.username}#${user.discriminator}] representing **${server.name}** (\`${server.id}\`) is being redirected to Stripe for activation.`,
					)
					.setTimestamp(),
			],
		});

		return res.status(200).send({ sessionId: session.id });
	});

	fastify.patch('/api/billing/:serverID', async (req, res) => {
		const token: RESTPostOAuth2AccessTokenResult | undefined = req.session.get('token');
		if (!token) return res.status(401).send('Unauthorized.');

		const guilds = await fetchUserGuilds(token);
		const user = await fetchUser(token);

		const server = guilds.find((g) => g.id === (req.params as Record<string, string>).serverID);
		if (!server) return res.status(401).send('Unauthorized.');

		const row = await Guild.findOne(server.id);
		if (!row) return res.status(409).send({ message: 'Guild document not found!', type: 'error' });
		if (!row.subscriptionID) return res.status(409).send({ message: 'This server is not activated!', type: 'error' });

		const sub = await stripe.subscriptions.retrieve(row.subscriptionID);

		void log.send({
			embeds: [
				new MessageEmbed()
					.setColor('#36393f')
					.setTitle('Customer Portal Redirection')
					.setDescription(
						`<@${user.id}> [${user.username}#${user.discriminator}] representing **${server.name}** (\`${server.id}\`) is being redirected to the Stripe billing portal.`,
					)
					.setTimestamp(),
			],
		});

		const session = await stripe.billingPortal.sessions.create({
			customer: sub.customer as string,
			return_url: `${process.env.BASE_URL!}server/${server.id}`,
		});

		return res.status(302).send(session.url);
	});

	fastify.patch('/api/twilio/:serverID', async (req, res) => {
		const token: RESTPostOAuth2AccessTokenResult | undefined = req.session.get('token');
		if (!token) return res.status(401).send('Unauthorized.');

		const guilds = await fetchUserGuilds(token);
		const user = await fetchUser(token);

		const server = guilds.find((g) => g.id === (req.params as Record<string, string>).serverID);
		if (!server) return res.status(401).send('Unauthorized.');

		const row = await Guild.findOne(server.id);
		if (!row) return res.status(409).send({ message: 'Guild document not found!', type: 'error' });
		if (!row.subscriptionID) return res.status(409).send({ message: 'This server is not activated!', type: 'error' });

		const body = { ...row.twilio, ...(req.body as { sid: string; token: string; notify: string; verify: string }) };
		try {
			const sms = twilio(body.sid, body.token);
			const res = await fetch('https://api.twilio.com/2010-04-01/Accounts.json', {
				headers: {
					Authorization: `Basic ${Buffer.from(`${body.sid}:${body.token}`).toString('base64')}`,
				},
			});
			const account: {
				code: number;
				detail: string;
				message: string;
				more_info: string;
				status: number;
			} = await res.json();
			if (account.status === 401) throw Error(account.detail);

			const numbers = await sms.incomingPhoneNumbers.list();
			const number = numbers[0];
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!number) throw Error('This Twilio account does not have any rented phone numbers!');

			row.twilio = { ...body, number: number.phoneNumber };

			void log.send({
				embeds: [
					new MessageEmbed()
						.setColor('#36393f')
						.setTitle('Twilio Credentials Update')
						.setDescription(
							`<@${user.id}> [${user.username}#${user.discriminator}] representing **${server.name}** (\`${server.id}\`) edited their Twilio credentials.`,
						)
						.setTimestamp(),
				],
			});

			await row.save();
		} catch (_err) {
			const err: Error = _err;
			console.dir(err);

			const error = (message: string) => res.status(409).send({ message, type: 'error' });

			if (err.message.includes('start with AC'))
				return error('The Twilio account SID you provided must start with "AC".');

			if (err.message === 'Your AccountSid or AuthToken was incorrect.')
				return error('The Twilio account ID or token you provided is incorrect.');

			return error(err.message);
		}

		return res.status(203).send({ type: 'success' });
	});

	done();
}

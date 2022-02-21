import { client, stripe } from '../..';
import { Guild } from '../../database';
import { fetchUser, fetchUserGuilds, generateContactFile } from '../util';
import type { FastifyInstance } from 'fastify';
import type { RESTPostOAuth2AccessTokenResult } from 'discord-api-types';
import { URLSearchParams } from 'url';
import twilio from 'twilio';

const { STRIPE_PUBLIC_KEY } = process.env as { STRIPE_PUBLIC_KEY: string };

export function setupUserRoutes(fastify: FastifyInstance, _: any, done: () => void) {
	fastify.get('/@me', async (req, res) => {
		const token: RESTPostOAuth2AccessTokenResult | undefined = req.session.get('token');

		if (!token) return res.redirect(`/login?ref=${req.url}`);
		const user = await fetchUser(token);
		const guilds = await fetchUserGuilds(token);
		return res.view('/views/me.ejs', { user, guilds });
	});

	fastify.get('/server/:serverID/contact', async (req, res) => {
		const { serverID } = req.params as Record<string, string>;
		const row = await Guild.findOne(serverID);
		const guild = await client.guilds.fetch(serverID).catch(() => undefined);
		if (!row || !guild) {
			return res.view('/views/error.ejs', { message: 'Server not found.' });
		}

		if (!row.twilio?.sid || !row.twilio.token) {
			return res.view('/views/error.ejs', {
				message: 'Unable to generate contact. Please ask a server administrator to finish Twilio setup.',
			});
		}

		const tclient = twilio(row.twilio.sid, row.twilio.token);
		const numbers = await tclient.incomingPhoneNumbers.list();
		const contact = generateContactFile(numbers, guild.name, guild.iconURL({ size: 512, format: 'png' })!);

		return res.type('text/vcard').send(contact);
	});

	fastify.get('/server/:serverID', async (req, res) => {
		const token: RESTPostOAuth2AccessTokenResult | undefined = req.session.get('token');

		if (!token) return res.redirect(`/login?ref=${req.url}`);
		const userP = fetchUser(token);
		const guildsP = fetchUserGuilds(token);
		const [user, guilds] = await Promise.all([userP, guildsP]);

		const server = guilds.find((g) => g.id === (req.params as Record<string, string>).serverID);
		if (!server) {
			return res.view('/views/error.ejs', { message: "You're not authorized to manage that server." });
		}

		const row = await Guild.findOne(server.id).then((x) => x);

		const twilio = row?.twilio ?? { sid: '', token: '', number: '', notify: '' };

		const inviteParams = new URLSearchParams();
		inviteParams.set('client_id', client.user!.id);
		inviteParams.set('guild_id', server.id);
		inviteParams.set('permissions', '8');
		inviteParams.set('scope', 'bot');
		const inviteURL = `https://discord.com/oauth2/authorize?${inviteParams}`;

		const data: Record<string, unknown> = { inviteURL, twilio, user, server, STRIPE_PUBLIC_KEY };
		if (row?.subscriptionID) {
			const sub = await stripe.subscriptions
				.retrieve(row.subscriptionID, {
					expand: ['default_payment_method'],
				})
				.catch(() => null);

			if (!sub!.default_payment_method) {
				const pms = await stripe.paymentMethods.list({ customer: sub!.customer as string, type: 'card' });
				sub!.default_payment_method = pms[0];
			}

			if (!row.customerID) {
				row.customerID = sub?.customer as string;
				await row.save();
			}
			if (sub) {
				data.sub = sub;
			}

			return res.view('/views/subbed-server.ejs', data);
		}

		return res.view('/views/reg-server.ejs', data);
	});

	done();
}

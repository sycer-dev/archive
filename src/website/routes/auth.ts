import FormData from '@discordjs/form-data';
import { randomBytes } from 'crypto';
import type { RESTPostOAuth2AccessTokenResult } from 'discord-api-types';
import { MessageEmbed } from 'discord.js';
import type { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { log } from '../..';
import { fetchUser } from '../util';

const states = new Map<string, string>();

export function setupAuth(fastify: FastifyInstance, _: any, done: () => void) {
	fastify.get('/login', async (request, reply) => {
		const { ref } = request.query as { ref: string | undefined };
		const state = randomBytes(16).toString('hex');
		states.set(state, ref ?? '');

		const query = new URLSearchParams();
		query.append('state', state);
		query.append('prompt', 'none');
		query.append('client_id', process.env.DISCORD_CLIENT_ID!);
		query.append('response_type', 'code');
		query.append('scope', process.env.DISCORD_SCOPES!.split(',').join(' '));
		query.append('redirect_uri', `${process.env.BASE_URL!}api/login/callback`);
		const url = `https://discord.com/api/oauth2/authorize?${query}`;

		return reply.redirect(url);
	});

	fastify.get('/api/login/callback', async (request, reply) => {
		if ((request.query as Record<string, string>).error) {
			return reply.redirect('/');
		}

		const { code, state } = request.query as { code: string; state: string };
		const stateExists = states.get(state);
		if (typeof stateExists === 'undefined') {
			return reply
				.type('text/html')
				.send(
					'<meta HTTP-EQUIV="REFRESH" content="3; url=/login"> Invalid XSS-prevention code on your return... sending you back to Discord.',
				);
		}

		const data = new FormData();
		data.append('client_id', process.env.DISCORD_CLIENT_ID!);
		data.append('client_secret', process.env.DISCORD_SECRET!);
		data.append('grant_type', 'authorization_code');
		data.append('redirect_uri', `${process.env.BASE_URL!}api/login/callback`);
		data.append('scope', process.env.DISCORD_SCOPES!.split(',').join(' '));
		data.append('code', code);

		const token = (await (
			await fetch('https://discordapp.com/api/oauth2/token', {
				method: 'POST',
				// @ts-ignore
				body: data,
				headers: data.getHeaders(),
			})
		).json()) as RESTPostOAuth2AccessTokenResult;

		request.session.set('token', token);
		const user = await fetchUser(token);
		void log.send({
			embeds: [
				new MessageEmbed()
					.setColor('#36393f')
					.setTitle('New Login')
					.setDescription(`<@${user.id}> [${user.username}#${user.discriminator}] just logged in.`)
					.setTimestamp(),
			],
		});

		fastify.log.debug('Set the token session, sending back home.');
		return reply.redirect(stateExists.length ? stateExists : '/@me');
	});

	fastify.get('/logout', async (req, res) => {
		const token: RESTPostOAuth2AccessTokenResult | undefined = req.session.get('token');
		if (token) {
			const user = await fetchUser(token);
			void log.send({
				embeds: [
					new MessageEmbed()
						.setColor('#36393f')
						.setTitle('User Logout')
						.setDescription(`<@${user.id}> [${user.username}#${user.discriminator}] just logged out.`)
						.setTimestamp(),
				],
			});
		}

		req.session.delete();
		return res.redirect('/');
	});

	done();
}

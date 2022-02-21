import { MessageEmbed } from 'discord.js';
import type { FastifyInstance } from 'fastify';
import phone from 'phone';
import twilio from 'twilio';
import { client, log } from '../..';
import { logger } from '../../bot/util/Constants';
import { User } from '../../database';

export function setupOnboarding(fastify: FastifyInstance, _: any, done: () => void) {
	fastify.get('/onboarding', async (req, res) => {
		const query = req.query as { key?: string };
		const data = client.onboarding.get(query.key ?? '');
		if (!data)
			return res.view('/views/error.ejs', {
				message: 'Invalid onboarding key. Please re-react to the onboarding panel.',
			});

		return res.view('/views/onboarding.ejs', { user: data.user, key: query.key });
	});

	fastify.post('/api/onboarding/start', async (req, res) => {
		const query = req.query as { key?: string };
		const data = client.onboarding.get(query.key ?? '');
		if (!data)
			return res
				.status(409)
				.send({ type: 'error', message: 'Invalid onboarding key. Please re-react to the onboarding panel.' });

		const number = (req.body as { number?: string }).number;
		const parsedNumber = phone(number ?? '');
		if (!parsedNumber.length)
			return res
				.status(409)
				.send({ type: 'error', message: 'An invalid phone number was provided. Please try again.' });

		const row = await client.settings.guild(data.guildID);
		if (!row.twilio?.verify || !row.twilio.sid || !row.twilio.token)
			return res.status(409).send({ type: 'error', message: 'Web onboarding is not supported for this server.' });

		const verify = twilio(row.twilio.sid, row.twilio.token).verify.services(row.twilio.verify);
		try {
			const check = await verify.verifications.create({ to: parsedNumber[0], channel: 'sms', locale: 'en' });
			const guild = client.guilds.cache.get(data.guildID);

			logger.debug(
				`[ONBOARDING]: Started verification for ${data.user.tag} (${data.user.id}) within ${guild!.name} (${
					guild!.id
				}) with SID ${check.sid}`,
			);
			void log.send({
				embeds: [
					new MessageEmbed()
						.setColor('#36393f')
						.setTitle('Verification Created')
						.setDescription(
							`Started verification for ${data.user.tag} (\`${data.user.id}\`) within ${guild!.name} (\`${
								guild!.id
							}\`) (\`SID${check.sid}\`).`,
						)
						.setTimestamp(),
				],
			});
			return res.status(200).send({ type: 'success', id: check.sid });
		} catch (err) {
			logger.error(err);
			return res.status(409).send({ type: 'error', message: 'An unknown error occurred.' });
		}
	});

	fastify.post('/api/onboarding/submit', async (req, res) => {
		const query = req.query as { key?: string };
		const data = client.onboarding.get(query.key ?? '');
		if (!data)
			return res
				.status(409)
				.send({ type: 'error', message: 'Invalid onboarding key. Please re-react to the onboarding panel.' });

		const { code, id } = req.body as { code?: string; id?: string };
		if (code?.length !== 6)
			return res
				.status(409)
				.send({ type: 'error', message: 'An invalid verification code was provided. Please try again.' });

		const row = await client.settings.guild(data.guildID);
		if (!row.twilio?.verify || !row.twilio.sid || !row.twilio.token)
			return res.status(409).send({ type: 'error', message: 'Web onboarding is not supported for this server.' });

		const verify = twilio(row.twilio.sid, row.twilio.token).verify.services(row.twilio.verify);

		try {
			const guild = client.guilds.cache.get(data.guildID);
			const check = await verify.verificationChecks.create({ code, verificationSid: id });
			if (check.status !== 'approved') {
				logger.debug(
					`[ONBOARDING]: Verification failed for ${data.user.tag} (${data.user.id}) within ${guild!.name} (${
						guild!.id
					}) with SID ${check.sid}`,
				);
				void log.send({
					embeds: [
						new MessageEmbed()
							.setColor('#36393f')
							.setTitle('Verification Failed')
							.setDescription(
								`Verification for ${data.user.tag} (\`${data.user.id}\`) within ${guild!.name} (\`${
									guild!.id
								}\`) failed with status \`${check.status}\`. (\`SID${check.sid}\`).`,
							)
							.setTimestamp(),
					],
				});
				return res
					.status(409)
					.send({ type: 'error', text: 'Verification failed, please re-react to the onboarding panel.' });
			}

			await User.create({
				userID: data.user.id,
				guildID: data.guildID,
				number: check.to,
			}).save();

			logger.debug(
				`[ONBOARDING]: Verification completed for ${data.user.tag} (${data.user.id}) within ${guild!.name} (${
					guild!.id
				}) with SID ${check.sid}`,
			);
			void log.send({
				embeds: [
					new MessageEmbed()
						.setColor('#36393f')
						.setTitle('Verification Completed')
						.setDescription(
							`Completed verification for ${data.user.tag} (\`${data.user.id}\`) within ${guild!.name} (\`${
								guild!.id
							}\`) (\`SID${check.sid}\`).`,
						)
						.setTimestamp(),
				],
			});
			client.onboarding.delete(query.key!);
			return res.status(200).send({ type: 'success' });
		} catch (err) {
			logger.error(err);
			return res.status(409).send({ type: 'error', message: 'An unknown error occurred.' });
		}
	});

	done();
}

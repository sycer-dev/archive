import { execSync } from 'child_process';
import ejs from 'ejs';
import fastify from 'fastify';
import session from 'fastify-secure-session';
import staticServe from 'fastify-static';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';
import { join } from 'path';
import pov from 'point-of-view';
import routes from './routes';
import { URL } from 'url';
// import helmet from 'fastify-helmet';

execSync('./node_modules/.bin/secure-session-gen-key > secret-key');

let metrics = { users: '', sent: '' };

const baseUrl = new URL(process.env.BASE_URL!);

async function fetchMetrics() {
	const res = await (await fetch('https://external.sycer.dev/sms/metrics')).text();
	const [, users] = res.match(/smsv2_user_count\s(\d+)/) ?? [null, null];
	const [, sent] = res.match(/smsv2_sms_count\s(\d+)/) ?? [null, null];
	metrics = {
		users: Number(Number(users ?? '0').toPrecision(2)).toLocaleString('en-US'),
		sent: Number(Number(sent ?? '0').toPrecision(2)).toLocaleString('en-US'),
	};
}

export async function bootstrapWebserver() {
	const server = fastify({ logger: { prettyPrint: true, level: 'info' } });

	await server.register(session, {
		key: readFileSync(join(process.cwd(), 'secret-key')),
		cookieName: 'sid',
		cookie: {
			domain: baseUrl.hostname,
			path: '/',
			httpOnly: false,
			secure: false,
			maxAge: 6 * 60 * 60,
		},
	});

	// await server.register(helmet);

	await server.register(staticServe, {
		root: join(process.cwd(), '/public'),
		prefix: '/public',
	});

	await server.register(pov, {
		engine: {
			ejs,
		},
	});

	server.get('/', (_, res) => {
		void res.view('/views/index.ejs', metrics);
	});

	for (const route of routes) await server.register(route);

	await fetchMetrics();
	setInterval(() => void fetchMetrics(), 60 * 1000);
	void server.listen(process.env.PORT ?? '4317', '0.0.0.0');
}

// void bootstrap();

import Stripe from 'stripe';
import SMSClient from './bot/client/SMSClient';
import Metrics from './bot/util/metrics';
import { SettingsProvider } from './database';
import { bootstrapWebserver } from './website';
import { WebhookClient } from 'discord.js';

export const stripe = new Stripe(process.env.STRIPE_API_KEY!, { typescript: true, apiVersion: '2020-08-27' });
export const settings = new SettingsProvider();
export const metrics = new Metrics();
export const log = new WebhookClient(process.env.LOG_ID!, process.env.LOG_TOKEN!);

export const client = new SMSClient({
	token: process.env.DISCORD_TOKEN!,
	color: process.env.COLOR!,
	owners: process.env.OWNERS?.split(',') ?? '',
	prefix: process.env.PREFIX ?? '?',
});

client.stripe = stripe;
client.settings = settings;

async function bootstrap() {
	await settings.init();
	await client.launch();
	await bootstrapWebserver();
}

void bootstrap();

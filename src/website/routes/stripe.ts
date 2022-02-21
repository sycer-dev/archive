import { MessageEmbed } from 'discord.js';
import type { FastifyInstance } from 'fastify';
import type Stripe from 'stripe';
import { client, log, stripe } from '../..';
import { Guild } from '../../database';

export function setupStripe(fastify: FastifyInstance, _: any, done: () => void) {
	fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_, body, done) => {
		done(null, body);
	});

	fastify.post('/api/webhooks/stripe', async (req, res) => {
		let event: Stripe.Event;
		try {
			event = stripe.webhooks.constructEvent(
				req.body as string,
				req.headers['stripe-signature'] ?? 'nil',
				process.env.STRIPE_WEBHOOK_SECRET!,
			);
		} catch (err) {
			console.error(err);
			return res.status(409).send(`${err}`);
		}

		fastify.log.info(`Recieved a Stripe webhook event ${event.type}`);

		if (event.type === 'checkout.session.completed') await handleCheckoutSessionComplete(event);
		if (event.type === 'customer.subscription.deleted') await handleSubscriptionDelete(event);
		if (event.type === 'payment_method.attached') await handlePMAttach(event);

		// customer.subscription.updated is fired when the card is switched for a specific subscription
		// customer.updated is fired when the default payment method itself is changed
		if (event.type === 'customer.updated') await handleCustomerUpdate(event);

		return res.status(200).send('OK');
	});

	done();
}

async function handleCustomerUpdate(event: Stripe.Event): Promise<boolean> {
	const data = event.data.object as Stripe.Customer;
	const row = await Guild.findOne({ customerID: data.id });

	const guild = client.guilds.cache.get(row!.id);
	void log.send({
		embeds: [
			new MessageEmbed()
				.setColor('#36393f')
				.setTitle('Customer Update')
				.setDescription(`${guild!.name} (\`${guild!.id}\`) just changed their default payment method.`)
				.setTimestamp(),
		],
	});

	await stripe.subscriptions.update(row!.subscriptionID!, {
		default_payment_method: data.invoice_settings.default_payment_method as string,
	});

	return true;
}

async function handlePMAttach(event: Stripe.Event): Promise<boolean> {
	const data = event.data.object as Stripe.PaymentMethod;
	const row = await Guild.findOne({ customerID: data.customer as string });

	const guild = client.guilds.cache.get(row!.id);
	void log.send({
		embeds: [
			new MessageEmbed()
				.setColor('#36393f')
				.setTitle('Customer Update')
				.setDescription(`${guild!.name} (\`${guild!.id}\`) just changed their default payment method.`)
				.setTimestamp(),
		],
	});

	await stripe.paymentMethods.attach(data.id, {
		customer: data.customer as string,
	});

	await stripe.subscriptions.update(row!.subscriptionID!, {
		default_payment_method: data.id,
	});

	return true;
}

async function handleSubscriptionDelete(event: Stripe.Event): Promise<boolean> {
	const data = event.data.object as Stripe.Subscription;

	const row = await Guild.findOne({ subscriptionID: data.id });
	if (row) {
		row.allowed = false;
		await row.save();
	}

	const guild = client.guilds.cache.get(row!.id);
	void log.send({
		embeds: [
			new MessageEmbed()
				.setColor('#36393f')
				.setTitle('Subscription Cancelled')
				.setDescription(`${guild!.name} (\`${guild!.id}\`) just cancelled their subscription.`)
				.setTimestamp(),
		],
	});

	return true;
}

async function handleCheckoutSessionComplete(event: Stripe.Event): Promise<boolean> {
	const data = event.data.object as Stripe.Checkout.Session;

	// `sms_activate_${server.id}` or `sms_billing_${server.id}`
	const [prefix, type, id] = data.client_reference_id?.split('_') ?? ['', '', ''];
	if (prefix !== 'sms') return false;

	// TODO: handle billing updates
	const row = await Guild.findOne(id);
	if (type === 'billing') return _handleBilling(event);

	row!.subscriptionID = typeof data.subscription === 'string' ? data.subscription : data.subscription!.id;
	row!.customerID = data.customer as string;
	row!.allowed = true;
	await row!.save();

	const guild = client.guilds.cache.get(row!.id);
	void log.send({
		embeds: [
			new MessageEmbed()
				.setColor('#36393f')
				.setTitle('Subscription Created')
				.setDescription(`${guild!.name} (\`${guild!.id}\`) just subscribed!`)
				.setTimestamp(),
		],
	});

	return true;
}

async function _handleBilling(event: Stripe.Event): Promise<boolean> {
	const data = event.data.object as Stripe.Checkout.Session;
	const intent =
		typeof data.setup_intent === 'string'
			? await stripe.setupIntents.retrieve(data.setup_intent, { expand: ['customer', 'payment_method'] })
			: data.setup_intent;

	await stripe.paymentMethods.attach((intent!.payment_method as Stripe.PaymentMethod).id, {
		customer: intent!.metadata!.customer_id,
	});

	// may cause conflict later down the road if we change the default to this
	// await stripe.customers.update(intent.metadata!.customer_id, {
	// 	invoice_settings: {
	// 		default_payment_method: (intent.payment_method as Stripe.PaymentMethod).id,
	// 	},
	// });
	await stripe.subscriptions.update(intent!.metadata!.subscription_id, {
		default_payment_method: (intent!.payment_method as Stripe.PaymentMethod).id,
	});

	return true;
}

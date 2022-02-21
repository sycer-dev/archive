import twilio, { Twilio } from 'twilio';
import type { IncomingPhoneNumberListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/incomingPhoneNumber';
import type { ServiceListInstanceCreateOptions as NotifyServiceCreateOptions } from 'twilio/lib/rest/notify/v1/service';
import type { ServiceListInstanceCreateOptions as VerifyServiceCreateOptions } from 'twilio/lib/rest/verify/v2/service';
// const SID = 'AC52eaf41f88952c3e92cb9fdc884c8e3a';
// const TOKEN = '6e23fc8fc0f302b5cba17b1ecb78a9f3';

/**
 * The class for setting up a Twilio client
 */
export default class SetupHelper {
	/**
	 * The Twilio client for processing requests
	 */
	public readonly client: Twilio;

	/**
	 * Options for creating a setup workflow
	 * @param accountSid - The Twilio account SID
	 * @param accountToken - The Twilio account token
	 */
	public constructor(protected readonly accountSid: string, protected readonly accountToken: string) {
		this.client = twilio(accountSid, accountToken, { logLevel: 'debug' });
	}

	/**
	 * Fetches available phone numbers for purchase
	 * @param limit - The amount of numbers to fetch
	 * @param areaCode - The area code the numbers should be within
	 */
	public fetchAvailableNumbers(limit: number, areaCode = 303) {
		return this.client.availablePhoneNumbers('US').local.list({
			areaCode,
			limit,
			smsEnabled: true,
		});
	}

	/**
	 * Creates a new messaging instance
	 * @param friendlyName - The name of this messaging instance
	 */
	public createMessagingInstance(friendlyName: string) {
		return this.client.messaging.services.create({
			friendlyName,
		});
	}

	/**
	 * Fetches all messaging instances
	 */
	public fetchMessagingInstances() {
		return this.client.messaging.services.list();
	}

	/**
	 * Fetches all purchased phone numbers
	 */
	public fetchIncomingNumbers() {
		return this.client.incomingPhoneNumbers.list();
	}

	/**
	 * Purchases a new Twilio number
	 * @param options - The options for purchasing a new number
	 */
	public buyNumber(options: IncomingPhoneNumberListInstanceCreateOptions) {
		return this.client.incomingPhoneNumbers.create(options);
	}

	public fetchNotifyInstances() {
		return this.client.notify.services.list();
	}

	public createNotifyInstance(options: NotifyServiceCreateOptions) {
		return this.client.notify.services.create(options);
	}

	public createVerifyInstance(options: VerifyServiceCreateOptions) {
		return this.client.verify.services.create(options);
	}
}

// void (async () => {
// 	const helper = new SetupHelper(SID, TOKEN);
// 	const messagingInstance = await helper.createMessagingInstance('Plugged SMS (Test)');
// 	console.log(`Created a Messaging Service: ${messagingInstance.friendlyName} (${messagingInstance.sid})`);
// 	const notifyInstance = await helper.createNotifyInstance({
// 		friendlyName: 'Plugged SMS (Test)',
// 		messagingServiceSid: messagingInstance.sid,
// 	});
// 	console.log(`Created a Notify Service: ${notifyInstance.friendlyName} (${notifyInstance.sid})`);

// 	try {
// 		const verifyInstance = await helper.createVerifyInstance({
// 			friendlyName: 'Plugged SMS (Test)',
// 			lookupEnabled: false,
// 			psd2Enabled: false,
// 			codeLength: 6,
// 			doNotShareWarningEnabled: true,
// 		});
// 		console.log(`Created a Verify Service: ${verifyInstance.friendlyName} (${verifyInstance.sid})`);
// 	} catch (err: unknown) {
// 		const { status, code, message, moreInfo, details } = err as RestException;
// 		console.log({ status, code, message, moreInfo, details });
// 		process.exit();
// 	}

// 	const numbers = await helper.fetchAvailableNumbers(1, 323);
// 	for (const number of numbers) {
// 		const purchase = await helper.buyNumber({
// 			phoneNumber: number.phoneNumber,
// 			smsApplicationSid: messagingInstance.sid,
// 			voiceUrl: '',
// 			voiceFallbackUrl: '',
// 		});
// 		console.log(purchase);
// 		console.log(`Purchased the phone number: ${purchase.friendlyName} (${purchase.sid})`);
// 	}
// })();

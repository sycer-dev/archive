import type {
	RESTGetAPICurrentUserGuildsResult,
	RESTGetAPIUserResult,
	RESTPostOAuth2AccessTokenResult,
} from 'discord-api-types';
import fetch from 'node-fetch';
import type { IncomingPhoneNumberInstance } from 'twilio/lib/rest/api/v2010/account/incomingPhoneNumber';

export async function fetchUser(token: RESTPostOAuth2AccessTokenResult): Promise<RESTGetAPIUserResult> {
	const res = await fetch('https://discord.com/api/users/@me', {
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token.token_type} ${token.access_token}`,
		},
	});

	return res.json();
}

export async function fetchUserGuilds(
	token: RESTPostOAuth2AccessTokenResult,
): Promise<RESTGetAPICurrentUserGuildsResult> {
	const res = await fetch('https://discord.com/api/users/@me/guilds ', {
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token.token_type} ${token.access_token}`,
		},
	});

	return res.json();
}

export function generateContactFile(numbers: IncomingPhoneNumberInstance[], name: string, icon: string): string {
	const data: string[] = [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`FN:${name}`,
		`N:;${name};;;`,
		`EMAIL;TYPE=INTERNET;TYPE=WORK:admin@sycer.dev`,
	];
	for (const [i, { phoneNumber }] of numbers.entries()) {
		data.push(`item${i + 1}.TEL:1 ${phoneNumber.replace(/\+\d/, '')}`);
		data.push(`item${i + 1}.X-ABLabel:`);
	}
	data.push(`PHOTO: ${icon}`);
	data.push('END:VCARD');

	return data.join('\n');
}

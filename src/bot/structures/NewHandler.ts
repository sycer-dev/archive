import SuccessClient from '../client';
import OAuth, { RequestOpts, Token } from 'node-oauth-1.0a-ts';
import { randomBytes } from 'crypto';
import { Collection } from 'discord.js';
import fetch from 'node-fetch';
import querystring from 'querystring';

export interface SessionData {
	token: string;
	secret: string;
}

interface RequestTokenResponse {
	oauth_token: string;
	oauth_token_secret: string;
}

interface RequestAccessTokenResponse {
	oauth_token: string;
	oauth_token_secret: string;
	user_id: string;
	screen_name: string;
}

export default class NewHandler {
	public method: OAuth = new OAuth({
		consumer: {
			public: this.client.config.twitConfig.consumer_key,
			secret: this.client.config.twitConfig.consumer_secret,
		},
		signature_method: 'HMAC-SHA1',
	});

	public token: Token = {
		public: this.client.config.twitConfig.access_token,
		secret: this.client.config.twitConfig.access_token_secret,
	};

	public readonly sessions: Collection<string, SessionData> = new Collection();

	public constructor(protected readonly client: SuccessClient) {}

	public authorizeHeader(request: RequestOpts): string {
		return this.method.getHeader(request, this.token);
	}

	public async fetchRequestToken(sessionId: string): Promise<RequestTokenResponse> {
		const url = 'https://api.twitter.com/oauth/request_token';

		const callback = `https://external.sycer.dev/success/new/callback?session=${sessionId}`;
		const header = this.authorizeHeader({ method: 'POST', url });

		const response = await fetch(url, {
			method: 'POST',
			headers: { Authorization: `${header}, oauth_callback=${callback}` },
		});
		const text = await response.text();
		const parsedResponse = (querystring.parse(text) as unknown) as RequestTokenResponse;
		if (!parsedResponse.oauth_token || !parsedResponse.oauth_token_secret) {
			return { oauth_token: '', oauth_token_secret: '' };
		}
		return parsedResponse;
	}

	public async fetchAccessToken(token: string, verifier: string): Promise<RequestAccessTokenResponse | string> {
		const query = this.method.buildQueryString({
			oauth_token: token,
			oauth_verifier: verifier,
		});
		const url = `https://api.twitter.com/oauth/access_token?${query}`;
		this.client.logger.debug(`[FETCH ACCESS TOKEN]: Requesting ${url}`);

		const response = await fetch(url, {
			method: 'POST',
		});
		const text = await response.text();
		const parsedResponse = (querystring.parse(text) as unknown) as RequestAccessTokenResponse;
		if (!parsedResponse.user_id) return text;

		return parsedResponse;
	}

	public generateSession(): string {
		return randomBytes(32).toString('hex');
	}
}

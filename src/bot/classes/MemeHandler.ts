import fetch from 'node-fetch';
import { MEME_ENDPOINT } from '../util/Constants';

interface QueryOptions {
	text?: string;
	avatar1?: string;
	avatar2?: string;
	username1?: string;
	username2?: string;
}

export default class MemeHandler {
	private readonly key: string;

	public constructor(key: string) {
		this.key = key;
	}

	public async makeMeme(endpoint: string, params: QueryOptions): Promise<NodeJS.ReadableStream> {
		const esc = encodeURIComponent;
		const query = Object.keys(params)
			// @ts-ignore
			.map(k => `${esc(k)}=${esc(params[k])}`)
			.join('&');
		const get = await fetch(`${MEME_ENDPOINT}${endpoint}?${query}`, {
			headers: [['Authorization', this.key]],
		});
		return get.body;
	}
}

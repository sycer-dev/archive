import fetch from 'node-fetch';
import { Message } from 'discord.js';

export async function postHaste(code: string, lang?: string): Promise<string> {
	try {
		if (code.length > 400000) {
			return 'Document exceeds maximum length.';
		}
		const res = await fetch('https://paste.nomsy.net/documents', {
			method: 'POST',
			body: code,
		});
		const { key, message } = await res.json();
		if (!key) {
			return message;
		}
		return `https://paste.nomsy.net/${key}${lang && `.${lang}`}`;
	} catch (err) {
		throw err;
	}
}

export function messageHasImages(message: Message): boolean {
	if (!message.attachments.size) return false;
	return message.attachments.some((m) => Boolean(m.height) && Boolean(m.width));
}

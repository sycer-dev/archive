import fetch from 'node-fetch';

export async function postHaste(code: string, lang?: string): Promise<string> {
	try {
		if (code.length > 400 * 1000) {
			return 'Document exceeds maximum length.';
		}
		const res = await fetch('https://paste.nomsy.net/documents', { method: 'POST', body: code });
		const { key, message } = await res.json();
		if (!key) {
			return message;
		}
		return `https://paste.nomsy.net/${key}${lang && `.${lang}`}`;
	} catch (err) {
		throw err;
	}
}

export function codeb(data: any, lang = '') {
	const bt = '`';
	// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
	return lang ? `${bt.repeat(3)}${lang}\n${data}${bt.repeat(3)}` : `${bt}${data}${bt}`;
}

export function pluralize(input: ArrayLike<any> | number, suffix = 's'): string {
	const val = typeof input === 'number' ? input : input.length;
	if (val === 1) return '';
	return suffix;
}

export function ordinal(n: number): string {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function localize(number: number, locale = 'en-US'): string {
	try {
		return new Intl.NumberFormat(locale).format(number);
	} catch {}
	return new Intl.NumberFormat('en-US').format(number);
}

export function list(arr: any[], conj = 'and'): string {
	const len = arr.length;
	return `${arr.slice(0, -1).join(', ')}${len > 1 ? `${len > 2 ? ',' : ''} ${conj} ` : ''}${arr.slice(-1)}`;
}

export function shorten(text: string, maxLen = 2000): string {
	return text.length > maxLen ? `${text.substr(0, maxLen - 3)}...` : text;
}

export function randomRange(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function trimArray(arr: any[], maxLen = 10): any[] {
	if (arr.length > maxLen) {
		const len = arr.length - maxLen;
		arr = arr.slice(0, maxLen);
		arr.push(`${len} more...`);
	}
	return arr;
}

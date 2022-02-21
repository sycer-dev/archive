export function delay(ms: number): Promise<any> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function shuffle(array: any[]): any[] {
	const arr = array.slice(0);
	for (let i = arr.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = arr[i];
		arr[i] = arr[j];
		arr[j] = temp;
	}
	return arr;
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

export function firstUpperCase(text: string, split = ' '): string {
	return text
		.split(split)
		.map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
		.join(' ');
}

export function formatNumber(num: any): string {
	return Number.parseFloat(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

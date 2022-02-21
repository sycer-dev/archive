/* eslint-disable no-eq-null */
interface CounterResponse {
	encoding: string;
	length: number;
	per_message: number;
	messages: number;
	remaining: number;
}

export class SMSCounter {
	protected readonly GSM_7BIT_CHARS =
		'@£$¥èéùìòÇ\\nØø\\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\\"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

	protected readonly GSM_7BOT_EXCHAR = '\\^{}\\\\\\[~\\]|€';
	protected readonly GSM_7BIT_REGEX = new RegExp(`^[${this.GSM_7BIT_CHARS}]*$`);
	protected readonly GSM_7BOT_EXCHAR_REGEX = new RegExp(`^[${this.GSM_7BIT_CHARS}${this.GSM_7BOT_EXCHAR}]*$`);
	protected readonly GSM_7BOT_EXCHAR_ONLY_REGEX = new RegExp(`^[${this.GSM_7BOT_EXCHAR}]*$`);
	protected readonly GSM_7BIT = 'GSM_7BIT';
	protected readonly GSM_7BIT_EX = 'GSM_7BIT_EX';
	protected readonly UTF16 = 'UTF16';
	protected readonly messageLength = {
		GSM_7BIT: 160,
		GSM_7BIT_EX: 160,
		UTF16: 70,
	};

	protected readonly multiMessageLength = {
		GSM_7BIT: 153,
		GSM_7BIT_EX: 153,
		UTF16: 67,
	};

	private detectEncoding(text: string) {
		switch (false) {
			case text.match(this.GSM_7BIT_REGEX) == null:
				return this.GSM_7BIT;
			case text.match(this.GSM_7BOT_EXCHAR) == null:
				return this.GSM_7BIT_EX;
			default:
				return this.UTF16;
		}
	}

	private countGsm7bitEx(text: string): number {
		const chars = () => {
			const _results: string[] = [];
			for (let _i = 0, _len = text.length; _i < _len; _i++) {
				const char2 = text[_i];

				if (char2.match(this.GSM_7BOT_EXCHAR_ONLY_REGEX) != null) {
					_results.push(char2);
				}
			}
			return _results;
		};

		return chars.length;
	}

	public count(text: string): CounterResponse {
		const encoding = this.detectEncoding(text);

		let length = text.length;
		if (encoding === this.GSM_7BIT_EX) length += this.countGsm7bitEx(text);

		let per_message = this.messageLength[encoding];
		if (length > per_message) per_message = this.multiMessageLength[encoding];

		const messages = Math.ceil(length / per_message);

		let remaining = per_message * messages - length;
		if (!remaining && !messages) remaining = per_message;

		return {
			encoding,
			length,
			per_message,
			remaining,
			messages,
		};
	}
}

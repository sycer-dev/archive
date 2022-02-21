import { createLogger, transports, format, addColors } from 'winston';

export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

declare module 'winston' {
	interface Logger {
		mongo: LeveledLogMethod;
		akairo: LeveledLogMethod;
		stripe: LeveledLogMethod;
		twilio: LeveledLogMethod;
	}
}

export const SENSITIVE_PATTERN_REPLACEMENT = '[REDACTED]';

export const MESSAGES = {
	NOT_ACTIVATED: "this server hasn't been activated yet!",
	COMMANDS: {
		EVAL: {
			LONG_OUTPUT: (link: string): string => `Output too long, uploading it to hastebin instead: ${link}.`,
			INPUT: (code: string): string => `Input:\`\`\`js\n${code}\n\`\`\``,
			OUTPUT: (code: string): string => `Output:\`\`\`js\n${code}\n\`\`\``,
			TYPE: ``,
			TIME: ``,
			HASTEBIN: ``,
			ERRORS: {
				TOO_LONG: `Output too long, failed to upload to hastebin as well.`,
				CODE_BLOCK: (err: Error): string => `Error:\`\`\`xl\n${err}\n\`\`\``,
			},
		},
	},
};

interface StringtoString {
	[key: string]: string;
}
interface StringtoNumber {
	[key: string]: number;
}

export const ParamToSku: StringtoString = {
	ten: 'sku_G2aOnSUCFl378W',
	twentyfive: 'sku_G2aPGXwc3DUhVF',
	fifty: 'sku_G2aPJHCLHKCTaK',
	activate: 'sku_G3qQPCxah1kdSf',
};

export const ParamtoCents: StringtoNumber = {
	ten: 1000,
	twentyfive: 2500,
	fifty: 5000,
	activate: 3500,
};

const loggerLevels = {
	levels: {
		error: 0,
		debug: 1,
		warn: 2,
		data: 3,
		info: 4,
		verbose: 5,
		silly: 6,
		custom: 7,
		mongo: 8,
		akairo: 9,
		stripe: 10,
		twilio: 11,
	},
	colors: {
		error: 'red',
		debug: 'blue',
		warn: 'yellow',
		data: 'grey',
		info: 'green',
		verbose: 'cyan',
		silly: 'magenta',
		custom: 'yellow',
		mongo: 'green whiteBG italic',
		akairo: 'red blackBG',
		stripe: 'magenta blueBG',
		twilio: 'white redBG',
	},
};

addColors(loggerLevels.colors);

export const logger = createLogger({
	levels: loggerLevels.levels,
	format: format.combine(
		format.colorize({ level: true }),
		format.errors({ stack: true }),
		format.splat(),
		format.timestamp({ format: 'MM/DD/YYYY HH:mm:ss' }),
		format.printf((data: any) => {
			const { timestamp, level, message, ...rest } = data;
			return `[${timestamp}] ${level}: ${message}${
				Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : ''
			}`;
		}),
	),
	transports: new transports.Console(),
	level: 'twilio',
});

export const UNICODE_TO_GSM: Record<number, number[]> = {
	0x000a: [0x0a],
	0x000c: [0x1b, 0x0a],
	0x000d: [0x0d],
	0x0020: [0x20],
	0x0021: [0x21],
	0x0022: [0x22],
	0x0023: [0x23],
	0x0024: [0x02],
	0x0025: [0x25],
	0x0026: [0x26],
	0x0027: [0x27],
	0x0028: [0x28],
	0x0029: [0x29],
	0x002a: [0x2a],
	0x002b: [0x2b],
	0x002c: [0x2c],
	0x002d: [0x2d],
	0x002e: [0x2e],
	0x002f: [0x2f],
	0x0030: [0x30],
	0x0031: [0x31],
	0x0032: [0x32],
	0x0033: [0x33],
	0x0034: [0x34],
	0x0035: [0x35],
	0x0036: [0x36],
	0x0037: [0x37],
	0x0038: [0x38],
	0x0039: [0x39],
	0x003a: [0x3a],
	0x003b: [0x3b],
	0x003c: [0x3c],
	0x003d: [0x3d],
	0x003e: [0x3e],
	0x003f: [0x3f],
	0x0040: [0x00],
	0x0041: [0x41],
	0x0042: [0x42],
	0x0043: [0x43],
	0x0044: [0x44],
	0x0045: [0x45],
	0x0046: [0x46],
	0x0047: [0x47],
	0x0048: [0x48],
	0x0049: [0x49],
	0x004a: [0x4a],
	0x004b: [0x4b],
	0x004c: [0x4c],
	0x004d: [0x4d],
	0x004e: [0x4e],
	0x004f: [0x4f],
	0x0050: [0x50],
	0x0051: [0x51],
	0x0052: [0x52],
	0x0053: [0x53],
	0x0054: [0x54],
	0x0055: [0x55],
	0x0056: [0x56],
	0x0057: [0x57],
	0x0058: [0x58],
	0x0059: [0x59],
	0x005a: [0x5a],
	0x005b: [0x1b, 0x3c],
	0x005c: [0x1b, 0x2f],
	0x005d: [0x1b, 0x3e],
	0x005e: [0x1b, 0x14],
	0x005f: [0x11],
	0x0061: [0x61],
	0x0062: [0x62],
	0x0063: [0x63],
	0x0064: [0x64],
	0x0065: [0x65],
	0x0066: [0x66],
	0x0067: [0x67],
	0x0068: [0x68],
	0x0069: [0x69],
	0x006a: [0x6a],
	0x006b: [0x6b],
	0x006c: [0x6c],
	0x006d: [0x6d],
	0x006e: [0x6e],
	0x006f: [0x6f],
	0x0070: [0x70],
	0x0071: [0x71],
	0x0072: [0x72],
	0x0073: [0x73],
	0x0074: [0x74],
	0x0075: [0x75],
	0x0076: [0x76],
	0x0077: [0x77],
	0x0078: [0x78],
	0x0079: [0x79],
	0x007a: [0x7a],
	0x007b: [0x1b, 0x28],
	0x007c: [0x1b, 0x40],
	0x007d: [0x1b, 0x29],
	0x007e: [0x1b, 0x3d],
	0x00a1: [0x40],
	0x00a3: [0x01],
	0x00a4: [0x24],
	0x00a5: [0x03],
	0x00a7: [0x5f],
	0x00bf: [0x60],
	0x00c4: [0x5b],
	0x00c5: [0x0e],
	0x00c6: [0x1c],
	0x00c9: [0x1f],
	0x00d1: [0x5d],
	0x00d6: [0x5c],
	0x00d8: [0x0b],
	0x00dc: [0x5e],
	0x00df: [0x1e],
	0x00e0: [0x7f],
	0x00e4: [0x7b],
	0x00e5: [0x0f],
	0x00e6: [0x1d],
	0x00c7: [0x09],
	0x00e8: [0x04],
	0x00e9: [0x05],
	0x00ec: [0x07],
	0x00f1: [0x7d],
	0x00f2: [0x08],
	0x00f6: [0x7c],
	0x00f8: [0x0c],
	0x00f9: [0x06],
	0x00fc: [0x7e],
	0x0393: [0x13],
	0x0394: [0x10],
	0x0398: [0x19],
	0x039b: [0x14],
	0x039e: [0x1a],
	0x03a0: [0x16],
	0x03a3: [0x18],
	0x03a6: [0x12],
	0x03a8: [0x17],
	0x03a9: [0x15],
	0x20ac: [0x1b, 0x65],
};

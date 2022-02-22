import { Document, Schema, model } from 'mongoose';
// import { TwitterOptions } from '../../bot/structures/TwitterAPI';

export interface DeprecatedKeysFormat {
	consumer_key: string;
	consumer_secret: string;
	access_token: string;
	access_token_secret: string;
}

export interface Client extends Document {
	id: string;
	token: string;
	used: boolean;
	prefix: string;
	color?: number;
	config: DeprecatedKeysFormat;
	newFormat: boolean;
	mode: number;
	channels: string[];
	blocklist: string[];
	staff?: string[];
	format: string[];
	successLog?: string;
	approvalLog?: string;
	postPanel: 'dm' | 'guild';
	includeContent: boolean;
	member: string;
	allowAnonymous: boolean;
}

const Client: Schema = new Schema(
	{
		id: String,
		token: String,
		used: Boolean,
		prefix: String,
		config: {
			consumer_key: String,
			consumer_secret: String,
			access_token: String,
			access_token_secret: String,
		},
		newFormat: {
			type: Boolean,
			default: false,
		},
		mode: {
			type: Number,
			default: 0,
		},
		channels: {
			type: Array,
			default: [],
		},
		blocklist: {
			type: Array,
			default: [],
		},
		staff: {
			type: Array,
			default: [],
		},
		format: {
			type: Array,
			default: [],
		},
		successLog: String,
		approvalLog: String,
		postPanel: String,
		includeContent: {
			type: Boolean,
			default: false,
		},
		color: Number,
		member: String,
		allowAnonymous: {
			type: Boolean,
			default: false,
		},
	},
	{
		strict: false,
	},
);

export default model<Client>('Client', Client);

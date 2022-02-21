import { Document, Schema, model } from 'mongoose';

export interface Boosted {
	string: string;
	entries: number;
}

export interface Giveaway extends Document {
	clientID: string;
	title: string;
	emoji: string;
	guildID: string;
	channelID: string;
	messageID: string;
	winnerCount: number;
	boosted?: Boosted[];
	endsAt: Date;
	createdBy: string;
	complete: boolean;
}

const Giveaway: Schema = new Schema(
	{
		clientID: String,
		title: {
			type: String,
			required: true,
		},
		emoji: {
			type: String,
			default: '🎉',
		},
		guildID: {
			type: String,
			required: true,
		},
		channelID: {
			type: String,
			required: true,
		},
		messageID: {
			type: String,
			required: true,
		},
		winnerCount: {
			type: Number,
			required: true,
		},
		endsAt: Date,
		createdBy: {
			type: String,
			required: true,
		},
		complete: {
			type: Boolean,
			default: false,
		},
		boosted: Array,
	},
	{
		strict: false,
	},
);

export default model<Giveaway>('Giveaway', Giveaway);

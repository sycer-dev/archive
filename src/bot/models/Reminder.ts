import { Document, Schema, model } from 'mongoose';

export interface Reminder extends Document {
	clientID: string;
	userID: string;
	reason: string;
	triggerAt: Date;
	actionProcessed: boolean;
}

const Reminder: Schema = new Schema(
	{
		clientID: String,
		userID: String,
		reason: String,
		triggerAt: Date,
		actionProcessed: {
			type: Boolean,
			default: false,
		},
	},
	{
		strict: false,
	},
);

export default model<Reminder>('Reminder', Reminder);

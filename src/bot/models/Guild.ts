import { Document, Schema, model } from 'mongoose';

export interface Guild extends Document {
	id: string;
	ownerID: string;
	allowed: boolean;
	prefix: string;
	privateChannel?: string;
	publicChannel?: string;
	cooldown: number;
	max: number;
}

const Guild: Schema = new Schema({
	id: String,
	prefix: String,
	ownerID: String,
	allowed: Boolean,
	privateChannel: String,
	publicChannel: String,
	cooldown: Number,
	max: Number
}, {
	strict: false
});

export default model<Guild>('Guild', Guild);

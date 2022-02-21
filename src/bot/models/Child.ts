import { Document, Schema, model } from 'mongoose';

export interface Child extends Document {
	id: string;
	token: string;
	used: boolean;
	prefix: string;
	color: number;
	archive?: string;
	ring?: string;
}

const Child: Schema = new Schema(
	{
		id: String,
		token: String,
		used: Boolean,
		prefix: String,
		color: Number,
		archive: String,
		ring: String,
	},
	{
		strict: false,
	},
);

export default model<Child>('Child', Child);

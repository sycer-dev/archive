import { Document, Schema, model } from 'mongoose';

export interface Tag extends Document {
	guildID: string;
	user: string;
	name: string;
	content: string;
}

const Tag: Schema = new Schema(
	{
		guildID: String,
		user: String,
		name: String,
		content: String,
	},
	{
		strict: false,
	},
);

export default model<Tag>('Tag', Tag);

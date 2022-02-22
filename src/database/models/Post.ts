import { Document, Schema, model } from 'mongoose';

export interface Post extends Document {
	clientID: string;
	userID: string;
	channelID: string;
	messageID: string;
	panelID: string;
	approvalPanelID?: string;
	sent: boolean;
	approved: boolean | null;
	deleted: boolean;
	tweetID: string;
	createdAt: Date;
}

const Post: Schema = new Schema(
	{
		clientID: String,
		userID: String,
		channelID: String,
		messageID: String,
		panelID: String,
		approvalPanelID: String,
		sent: Boolean,
		approved: Boolean || null,
		deleted: Boolean,
		tweetID: String,
		createdAt: {
			type: Date,
			default: new Date(),
		},
	},
	{
		strict: false,
	},
);

export default model<Post>('Post', Post);

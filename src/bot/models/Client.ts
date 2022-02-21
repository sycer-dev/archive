import { Document, Schema, model } from 'mongoose';

export interface Client extends Document {
	id: string;
	active: boolean;
	token: string;
	guildID?: string;
	color: number;
	footerText: string;
	footerIcon: string;
	emoji: string;
}

const Client: Schema = new Schema({
	id: String,
	active: Boolean,
	token: String,
	guildID: String,
	color: Number,
	footerText: String,
	footerIcon: String,
	emoji: String
}, {
	strict: false
});

export default model<Client>('Client', Client);

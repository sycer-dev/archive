import { randomBytes } from 'crypto';
import { Entity, BaseEntity, Column, PrimaryColumn } from 'typeorm';

export interface TransferOptions {
	key: string;
	expireAt: Date;
	cooldown: Date;
}

export interface TwilioConfiguration {
	sid: string;
	token: string;
	notify: string;
	number: string;
	verify: string;
}

@Entity('guilds')
export class Guild extends BaseEntity {
	@PrimaryColumn('bigint')
	public id!: string;

	@Column('boolean', { default: false })
	public allowed!: boolean;

	@Column('text', { default: process.env.PREFIX })
	public prefix!: string;

	@Column('int', { default: 100 })
	public max!: number;

	@Column('bigint', { name: 'text_master', nullable: true })
	public textMaster?: string;

	@Column('bigint', { name: 'log_id', nullable: true })
	public logID?: string;

	@Column('text', { nullable: true })
	public subscriptionID?: string;

	@Column('text', { nullable: true })
	public customerID?: string;

	@Column('simple-json', { nullable: true })
	public twilio?: TwilioConfiguration;

	@Column('text', { default: randomBytes(32).toString('hex') })
	public apikey: string;
}

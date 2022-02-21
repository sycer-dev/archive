import { Entity, BaseEntity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	public id!: string;

	@Column('boolean', { default: true })
	public active!: boolean;

	@Column('bigint', { name: 'user_id' })
	public userID!: string;

	@Column('bigint', { name: 'guild_id' })
	public guildID!: string;

	@Column('text')
	public number!: string;
}

import { Entity, BaseEntity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('logs')
export class SMS extends BaseEntity {
	@PrimaryGeneratedColumn('increment')
	public id!: string;

	@Column('bigint')
	public executor!: string;

	@Column('int')
	public count!: number;

	@Column('text')
	public body!: string;

	@Column('timestamptz', { name: 'created_at', default: () => 'now()' })
	public createdAt!: Date;
}

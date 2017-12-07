
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { BaseOrmEntity, ShardTable } from '../../lib';

@Entity('shard_table')
@ShardTable(5)
export class ShardEntity extends BaseOrmEntity {
  @PrimaryGeneratedColumn()
  tableId: number;

  @Column()
  tableDesc: string;
}

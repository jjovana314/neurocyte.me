import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Action } from './action.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; 

  @Column()
  actions: Action[];
}
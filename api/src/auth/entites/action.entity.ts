import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  roleName: string;
}

import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, OneToOne } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './role.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  password: string;

 @OneToOne(type => Role, role => role.id)
  role: Role;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

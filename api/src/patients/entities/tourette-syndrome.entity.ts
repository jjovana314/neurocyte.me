import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { TycType } from '../enums/touretteTycType';
import { TouretteTrigger } from '../enums/touretteTrigger';

@Entity()
export class TouretteSyndrome {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient, (patient) => patient.touretteSyndrom, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'enum', enum: TycType })
  tycType: TycType;

  @CreateDateColumn()
  recordedAt: Date;

  @Column()
  severityScale: number;

  @Column({ type: 'set', enum: TouretteTrigger, nullable: true })
  triggers: TouretteTrigger[];

  @Column()
  premonitoryUrgeLevel: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  medicationTaken: string;
}

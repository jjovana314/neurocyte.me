import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity()
export class PatientHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient, (patient) => patient.medicalHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  disorder: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  diagnosisDate: string;

  @Column({ type: 'varchar', nullable: true })
  severity: string; // mild, moderate, severe

  @Column({ nullable: true })
  medications: string;

  @CreateDateColumn()
  recordedAt: Date;
}

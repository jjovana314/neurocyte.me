import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity()
export class FamilyHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient, (patient) => patient.familyHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  diseaseType: string; // e.g., Alzheimer's, Parkinson's, etc.

  @Column()
  relation: string; // e.g., Mother, Father, Sibling, Grandparent, etc.

  @Column({ type: 'varchar', nullable: true })
  severity: string; // mild, moderate, severe

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  recordedAt: Date;
}

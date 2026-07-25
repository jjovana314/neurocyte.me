import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Check,
} from 'typeorm';
import { Patient } from './patient.entity';

// Column identifiers use backticks (MySQL identifier quoting) - double quotes
// would be parsed as a string literal here and silently no-op the check.
@Entity()
@Check('`painSeverity` >= 1 AND `painSeverity` <= 10')
export class MigraineLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient, (patient) => patient.migraineLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  // When the migraine episode itself occurred, as reported by the patient -
  // distinct from recordedAt, which is when the doctor logged it.
  @Column()
  occurredAt: Date;

  @Column({ nullable: true })
  durationMinutes: number;

  @Column()
  painSeverity: number;

  @Column({ default: false })
  auraPresent: boolean;

  @Column({ type: 'text', nullable: true })
  triggers: string;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ nullable: true })
  medicationTaken: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  recordedAt: Date;
}

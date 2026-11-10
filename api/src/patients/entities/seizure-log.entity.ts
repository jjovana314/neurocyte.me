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
import {
  OnsetVector,
  MotorFeature,
  SeizureTrigger,
} from '../enums/seizureEnums';

// Column identifiers use backticks (MySQL identifier quoting) - double quotes
// would be parsed as a string literal here and silently no-op the check.
@Entity()
@Check('`ictusEnd` >= `ictusStart`')
export class SeizureLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient, (patient) => patient.seizureLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'enum', enum: OnsetVector })
  onsetVector: OnsetVector;

  @Column({ type: 'set', enum: MotorFeature, nullable: true })
  motorFeatures: MotorFeature[];

  // Start of clinical manifestation (ictus), as reported by the witness -
  // distinct from recordedAt, which is when the doctor logged it.
  @Column()
  ictusStart: Date;

  @Column()
  ictusEnd: Date;

  // Active seizure duration, derived server-side from ictusEnd - ictusStart;
  // never supplied by the client.
  @Column()
  ictusDurationSeconds: number;

  // Recovery time - correlates with post-seizure brain swelling/exhaustion.
  @Column({ nullable: true })
  postictalDurationMinutes: number;

  @Column({ type: 'set', enum: SeizureTrigger, nullable: true })
  triggers: SeizureTrigger[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  recordedAt: Date;
}

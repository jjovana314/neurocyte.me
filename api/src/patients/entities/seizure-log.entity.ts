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

export enum OnsetVector {
  FOCAL_AWARE = 'FOCAL_AWARE',
  FOCAL_IMPAIRED_AWARENESS = 'FOCAL_IMPAIRED_AWARENESS',
  GENERALIZED = 'GENERALIZED',
}

export enum MotorFeature {
  TONIC = 'TONIC',
  CLONIC = 'CLONIC',
  ATONIC = 'ATONIC',
  AUTOMATISMS = 'AUTOMATISMS',
}

export enum SeizureTrigger {
  SLEEP_DEPRIVATION = 'SLEEP_DEPRIVATION',
  MISSED_DOSE = 'MISSED_DOSE',
  HIGH_STRESS = 'HIGH_STRESS',
  ILLNESS = 'ILLNESS',
}

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

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

export enum NcsStudyType {
  MOTOR = 'MOTOR',
  SENSORY = 'SENSORY',
}

// Column identifiers use backticks (MySQL identifier quoting) - double quotes
// would be parsed as a string literal here and silently no-op the check.
@Entity()
@Check('`distanceMm` > 0')
@Check('`distalLatencyMs` > 0 AND `distalAmplitude` >= 0')
export class NcsStudy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient, (patient) => patient.ncsStudies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  nerveName: string;

  @Column({ type: 'enum', enum: NcsStudyType })
  studyType: NcsStudyType;

  // Distance between distal and proximal stimulation points
  @Column({ type: 'double' })
  distanceMm: number;

  @Column({ type: 'double' })
  distalLatencyMs: number;

  // mV for motor (CMAP), uV for sensory (SNAP)
  @Column({ type: 'double' })
  distalAmplitude: number;

  @Column({ type: 'double', nullable: true })
  distalDurationMs: number | null;

  @Column({ type: 'double', nullable: true })
  proximalLatencyMs: number | null;

  @Column({ type: 'double', nullable: true })
  proximalAmplitude: number | null;

  @Column({ type: 'double', nullable: true })
  proximalDurationMs: number | null;

  @Column({ type: 'double', nullable: true })
  skinTemperatureCelsius: number | null;

  // Everything below is computed by the calculator service - never supplied
  // by the client directly.
  @Column({ type: 'double', nullable: true })
  conductionVelocityMPerS: number | null;

  @Column({ type: 'double', nullable: true })
  amplitudeDropPercent: number | null;

  @Column({ type: 'double', nullable: true })
  temporalDispersionPercent: number | null;

  @Column()
  isNormal: boolean;

  @Column()
  axonalLoss: boolean;

  @Column()
  demyelination: boolean;

  @Column()
  conductionBlock: boolean;

  @Column({ type: 'text' })
  diagnosticSummary: string;

  @CreateDateColumn()
  recordedAt: Date;
}

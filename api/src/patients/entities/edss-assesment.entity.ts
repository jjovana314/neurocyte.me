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
@Check('`pyramidalSystem` >= 0 AND `pyramidalSystem` <= 6')
@Check('`cerebellarSystem` >= 0 AND `cerebellarSystem` <= 5')
@Check('`brainstemSystem` >= 0 AND `brainstemSystem` <= 5')
@Check('`sensorySystem` >= 0 AND `sensorySystem` <= 6')
@Check('`bowelBladderSystem` >= 0 AND `bowelBladderSystem` <= 6')
@Check('`visualSystem` >= 0 AND `visualSystem` <= 6')
@Check('`mentalSystem` >= 0 AND `mentalSystem` <= 5')
@Check('`totalScore` >= 0 AND `totalScore` <= 10')
export class EdssAssesment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient, (patient) => patient.edssAssessments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @CreateDateColumn()
  assessedAt: Date;

  // Functional System Scores (FSS)
  @Column()
  pyramidalSystem: number;

  @Column()
  cerebellarSystem: number;

  @Column()
  brainstemSystem: number;

  @Column()
  sensorySystem: number;

  @Column()
  bowelBladderSystem: number;

  @Column()
  visualSystem: number;

  @Column()
  mentalSystem: number;

  // Ambulation metrics - primary driver for scores >= 4.0
  @Column({ nullable: true })
  unassistedWalkingDistanceMeters: number;

  @Column({ default: false })
  requiresUnilateralAid: boolean;

  @Column({ default: false })
  requiresBilateralAid: boolean;

  @Column({ default: false })
  wheelchairBound: boolean;

  // Composite score derived by EdssCalculator - never accepted directly from
  // clients. MySQL returns DECIMAL columns as strings via mysql2, so this
  // transformer keeps the JS/JSON-facing type a real number.
  @Column({
    type: 'decimal',
    precision: 3,
    scale: 1,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalScore: number;
}

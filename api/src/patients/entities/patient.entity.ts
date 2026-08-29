import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { PatientHistory } from './patient-history.entity';
import { FamilyHistory } from './family-history.entity';
import { EdssAssesment } from './edss-assesment.entity';
import { MigraineLog } from './migraine-log.entity';
import { SeizureLog } from './seizure-log.entity';
import { NcsStudy } from './ncs-study.entity';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => PatientHistory, (history) => history.patient)
  medicalHistory: PatientHistory[];

  @OneToMany(() => FamilyHistory, (family) => family.patient)
  familyHistory: FamilyHistory[];

  @OneToMany(() => EdssAssesment, (assessment) => assessment.patient)
  edssAssessments: EdssAssesment[];

  @OneToMany(() => MigraineLog, (migraineLog) => migraineLog.patient)
  migraineLogs: MigraineLog[];

  @OneToMany(() => SeizureLog, (seizureLog) => seizureLog.patient)
  seizureLogs: SeizureLog[];

  @OneToMany(() => NcsStudy, (ncsStudy) => ncsStudy.patient)
  ncsStudies: NcsStudy[];
}

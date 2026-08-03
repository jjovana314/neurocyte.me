import { NcsStudyType } from '../entities/ncs-study.entity';

export class NcsSegmentMeasurementDto {
  latencyMs: number;
  amplitude: number; // mV for Motor (CMAP), uV for Sensory (SNAP)
  durationMs?: number;
}

export class CreateNcsStudyDto {
  patientId: number;
  nerveName: string; // e.g. "Median", "Ulnar", "Peroneal", "Sural"
  studyType: NcsStudyType;
  distanceMm: number;
  distalSite: NcsSegmentMeasurementDto;
  proximalSite?: NcsSegmentMeasurementDto;
  skinTemperatureCelsius?: number;
}

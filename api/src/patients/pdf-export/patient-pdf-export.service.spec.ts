import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import PDFDocument from 'pdfkit';
import { PatientPdfExportService } from './patient-pdf-export.service';
import { Patient } from '../entities/patient.entity';
import { PatientHistory } from '../entities/patient-history.entity';
import { FamilyHistory } from '../entities/family-history.entity';
import { SeizureLog } from '../entities/seizure-log.entity';
import { TouretteSyndrome } from '../entities/tourette-syndrome.entity';
import { User } from 'src/user/entities/user.entity';
import { RoleEnum } from 'src/auth/enums/role.enum';

describe('PatientPdfExportService', () => {
  let service: PatientPdfExportService;

  const mockPatientRepository = { findOne: jest.fn() };
  const mockPatientHistoryRepository = { find: jest.fn() };
  const mockFamilyHistoryRepository = { find: jest.fn() };
  const mockSeizureLogRepository = { find: jest.fn() };
  const mockTouretteSyndromeRepository = { find: jest.fn() };
  const mockUserRepository = { findOne: jest.fn() };
  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientPdfExportService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
        {
          provide: getRepositoryToken(PatientHistory),
          useValue: mockPatientHistoryRepository,
        },
        {
          provide: getRepositoryToken(FamilyHistory),
          useValue: mockFamilyHistoryRepository,
        },
        {
          provide: getRepositoryToken(SeizureLog),
          useValue: mockSeizureLogRepository,
        },
        {
          provide: getRepositoryToken(TouretteSyndrome),
          useValue: mockTouretteSyndromeRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PatientPdfExportService>(PatientPdfExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportPatientPdf', () => {
    const doctorId = 1;
    const patientId = 10;

    const mockDoctor = {
      id: doctorId,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@hospital.com',
      role: { name: RoleEnum.DOCTOR },
    } as any;

    const mockMedicalHistory = [
      {
        id: 1,
        disorder: 'Epilepsy',
        description: 'Focal seizures',
        diagnosisDate: '2024-03-15',
        severity: 'moderate',
        medications: 'Levetiracetam',
        recordedAt: new Date('2024-03-15T08:00:00Z'),
      },
    ] as any[];

    const mockFamilyHistory = [
      {
        id: 1,
        diseaseType: 'Alzheimer',
        relation: 'Mother',
        severity: 'severe',
        notes: 'Diagnosed at 70',
        recordedAt: new Date('2024-03-15T08:00:00Z'),
      },
    ] as any[];

    const mockSeizureLogs = [
      {
        id: 1,
        onsetVector: 'Focal Aware',
        motorFeatures: ['TONIC', 'CLONIC'],
        ictusStart: new Date('2025-05-01T10:00:00Z'),
        ictusEnd: new Date('2025-05-01T10:02:00Z'),
        ictusDurationSeconds: 120,
        postictalDurationMinutes: 15,
        triggers: ['Sleep deprivation'],
        notes: 'Witnessed by spouse',
        recordedAt: new Date('2025-05-01T12:00:00Z'),
      },
    ] as any[];

    const mockTouretteSyndrome = [
      {
        id: 1,
        recordedAt: new Date('2026-10-10T12:00:00Z'),
        tycType: 'Motor Vocal',
        severityScale: 10,
        triggers: ['Excitement'],
        premonitoryUrgeLevel: 5,
        notes: 'Test Notes',
        medicationTaken: 'Aspirin, Caffetine',
      },
    ];

    beforeEach(() => {
      mockPatientHistoryRepository.find.mockResolvedValue(mockMedicalHistory);
      mockFamilyHistoryRepository.find.mockResolvedValue(mockFamilyHistory);
      mockSeizureLogRepository.find.mockResolvedValue(mockSeizureLogs);
      mockTouretteSyndromeRepository.find.mockResolvedValue(
        mockTouretteSyndrome,
      );
    });

    const mockPatient = {
      id: patientId,
      doctorId,
      name: 'John Doe',
      notes: 'Patient notes',
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-06-01T10:00:00Z'),
    } as any;

    it('should return a Buffer containing a PDF', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      expect(result).toBeInstanceOf(Buffer);
      // PDF files start with the %PDF magic bytes
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    // The page-tree object (/Type /Pages ... /Count N) isn't compressed, so the
    // page count can be read straight from the raw PDF bytes.
    const pageCount = (pdf: Buffer): number =>
      Number(
        /\/Type \/Pages[\s\S]*?\/Count (\d+)/.exec(pdf.toString('latin1'))![1],
      );

    it('should not push the footer onto an extra blank page', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      // History, family history, seizure logs and the Tourette record span 2 pages.
      expect(pageCount(result)).toBe(2);
    });

    it('should keep the page count driven by content for multi-page reports', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockSeizureLogRepository.find.mockResolvedValue(
        Array.from({ length: 12 }, (_, i) => ({
          ...mockSeizureLogs[0],
          id: i,
        })),
      );

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      // Without the footer the content alone spans 4 pages.
      expect(pageCount(result)).toBe(4);
    });

    describe('footer placement', () => {
      const FOOTER_TEXT =
        'Confidential – For authorized medical personnel only';

      type FooterCall = { page: any; x: number; y: number };

      // Spy on pdfkit (calling through) to record which page each footer is
      // drawn on and where, plus the final list of buffered pages.
      const captureFooters = () => {
        const footers: FooterCall[] = [];
        const result: { pages: any[]; contentPageCount?: number } = {
          pages: [],
        };

        const proto = PDFDocument.prototype as any;
        const originalText = proto.text;
        const originalEnd = proto.end;

        const textSpy = jest.spyOn(proto, 'text').mockImplementation(function (
          this: any,
          ...args: any[]
        ) {
          const [str, x, y] = args;
          if (str === FOOTER_TEXT) {
            // Pages that existed before the first footer = content pages.
            result.contentPageCount ??= this.bufferedPageRange().count;
            footers.push({ page: this.page, x, y });
          }
          return originalText.apply(this, args);
        });

        const endSpy = jest.spyOn(proto, 'end').mockImplementation(function (
          this: any,
        ) {
          result.pages = [...this._pageBuffer];
          return originalEnd.apply(this);
        });

        return {
          footers,
          result,
          restore: () => {
            textSpy.mockRestore();
            endSpy.mockRestore();
          },
        };
      };

      let capture: ReturnType<typeof captureFooters>;

      beforeEach(() => {
        mockUserRepository.findOne.mockResolvedValue(mockDoctor);
        mockPatientRepository.findOne.mockResolvedValue(mockPatient);
        capture = captureFooters();
      });

      afterEach(() => capture.restore());

      const expectFooterAtBottomOfEveryPage = () => {
        const { footers, result } = capture;

        expect(footers).toHaveLength(result.pages.length);
        footers.forEach((footer, i) => {
          // Drawn on the i-th page, not on a page added after the content.
          expect(footer.page).toBe(result.pages[i]);
          expect(footer.x).toBe(50);
          expect(footer.y).toBe(footer.page.height - 40);
          // Below the regular content area (inside the bottom margin).
          expect(footer.y).toBeGreaterThan(footer.page.height - 50);
        });
      };

      it('should draw the footer at the bottom of the second page for a 2-page report', async () => {
        const pdf = await service.exportPatientPdf(
          doctorId,
          patientId,
          RoleEnum.DOCTOR,
        );

        expect(pageCount(pdf)).toBe(2);
        expect(capture.result.pages).toHaveLength(2);
        expectFooterAtBottomOfEveryPage();
        expect(capture.footers[1].page).toBe(capture.result.pages[1]);
      });

      it('should draw the footer at the bottom of every page for a multi-page report', async () => {
        mockSeizureLogRepository.find.mockResolvedValue(
          Array.from({ length: 12 }, (_, i) => ({
            ...mockSeizureLogs[0],
            id: i,
          })),
        );

        const pdf = await service.exportPatientPdf(
          doctorId,
          patientId,
          RoleEnum.DOCTOR,
        );

        expect(pageCount(pdf)).toBe(4);
        expectFooterAtBottomOfEveryPage();
      });

      it('should not add pages when drawing the footer', async () => {
        mockSeizureLogRepository.find.mockResolvedValue(
          Array.from({ length: 12 }, (_, i) => ({
            ...mockSeizureLogs[0],
            id: i,
          })),
        );

        const pdf = await service.exportPatientPdf(
          doctorId,
          patientId,
          RoleEnum.DOCTOR,
        );

        expect(pageCount(pdf)).toBe(capture.result.contentPageCount);
        expect(capture.result.pages).toHaveLength(
          capture.result.contentPageCount!,
        );
      });
    });

    describe('content flow', () => {
      const SECTION_HEADINGS = [
        'Patient Information',
        'Medical History',
        'Family History',
        'Seizure Logs',
        'Tourette syndrome',
      ];

      type TextCall = { text: string; page: any };

      // Records every content line in drawing order with the page it is on.
      const captureTextCalls = async (): Promise<TextCall[]> => {
        const calls: TextCall[] = [];
        const proto = PDFDocument.prototype as any;
        const originalText = proto.text;
        const spy = jest.spyOn(proto, 'text').mockImplementation(function (
          this: any,
          ...args: any[]
        ) {
          const result = originalText.apply(this, args);
          // pdfkit may add a page while laying out text, so read it afterwards.
          if (typeof args[0] === 'string') {
            calls.push({ text: args[0], page: this.page });
          }
          return result;
        });
        try {
          await service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR);
        } finally {
          spy.mockRestore();
        }
        return calls.filter(
          (c) =>
            c.text !== 'Confidential – For authorized medical personnel only',
        );
      };

      beforeEach(() => {
        mockUserRepository.findOne.mockResolvedValue(mockDoctor);
        mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      });

      it.each([1, 3, 7, 12])(
        'should never split a record or leave a heading alone at a page end (%i records per section)',
        async (count) => {
          const many = <T>(rows: T[]) =>
            Array.from({ length: count }, (_, i) => ({ ...rows[0], id: i }));
          mockPatientHistoryRepository.find.mockResolvedValue(
            many(mockMedicalHistory),
          );
          mockFamilyHistoryRepository.find.mockResolvedValue(
            many(mockFamilyHistory),
          );
          mockSeizureLogRepository.find.mockResolvedValue(
            many(mockSeizureLogs),
          );
          mockTouretteSyndromeRepository.find.mockResolvedValue(
            many(mockTouretteSyndrome),
          );

          const calls = await captureTextCalls();

          calls.forEach((call, i) => {
            const next = calls[i + 1];
            if (!next) return;
            // A record's fields stay on the same page as its title.
            if (next.text.startsWith('   ')) {
              expect(next.page).toBe(call.page);
            }
            // A heading or record title is followed on the same page.
            if (
              SECTION_HEADINGS.includes(call.text) ||
              /^\d+\. /.test(call.text)
            ) {
              expect(next.page).toBe(call.page);
            }
          });
        },
      );

      it('should write sections in order with sequential record numbers', async () => {
        const calls = await captureTextCalls();
        const texts = calls.map((c) => c.text);

        const positions = SECTION_HEADINGS.map((h) => texts.indexOf(h));
        expect(positions.every((p) => p >= 0)).toBe(true);
        expect([...positions].sort((a, b) => a - b)).toEqual(positions);

        positions.forEach((start, i) => {
          const end = positions[i + 1] ?? texts.length;
          const numbers = texts
            .slice(start, end)
            .map((t) => /^(\d+)\. /.exec(t)?.[1])
            .filter(Boolean)
            .map(Number);
          expect(numbers).toEqual(numbers.map((_, n) => n + 1));
        });
      });
    });

    it('should fetch history and seizure logs from their repositories', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      expect(result.slice(0, 4).toString()).toBe('%PDF');
      expect(mockPatientHistoryRepository.find).toHaveBeenCalledWith({
        where: { patientId },
        order: { recordedAt: 'DESC' },
      });
      expect(mockFamilyHistoryRepository.find).toHaveBeenCalledWith({
        where: { patientId },
        order: { recordedAt: 'DESC' },
      });
      expect(mockSeizureLogRepository.find).toHaveBeenCalledWith({
        where: { patientId },
        order: { ictusStart: 'DESC' },
      });
    });

    it('should allow a Support Engineer to export a patient they do not own', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
        doctorId: 999,
      });

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.SUPPORT_ENGINEER,
      );

      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should throw NotFoundException when doctor does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
        doctorId: 999,
      });

      await expect(
        service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle patient with no medical or family history', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
      });
      mockPatientHistoryRepository.find.mockResolvedValue([]);
      mockFamilyHistoryRepository.find.mockResolvedValue([]);
      mockSeizureLogRepository.find.mockResolvedValue([]);

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should handle patient with null name and notes gracefully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
        name: null,
        notes: null,
      });
      mockPatientHistoryRepository.find.mockResolvedValue([]);
      mockFamilyHistoryRepository.find.mockResolvedValue([]);
      mockSeizureLogRepository.find.mockResolvedValue([]);

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});

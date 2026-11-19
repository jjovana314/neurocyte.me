import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import PDFDocument from 'pdfkit';
import { PatientPdfExportService } from './patient-pdf-export.service';
import { RoleEnum } from 'src/auth/enums/role.enum';
import { PatientsService } from '../patients.service';
import { PatientRecords } from '../interfaces/medical-records.interface';

describe('PatientPdfExportService', () => {
  let service: PatientPdfExportService;

  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const mockPatientsService = {
    findUserById: jest.fn(),
    getPatient: jest.fn(),
    findPatientRecords: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientPdfExportService,
        { provide: PinoLogger, useValue: mockLogger },
        { provide: PatientsService, useValue: mockPatientsService },
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

    const mockPatient = {
      id: patientId,
      doctorId,
      name: 'John Doe',
      notes: 'Patient notes',
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-06-01T10:00:00Z'),
    } as any;

    const mockRecords = (
      overrides: Partial<Record<keyof PatientRecords, unknown[]>> = {},
    ) =>
      mockPatientsService.findPatientRecords.mockResolvedValue({
        medicalHistory: mockMedicalHistory,
        familyHistory: mockFamilyHistory,
        seizureLogs: mockSeizureLogs,
        touretteSyndrome: mockTouretteSyndrome,
        ...overrides,
      });

    beforeEach(() => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockResolvedValue(mockPatient);
      mockRecords();
    });

    it('should return a Buffer containing a PDF', async () => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockResolvedValue(mockPatient);

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
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockResolvedValue(mockPatient);

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      // History, family history, seizure logs and the Tourette record span 2 pages.
      expect(pageCount(result)).toBe(2);
    });

    it('should keep the page count driven by content for multi-page reports', async () => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockResolvedValue(mockPatient);
      mockRecords({
        seizureLogs: Array.from({ length: 12 }, (_, i) => ({
          ...mockSeizureLogs[0],
          id: i,
        })),
      });

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
        mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
        mockPatientsService.getPatient.mockResolvedValue(mockPatient);
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
        mockRecords({
          seizureLogs: Array.from({ length: 12 }, (_, i) => ({
            ...mockSeizureLogs[0],
            id: i,
          })),
        });

        const pdf = await service.exportPatientPdf(
          doctorId,
          patientId,
          RoleEnum.DOCTOR,
        );

        expect(pageCount(pdf)).toBe(4);
        expectFooterAtBottomOfEveryPage();
      });

      it('should not add pages when drawing the footer', async () => {
        mockRecords({
          seizureLogs: Array.from({ length: 12 }, (_, i) => ({
            ...mockSeizureLogs[0],
            id: i,
          })),
        });

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
        mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
        mockPatientsService.getPatient.mockResolvedValue(mockPatient);
      });

      it.each([1, 3, 7, 12])(
        'should never split a record or leave a heading alone at a page end (%i records per section)',
        async (count) => {
          const many = <T>(rows: T[]) =>
            Array.from({ length: count }, (_, i) => ({ ...rows[0], id: i }));
          mockRecords({
            medicalHistory: many(mockMedicalHistory),
            familyHistory: many(mockFamilyHistory),
            seizureLogs: many(mockSeizureLogs),
            touretteSyndrome: many(mockTouretteSyndrome),
          });

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

    describe('report content', () => {
      // Runs an export and returns every string drawn, in order.
      const renderTexts = async (role: string): Promise<string[]> => {
        const texts: string[] = [];
        const proto = PDFDocument.prototype as any;
        const originalText = proto.text;
        const spy = jest.spyOn(proto, 'text').mockImplementation(function (
          this: any,
          ...args: any[]
        ) {
          if (typeof args[0] === 'string') texts.push(args[0]);
          return originalText.apply(this, args);
        });
        try {
          await service.exportPatientPdf(doctorId, patientId, role);
        } finally {
          spy.mockRestore();
        }
        return texts;
      };

      // Info rows are drawn as "Label: " followed by the value.
      const fieldValue = (texts: string[], label: string) => {
        const i = texts.indexOf(`${label}: `);
        if (i < 0) throw new Error(`Field "${label}" was not rendered`);
        return texts[i + 1];
      };

      const patientWithContact = {
        ...mockPatient,
        phone: '+381601234567',
        email: 'john@example.com',
      };

      it('should show patient contact details unmasked to the owning doctor', async () => {
        mockPatientsService.getPatient.mockResolvedValue(patientWithContact);

        const texts = await renderTexts(RoleEnum.DOCTOR);

        expect(fieldValue(texts, 'Patient Name')).toBe('John Doe');
        expect(fieldValue(texts, 'Phone')).toBe('+381601234567');
        expect(fieldValue(texts, 'Email')).toBe('john@example.com');
      });

      it('should mask patient name, phone and email for a Support Engineer', async () => {
        mockPatientsService.getPatient.mockResolvedValue(patientWithContact);

        const texts = await renderTexts(RoleEnum.SUPPORT_ENGINEER);

        expect(fieldValue(texts, 'Patient Name')).toBe('xxxxxx');
        expect(fieldValue(texts, 'Phone')).toBe('xxxxxx');
        expect(fieldValue(texts, 'Email')).toBe('xxxxxx');
        expect(texts).not.toContain('John Doe');
        expect(texts).not.toContain('+381601234567');
        expect(texts).not.toContain('john@example.com');
      });

      it('should not mask the patient ID or doctor details for a Support Engineer', async () => {
        mockPatientsService.getPatient.mockResolvedValue(patientWithContact);

        const texts = await renderTexts(RoleEnum.SUPPORT_ENGINEER);

        expect(fieldValue(texts, 'Patient ID')).toBe(String(patientId));
        expect(fieldValue(texts, 'Attending Doctor')).toBe('Jane Smith');
        expect(fieldValue(texts, 'Doctor Email')).toBe(mockDoctor.email);
      });

      it.each([RoleEnum.DOCTOR, RoleEnum.SUPPORT_ENGINEER])(
        'should show N/A for missing contact details (%s)',
        async (role) => {
          mockPatientsService.getPatient.mockResolvedValue({
            ...mockPatient,
            phone: null,
            email: null,
          });

          const texts = await renderTexts(role);

          expect(fieldValue(texts, 'Phone')).toBe('N/A');
          expect(fieldValue(texts, 'Email')).toBe('N/A');
        },
      );

      it('should show an empty message for every section without records', async () => {
        mockRecords({
          medicalHistory: [],
          familyHistory: [],
          seizureLogs: [],
          touretteSyndrome: [],
        });

        const texts = await renderTexts(RoleEnum.DOCTOR);

        expect(texts).toEqual(
          expect.arrayContaining([
            'No medical history recorded.',
            'No family history recorded.',
            'No seizure logs recorded.',
            'No tourette syndrome recorded.',
          ]),
        );
      });

      it('should number and title the records in each section', async () => {
        const texts = await renderTexts(RoleEnum.DOCTOR);
        const titles = texts.filter((t) => /^\d+\. /.test(t));

        expect(titles).toEqual([
          '1. Epilepsy',
          '1. Alzheimer (Mother)',
          '1. Focal aware',
          '1. Motor vocal',
        ]);
      });
    });

    it('should log the export on success', async () => {
      await service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR);

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Patient ${patientId} PDF exported by doctor ${doctorId}`,
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should not load records when the patient cannot be accessed', async () => {
      mockPatientsService.getPatient.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPatientsService.findPatientRecords).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should log and rethrow when loading records fails', async () => {
      mockPatientsService.findPatientRecords.mockRejectedValue(
        new Error('db down'),
      );

      await expect(
        service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR),
      ).rejects.toThrow('db down');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in exportPatientPdf: db down',
      );
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should fetch the doctor, patient and records from PatientsService', async () => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockResolvedValue(mockPatient);

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      expect(result.slice(0, 4).toString()).toBe('%PDF');
      expect(mockPatientsService.findUserById).toHaveBeenCalledWith(doctorId);
      expect(mockPatientsService.getPatient).toHaveBeenCalledWith(
        doctorId,
        patientId,
      );
      expect(mockPatientsService.findPatientRecords).toHaveBeenCalledWith(
        patientId,
      );
    });

    it('should allow a Support Engineer to export a patient they do not own', async () => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockResolvedValue({
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
      mockPatientsService.findUserById.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockRejectedValue(new NotFoundException());

      await expect(
        service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.exportPatientPdf(doctorId, patientId, RoleEnum.DOCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle patient with no medical or family history', async () => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockResolvedValue({ ...mockPatient });
      mockRecords({
        medicalHistory: [],
        familyHistory: [],
        seizureLogs: [],
        touretteSyndrome: [],
      });

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should handle patient with null name and notes gracefully', async () => {
      mockPatientsService.findUserById.mockResolvedValue(mockDoctor);
      mockPatientsService.getPatient.mockResolvedValue({
        ...mockPatient,
        name: null,
        notes: null,
      });
      mockRecords({
        medicalHistory: [],
        familyHistory: [],
        seizureLogs: [],
        touretteSyndrome: [],
      });

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        RoleEnum.DOCTOR,
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});

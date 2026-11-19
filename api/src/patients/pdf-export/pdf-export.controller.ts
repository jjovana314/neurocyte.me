import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtUser } from 'src/auth/classes/jwt-user.class';
import { RolesGuard } from '../decorators/roles.guard';
import { PatientPdfExportService } from './patient-pdf-export.service';

@Controller('pdf')
@UseGuards(AuthGuard('jwt'))
export class PdfExportController {
  constructor(
    private readonly patientPdfExportService: PatientPdfExportService,
  ) {}

  @Get(':patientId/export')
  @UseGuards(RolesGuard)
  async exportPatientPdf(
    @CurrentUser() user: JwtUser,
    @Param('patientId', ParseIntPipe) patientId: number,
  ): Promise<StreamableFile> {
    const buffer = await this.patientPdfExportService.exportPatientPdf(
      user.id,
      patientId,
      user.role.name,
    );
    // Headers are set on the file itself (not via @Header) so that error
    // responses keep their JSON Content-Type.
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: 'attachment; filename="patient-report.pdf"',
    });
  }
}

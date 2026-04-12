export class CsvImportErrorDto {
  row: number;
  reason: string;
}

export class ImportCsvResponseDto {
  imported: number;
  skipped: number;
  errors: CsvImportErrorDto[];
}

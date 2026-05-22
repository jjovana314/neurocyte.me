export declare class CsvImportErrorDto {
    row: number;
    reason: string;
}
export declare class ImportCsvResponseDto {
    imported: number;
    skipped: number;
    errors: CsvImportErrorDto[];
}

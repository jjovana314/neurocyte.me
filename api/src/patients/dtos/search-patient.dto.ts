import { SearchOptions } from '../utils/search-options';

export class SearchPatientDto {
  query?: string;
  // Patient must have at least one record of EVERY listed type (AND).
  // Raw strings from the query param; validated in PatientsService.search.
  recordTypes?: string[];
  options?: SearchOptions;
}

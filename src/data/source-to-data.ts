import { DEMOGRAPHY_VALIDATION } from './demography-validation';

// Reuse the actual audited fields, not a synthetic record or an invented scan.
const source = DEMOGRAPHY_VALIDATION.report.sample_diagnostics.excluded_out_of_window_records
  .find(record => record.Code === 545 && record._source_file === 'VIT1867.XLS');
if (!source) throw new Error('The documented source-to-data record is missing');
const [start, end] = DEMOGRAPHY_VALIDATION.report.actual_year_window;
const inStudyWindow = source.Year >= start && source.Year <= end;
export const SOURCE_TO_DATA = {
  source,
  start,
  end,
  record: {
    county_code: source.Code,
    year: source.Year,
    source_file: source._source_file,
    in_study_window: inStudyWindow,
    decision: inStudyWindow ? 'retain' : 'exclude',
  },
  reportUrl: `https://github.com/AntonEbsen/Demography/blob/${DEMOGRAPHY_VALIDATION.commit}/exam_project2/reports/figure_4_1_validation.md`,
  providerUrl: 'https://www.patrickrgalloway.com/prussia.htm',
};

import { fetchPackingList } from '@/features/assistant/generate.ts';
import { assistantFormSchema } from '@/features/assistant/schema.ts';

import { makeTestCaseSchema, runEvals } from './run-evals.ts';

const testCaseSchema = makeTestCaseSchema(assistantFormSchema);

await runEvals({
  runPromptFunction: fetchPackingList,
  datasetFilePath: './evals/dataset.json',
  testCaseSchema,
});

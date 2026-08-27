import type { Content } from '@google/genai';
import { writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import pLimit from 'p-limit';
import { z } from 'zod';

import { addUserMessage, chat, renderPrompt } from './helpers';

type TestCase<TInput> = {
  promptInputs: TInput;
  solutionCriteria: string[];
  taskDescription: string;
  scenario: string;
};

export function makeTestCaseSchema<TInput>(promptInputsSchema: z.ZodType<TInput>) {
  return z.object({
    promptInputs: promptInputsSchema,
    solutionCriteria: z.array(z.string()),
    taskDescription: z.string(),
    scenario: z.string(),
  });
}

async function gradeOutput<TInput extends Record<string, unknown>, TOutput>({
  testCase,
  output,
  extraCriteria,
}: {
  testCase: TestCase<TInput>;
  output: TOutput;
  extraCriteria?: string | null;
}) {
  const promptInputs = Object.entries(testCase.promptInputs)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  let extraCriteriaSection = '';
  if (extraCriteria) {
    extraCriteriaSection = renderPrompt(
      `
      Mandatory Requirements - ANY VIOLATION MEANS AUTOMATIC FAILURE (score of 3 or lower):
      <extraImportantCriteria>
      {extraCriteria}
      </extraImportantCriteria>
    `,
      {
        extraCriteria: extraCriteria,
      },
    );
  }

  const evaluationTemplate = `
    Your task is to evaluate the following AI-generated solution with EXTREME RIGOR.

    Original task description:
    <taskDescription>
    {taskDescription}
    </taskDescription>

    Original task inputs:
    <taskInputs>
    {{ {promptInputs} }}
    </taskInputs>

    Solution to Evaluate:
    <solution>
    {output}
    </solution>

    Criteria you should use to evaluate the solution:
    <criteria>
    {solutionCriteria}
    </criteria>

    {extraCriteriaSection}

    Scoring Guidelines:
    * Score 1-3: Solution fails to meet one or more MANDATORY requirements
    * Score 4-6: Solution meets all mandatory requirements but has significant deficiencies in secondary criteria
    * Score 7-8: Solution meets all mandatory requirements and most secondary criteria, with minor issues
    * Score 9-10: Solution meets all mandatory and secondary criteria

    IMPORTANT SCORING INSTRUCTIONS:
    * Grade the output based ONLY on the listed criteria. Do not add your own extra requirements.
    * If a solution meets all of the mandatory and secondary criteria give it a 10
    * Don't complain that the solution "only" meets the mandatory and secondary criteria. Solutions shouldn't go above and beyond - they should meet the exact listed criteria.
    * ANY violation of a mandatory requirement MUST result in a score of 3 or lower
    * The full 1-10 scale should be utilized - don't hesitate to give low scores when warranted

    Output Format
    Provide your evaluation as a structured JSON object with the following fields, in this specific order:
    - "strengths": An array of 1-3 key strengths
    - "weaknesses": An array of 1-3 key areas for improvement
    - "reasoning": A concise explanation of your overall assessment
    - "score": A number between 1-10

    Respond with JSON. Keep your response concise and direct.
    Example response shape:
    {{
        "strengths": string[],
        "weaknesses": string[],
        "reasoning": string,
        "score": number
    }}
  `;

  const evaluationPrompt = renderPrompt(evaluationTemplate, {
    taskDescription: testCase.taskDescription,
    promptInputs: promptInputs,
    output: JSON.stringify(output, null, 2),
    solutionCriteria: testCase.solutionCriteria.join('\n'),
    extraCriteriaSection: extraCriteriaSection,
  });

  const messages: Content[] = [];

  addUserMessage(messages, evaluationPrompt);

  const response = await chat(messages, {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        reasoning: { type: 'string' },
        score: { type: 'number' },
      },
      required: ['strengths', 'weaknesses', 'reasoning', 'score'],
    },
  });

  return JSON.parse(response);
}

async function runTestCase<TInput extends Record<string, unknown>, TOutput>({
  testCase,
  runPromptFunction,
  extraCriteria,
}: {
  testCase: TestCase<TInput>;
  runPromptFunction: (promptInputs: TInput) => Promise<TOutput>;
  extraCriteria?: string;
}) {
  try {
    const output = await runPromptFunction(testCase.promptInputs);
    const grade = await gradeOutput({ testCase, output, extraCriteria });
    return { output, testCase, score: grade.score, reasoning: grade.reasoning };
  } catch (error) {
    return {
      output: null,
      testCase,
      score: 1,
      reasoning: `Failed before grading: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function runEvals<TInput extends Record<string, unknown>, TOutput>({
  runPromptFunction,
  datasetFilePath,
  testCaseSchema,
  extraCriteria,
  outputFilePath = './evals/evalsOutput.json',
  concurrency = 3,
}: {
  runPromptFunction: (promptInputs: TInput) => Promise<TOutput>;
  datasetFilePath: string;
  testCaseSchema: z.ZodType<TestCase<TInput>>;
  extraCriteria?: string;
  outputFilePath?: string;
  concurrency?: number;
}) {
  const limit = pLimit(concurrency);
  const raw = await readFile(datasetFilePath, 'utf-8');
  const rawDataset = JSON.parse(raw);

  if (!Array.isArray(rawDataset)) {
    throw new Error(`Expected ${datasetFilePath} to contain a JSON array of test cases`);
  }

  const dataset: TestCase<TInput>[] = [];
  for (const [index, rawCase] of rawDataset.entries()) {
    const result = testCaseSchema.safeParse(rawCase);
    if (result.success) {
      dataset.push(result.data);
    } else {
      console.warn(
        `Skipping test case #${index} (${rawCase?.scenario ?? 'unknown scenario'}) — schema validation failed:`,
      );
      console.warn(
        result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'),
      );
    }
  }

  if (dataset.length === 0) {
    throw new Error('No valid test cases remained after schema validation');
  }

  const total = dataset.length;
  let completed = 0;
  let lastReportedPercentage = 0;

  const evaluations = await Promise.all(
    dataset.map((testCase) =>
      limit(async () => {
        const result = await runTestCase({ testCase, runPromptFunction, extraCriteria });
        completed++;
        const currentPercentage = Math.floor((completed / total) * 100);
        const milestonePercentage = Math.floor(currentPercentage / 20) * 20;
        if (milestonePercentage > lastReportedPercentage) {
          console.log(`Evaluated ${completed}/${total} test cases`);
          lastReportedPercentage = milestonePercentage;
        }
        return result;
      }),
    ),
  );

  await writeFile(outputFilePath, JSON.stringify(evaluations, null, 2));

  const average = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
  console.table(evaluations.map((e) => ({ scenario: e.testCase.scenario, score: e.score })));
  console.log(`Average score: ${average.toFixed(2)} (${evaluations.length} cases)`);
}

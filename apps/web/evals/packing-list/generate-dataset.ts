import { type Content } from '@google/genai';
import { writeFile } from 'node:fs/promises';

import {
  addUserMessage,
  buildPromptInputsSchema,
  chat,
  formatPromptInputs,
  type PromptInputsSpec,
  renderPrompt,
} from './helpers.ts';

async function generateUniqueIdeas(
  taskDescription: string,
  promptInputsSpec: PromptInputsSpec,
  numCases: number,
) {
  const promptInputs = formatPromptInputs(promptInputsSpec);

  const prompt = `
        Generate {numCases} unique, diverse ideas for testing a prompt that accomplishes this task:
        
        <task_description>
        {taskDescription}
        </task_description>

        The prompt will receive the following inputs:
        <prompt_inputs>
        {promptInputs}
        </prompt_inputs>
        
        Each idea should represent a distinct scenario or example that tests different aspects of the task.
        Scenarios should be plausible and realistic. Prompt inputs needed to specify the scenario should not be be contradictory.
        
        Output Format:
        Provide your response as a structured JSON array where each item is a brief description of the idea.

        Example:
        \`\`\`json
        [
            "Testing with technical computer science terminology",
            "Testing with medical research findings",
            "Testing with complex mathematical concepts",
            ...
        ]
        \`\`\`
        
        Ensure each idea is:
        - Clearly distinct from the others
        - Relevant to the task description
        - Specific enough to guide generation of a full test case
        - Quick to solve without requiring extensive computation or multi-step processing

        Remember, only generate {numCases} unique ideas
    `;

  const systemPrompt =
    'You are a test scenario designer specialized in creating diverse, unique testing scenarios.';

  const messages: Content[] = [];
  const renderedPromt = renderPrompt(prompt, { taskDescription, promptInputs, numCases });
  addUserMessage(messages, renderedPromt);

  const response = await chat(messages, {
    system: systemPrompt,
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'array',
      items: { type: 'string' },
    },
  });

  return JSON.parse(response);
}

async function generateTestCase(
  taskDescription: string,
  idea: string,
  promptInputsSpec: PromptInputsSpec,
) {
  const promptInputs = formatPromptInputs(promptInputsSpec);
  const allowedKeys = Object.keys(promptInputsSpec);

  const prompt = `
        Generate a single detailed test case for a prompt evaluation based on:
        
        <task_description>
        {taskDescription}
        </task_description>
        
        <specific_idea>
        {idea}
        </specific_idea>
        
        <allowed_input_keys>
        {allowedKeys}
        </allowed_input_keys>
        
        Output Format:
        \`\`\`json
        {{
            "promptInputs": {{
            {promptInputs}
            }},
            "solutionCriteria": ["criterion 1", "criterion 2", ...] // Concise list of criteria for evaluating the solution, 1 to 4 items
        }}
        \`\`\`

        IMPORTANT REQUIREMENTS:
        - You MUST ONLY use these exact input keys in your prompt_inputs: {allowedKeys}        
        - Do NOT add any additional keys to prompt_inputs
        - Make the test case realistic and practically useful
        - Include measurable, concise solution criteria
        - The solution criteria should ONLY address the direct requirements of the task description and the generated prompt_inputs
        - Avoid over-specifying criteria with requirements that go beyond the core task
        - Keep solution criteria simple, focused, and directly tied to the fundamental task
        - The test case should be tailored to the specific idea provided
        - Quick to solve without requiring extensive computation or multi-step processing
        - DO NOT include any fields beyond those specified in the output format
    `;

  const systemPrompt =
    'You are a test case creator specializing in designing evaluation scenarios.';

  const messages: Content[] = [];
  const renderedPromt = renderPrompt(prompt, { taskDescription, idea, allowedKeys, promptInputs });

  addUserMessage(messages, renderedPromt);

  const response = await chat(messages, {
    system: systemPrompt,
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        promptInputs: buildPromptInputsSchema(promptInputsSpec),
        solutionCriteria: { type: 'array', items: { type: 'string' } },
      },
      required: ['promptInputs', 'solutionCriteria'],
    },
  });

  const testCase = JSON.parse(response);
  testCase['taskDescription'] = taskDescription;
  testCase['scenario'] = idea;

  return testCase;
}

export async function generateDataset(
  taskDescription: string,
  promptInputsSpec: PromptInputsSpec,
  numCases: number = 5,
  outputFilePath = './evals/dataset.json',
) {
  const ideas = await generateUniqueIdeas(taskDescription, promptInputsSpec, numCases);

  const total = ideas.length;
  let completed = 0;
  let lastReportedPercentage = 0;

  const dataset = await Promise.all(
    ideas.map(async (idea: string) => {
      try {
        return await generateTestCase(taskDescription, idea, promptInputsSpec);
      } catch (error) {
        console.error('Error generating test case:', error);
        return null;
      } finally {
        completed++;
        const currentPercentage = Math.floor((completed / total) * 100);
        const milestonePercentage = Math.floor(currentPercentage / 20) * 20;

        if (milestonePercentage > lastReportedPercentage) {
          console.log(`Generated ${completed}/${total} test cases`);
          lastReportedPercentage = milestonePercentage;
        }
      }
    }),
  ).then((results) => results.filter((result) => result !== null));

  await writeFile(outputFilePath, JSON.stringify(dataset, null, 2));

  return dataset;
}

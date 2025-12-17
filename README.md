# Turborepo tryout

This repo started as an experiment with various configs. Along the way, it’s naturally evolving into more of a Turborepo boilerplate. Some explanations are included, both to help others understand the setup and for future reference for myself 😄.

- The monorepo was bootstrapped using `create-turbo@latest`.
- The Next.js app was created with `create-next-app`.
- Vitest configuration is based on the official docs, the Turborepo Vitest example, and a fair bit of trial, error, and AI-assisted problem solving.

## Turborepo setup

### Apps

- web: a NextJS/React web app
  - **Tech stack**: Next.js, TypeScript, Tailwind, Vitest
  - **Vitest tests**:
    - “browser” tests
      - Run in a **real browser** (Chromium via Playwright)
      - Used for component rendering, interactions, and UI behavior
      - Powered by Vitest’s Browser Mode
      - need to be named `*.browser.test.tsx` to be taken into account
    - “node” tests
      - Run in a **Node.js** environment
      - Fast unit tests for utilities, server logic, hooks, etc.
      - Use Vitest + jsdom
      - need to be named `*.test.ts` to be taken into account
- api: an Express.js api
  - **Tech stack**: Express.js, TypeScript, Vitest
  - **Vitest tests**:
    - “node” tests
      - Same as for the frontend node tests

### Packages

- **eslint-config** – shared ESLint configuration
- **typescript-config** – shared TypeScript configuration
- **vitest-config** – shared Vitest configuration
- …

## Available scripts

| Script Name    | Description                                                                                       |
| :------------- | :------------------------------------------------------------------------------------------------ |
| `build`        | Builds all apps                                                                                   |
| `lint`         | Runs ESLint                                                                                       |
| `check-types`  | Runs TypeScript type checking                                                                     |
| `dev`          | Runs development servers                                                                          |
| `test`         | Runs the "node" tests and collects coverage                                                       |
| `test:watch`   | Runs the "node" tests in watch mode                                                               |
| `test:browser` | Runs the "browser" tests (opens up a Chromium browser window) and collects coverage               |
| `view-report`  | Collects and merges coverage reports for both "node" and "browser" tests (opens a browser window) |

## What I’ve learned so far

- How to set up a Turborepo monorepo with shared ESLint, TypeScript, and Vitest configuration
- How to configure Vitest for both Node (jsdom) and Browser (Playwright) testing
- How to configure Vitest test coverage collection for coverage reports

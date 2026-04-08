#!/usr/bin/env node
import { createProgram } from './program';

const program = createProgram();
program.parseAsync(process.argv).catch((err: unknown) => {
  // commander will already have printed help for known parse errors;
  // this path handles command-action exceptions.
  const message = (err as Error)?.message ?? String(err);
  process.stderr.write(`forge: ${message}\n`);
  process.exitCode = 1;
});

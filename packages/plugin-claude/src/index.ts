/**
 * @forge-kit-dev/plugin-claude is an asset-only package: its payload lives
 * under `.claude-plugin/` as JSON and Markdown files the Claude Code
 * host reads directly. This TypeScript entry exists so `pnpm` and
 * Turborepo treat it as a first-class workspace member (for typecheck
 * and publish), but there is nothing to import from it at runtime.
 */
export const FORGE_PLUGIN_VERSION = '0.1.0';

/** Absolute names of the slash commands this plugin exposes. */
export const FORGE_COMMANDS = [
  'forge-plan',
  'forge-generate',
  'forge-eval',
  'forge-fix',
] as const;
export type ForgeCommandName = (typeof FORGE_COMMANDS)[number];

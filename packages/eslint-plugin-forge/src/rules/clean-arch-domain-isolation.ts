import { createRule } from '../create-rule';

type Options = [
  {
    domainPathPatterns?: readonly string[];
    frameworkPackages?: readonly string[];
  },
];
type MessageIds = 'frameworkImportInDomain';

const DEFAULT_DOMAIN_PATTERNS = [
  '/src/domain/',
  '/src/entities/',
] as const;

const DEFAULT_FRAMEWORK_PACKAGES = [
  'react',
  'react-dom',
  'next',
  'next/navigation',
  'next/router',
  'next/image',
  'next/link',
] as const;

function normalizePath(filename: string): string {
  return filename.split(/[\\/]/).join('/');
}

function isDomainFile(
  filename: string,
  patterns: readonly string[]
): boolean {
  const normalized = normalizePath(filename);
  return patterns.some((pattern) => normalized.includes(pattern));
}

function isFrameworkImport(
  source: string,
  frameworkPackages: readonly string[]
): boolean {
  return frameworkPackages.some(
    (pkg) => source === pkg || source.startsWith(`${pkg}/`)
  );
}

export const cleanArchDomainIsolation = createRule<Options, MessageIds>({
  name: 'clean-arch-domain-isolation',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid framework imports (react, next, …) inside the domain layer.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          domainPathPatterns: {
            type: 'array',
            items: { type: 'string' },
          },
          frameworkPackages: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      frameworkImportInDomain:
        'Domain file "{{file}}" imports framework package "{{pkg}}". Domain code must stay framework-agnostic — move this to a feature, widget, or adapter.',
    },
  },
  defaultOptions: [
    {
      domainPathPatterns: [...DEFAULT_DOMAIN_PATTERNS],
      frameworkPackages: [...DEFAULT_FRAMEWORK_PACKAGES],
    },
  ],
  create(context, [opts]) {
    const domainPatterns =
      opts.domainPathPatterns ?? DEFAULT_DOMAIN_PATTERNS;
    const frameworkPackages =
      opts.frameworkPackages ?? DEFAULT_FRAMEWORK_PACKAGES;

    // If this file is not inside the domain layer, the rule no-ops.
    // That keeps it cheap on every non-domain file, which is the
    // overwhelming majority of a typical frontend codebase.
    if (!isDomainFile(context.filename, domainPatterns)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== 'string') return;
        if (!isFrameworkImport(source, frameworkPackages)) return;
        context.report({
          node: node.source,
          messageId: 'frameworkImportInDomain',
          data: {
            file: normalizePath(context.filename),
            pkg: source,
          },
        });
      },
    };
  },
});

export type ParsedCommandInfo = {
  packageManager: '' | 'npm' | 'uv';
  packageName: string;
  sourceRef?: string;
  sourceKind?: 'pypi' | 'git';
};

export const tokenizeCommand = (command?: string): string[] => {
  if (!command) return [];

  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | '`' | null = null;

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];

    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === '\\' && quote === '"' && index + 1 < command.length) {
        current += command[index + 1];
        index += 1;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    if (char === '\\' && index + 1 < command.length) {
      current += command[index + 1];
      index += 1;
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
};

const classifyUVSource = (sourceRef: string): 'pypi' | 'git' => {
  return sourceRef.startsWith('git+') ? 'git' : 'pypi';
};

export const extractPackageInfo = (tokens: string[]): ParsedCommandInfo => {
  if (tokens.length === 0) {
    return { packageManager: '', packageName: '' };
  }

  const [managerToken, ...args] = tokens;
  if (managerToken !== 'npx' && managerToken !== 'uvx') {
    return { packageManager: '', packageName: '' };
  }

  if (managerToken === 'npx') {
    const booleanFlags = new Set(['-y', '--yes', '--no-install', '--prefer-offline', '--quiet']);

    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];

      if (arg === '--') {
        return {
          packageManager: 'npm',
          packageName: index + 1 < args.length ? args[index + 1] : ''
        };
      }

      if (arg.startsWith('-')) {
        const normalized = arg.includes('=') ? arg.split('=')[0] : arg;
        if (!booleanFlags.has(normalized) && !arg.includes('=') && index + 1 < args.length) {
          index += 1;
        }
        continue;
      }

      return { packageManager: 'npm', packageName: arg };
    }

    return { packageManager: 'npm', packageName: '' };
  }

  const valueFlags = new Set(['--from', '--index', '--default-index', '--python', '--refresh-package']);
  const booleanFlags = new Set(['--quiet', '--preview', '--system', '--strict', '--native-tls']);
  let sourceRef = '';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      return {
        packageManager: 'uv',
        packageName: index + 1 < args.length ? args[index + 1] : '',
        sourceRef: sourceRef || undefined,
        sourceKind: sourceRef ? classifyUVSource(sourceRef) : undefined
      };
    }

    if (arg === '--from' && index + 1 < args.length) {
      sourceRef = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      const normalized = arg.includes('=') ? arg.split('=')[0] : arg;
      if (arg.includes('=') || booleanFlags.has(normalized)) {
        continue;
      }
      if (valueFlags.has(normalized) && index + 1 < args.length) {
        index += 1;
      }
      continue;
    }

    return {
      packageManager: 'uv',
      packageName: arg,
      sourceRef: sourceRef || arg,
      sourceKind: classifyUVSource(sourceRef || arg)
    };
  }

  return {
    packageManager: 'uv',
    packageName: '',
    sourceRef: sourceRef || undefined,
    sourceKind: sourceRef ? classifyUVSource(sourceRef) : undefined
  };
};

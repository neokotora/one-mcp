import { describe, expect, it } from 'vitest';

import { extractPackageInfo, tokenizeCommand } from '@/utils/command';

describe('command parsing', () => {
  it('parses uvx package invocation', () => {
    const tokens = tokenizeCommand('uvx grok-search');

    expect(extractPackageInfo(tokens)).toEqual({
      packageManager: 'uv',
      packageName: 'grok-search',
      sourceRef: 'grok-search',
      sourceKind: 'pypi'
    });
  });

  it('parses uvx --from pypi source with flags', () => {
    const tokens = tokenizeCommand('uvx --native-tls --from grok-search grok-search');

    expect(extractPackageInfo(tokens)).toEqual({
      packageManager: 'uv',
      packageName: 'grok-search',
      sourceRef: 'grok-search',
      sourceKind: 'pypi'
    });
  });

  it('parses uvx git source with flags', () => {
    const tokens = tokenizeCommand('uvx --native-tls --from git+https://github.com/GuDaStudio/GrokSearch.git@grok-with-tavily grok-search');

    expect(extractPackageInfo(tokens)).toEqual({
      packageManager: 'uv',
      packageName: 'grok-search',
      sourceRef: 'git+https://github.com/GuDaStudio/GrokSearch.git@grok-with-tavily',
      sourceKind: 'git'
    });
  });

  it('preserves quoted tokens', () => {
    const tokens = tokenizeCommand('uvx --from "git+https://github.com/example/repo.git@main" "grok search"');

    expect(tokens).toEqual([
      'uvx',
      '--from',
      'git+https://github.com/example/repo.git@main',
      'grok search'
    ]);
  });
});

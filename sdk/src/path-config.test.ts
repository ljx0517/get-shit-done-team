import { describe, expect, it } from 'vitest';
import { join } from 'node:path';

import { resolvePlanningDir } from './path-config.js';

describe('resolvePlanningDir', () => {
  it('defaults to .claude/.gsdt-planning', () => {
    expect(resolvePlanningDir('/tmp/project')).toBe(
      join('/tmp/project', '.claude', '.gsdt-planning'),
    );
  });

  it('preserves explicit planning dir overrides', () => {
    expect(resolvePlanningDir('/tmp/project', '.custom-planning')).toBe(
      join('/tmp/project', '.custom-planning'),
    );
  });
});

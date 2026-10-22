import { expect, it } from 'vitest';
import { FIGURE_REPRODUCTION as reproduction } from './demography-reproduction';
it('pins the narrow package and checkout command to the same immutable revision', () => {
  expect(reproduction.commit).toMatch(/^[a-f0-9]{40}$/);
  expect(reproduction.readmeUrl).toContain(`/blob/${reproduction.commit}/`);
  expect(reproduction.commands).toContain(`git checkout ${reproduction.commit}`);
  expect(reproduction.commands).toContain('python scripts/reproduce_figure_4_1.py');
});

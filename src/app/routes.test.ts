import { parseRoute } from './routes';

describe('parseRoute', () => {
  it('reads each kind of page', () => {
    expect(parseRoute('')).toEqual({ page: 'home' });
    expect(parseRoute('#/')).toEqual({ page: 'home' });
    expect(parseRoute('#/sandbox')).toEqual({ page: 'sandbox' });
    expect(parseRoute('#/lessons')).toEqual({ page: 'lessons' });
    expect(parseRoute('#/lesson/not-and/3')).toEqual({
      page: 'lesson',
      lessonId: 'not-and',
      step: 3,
    });
    expect(parseRoute('#/share/abc-123')).toEqual({ page: 'share', data: 'abc-123' });
    expect(parseRoute('#/lesson/or-xor/practice/both-on')).toEqual({
      page: 'lesson',
      lessonId: 'or-xor',
      step: 1,
      practice: 'both-on',
    });
  });

  it('defaults to step 1 for a missing or bad step number', () => {
    expect(parseRoute('#/lesson/not-and')).toEqual({
      page: 'lesson',
      lessonId: 'not-and',
      step: 1,
    });
    expect(parseRoute('#/lesson/not-and/zero')).toEqual({
      page: 'lesson',
      lessonId: 'not-and',
      step: 1,
    });
  });

  it('reports unknown pages', () => {
    expect(parseRoute('#/nope')).toEqual({ page: 'not-found', path: '/nope' });
  });
});

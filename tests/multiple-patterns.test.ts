import { match, not, when, __ } from '../src';
import { Option, some, none, BigUnion } from './utils';
import { Expect, Equal } from '../src/types/helpers';

describe('Multiple patterns', () => {
  it('should match if one of the patterns matches', () => {
    const testFn = (input: Option<number>) =>
      match(input)
        .with(
          { kind: 'some', value: 2 as const },
          { kind: 'some', value: 3 as const },
          { kind: 'some', value: 4 as const },
          (x) => {
            type t = Expect<
              Equal<
                typeof x,
                | { kind: 'some'; value: 2 }
                | { kind: 'some'; value: 3 }
                | { kind: 'some'; value: 4 }
              >
            >;
            return true;
          }
        )
        .with({ kind: 'none' }, { kind: 'some' }, (x) => {
          type t = Expect<
            Equal<typeof x, { kind: 'some'; value: number } | { kind: 'none' }>
          >;
          return false;
        })
        .run();

    const cases = [
      { input: { kind: 'some', value: 3 }, expected: true },
      { input: { kind: 'some', value: 2 }, expected: true },
      { input: { kind: 'some', value: 4 }, expected: true },
      { input: { kind: 'some', value: 5 }, expected: false },
      { input: { kind: 'some', value: -5 }, expected: false },
    ] as const;

    cases.forEach(({ input, expected }) => {
      expect(testFn(input)).toBe(expected);
    });
  });

  it('exhaustive patterns should match if one of the patterns matches', () => {
    const testFn = (input: Option<number>) =>
      match(input)
        .exhaustive()
        .with(
          { kind: 'some', value: 2 as const },
          { kind: 'some', value: 3 as const },
          { kind: 'some', value: 4 as const },
          (x) => {
            type t = Expect<
              Equal<
                typeof x,
                | { kind: 'some'; value: 2 }
                | { kind: 'some'; value: 3 }
                | { kind: 'some'; value: 4 }
              >
            >;
            return true;
          }
        )
        .with({ kind: 'none' }, { kind: 'some' }, (x) => {
          type t = Expect<
            Equal<typeof x, { kind: 'some'; value: number } | { kind: 'none' }>
          >;
          return false;
        })
        .run();

    const cases = [
      { input: { kind: 'some', value: 3 }, expected: true },
      { input: { kind: 'some', value: 2 }, expected: true },
      { input: { kind: 'some', value: 4 }, expected: true },
      { input: { kind: 'some', value: 5 }, expected: false },
      { input: { kind: 'some', value: -5 }, expected: false },
    ] as const;

    cases.forEach(({ input, expected }) => {
      expect(testFn(input)).toBe(expected);
    });
  });

  it("no patterns shouldn't typecheck", () => {
    const input = { kind: 'none' } as Option<number>;
    match(input)
      .exhaustive()
      // @ts-expect-error: Argument of type '() => false' is not assignable to parameter of type 'ExhaustivePattern<Option<number>>'
      .with(() => false);

    match(input)
      // @ts-expect-error: Argument of type '() => false' is not assignable to parameter of type 'ExhaustivePattern<Option<number>>'
      .with(() => false);

    match(input)
      .exhaustive()
      // @ts-expect-error: Argument of type '() => false' is not assignable to parameter of type 'ExhaustivePattern<Option<number>>'
      .with(() => false)
      .with(
        { kind: 'some', value: 2 as const },
        { kind: 'some', value: 3 as const },
        { kind: 'some', value: 4 as const },
        (x) => true
      )
      .with({ kind: 'none' }, { kind: 'some' }, () => false);
  });

  it('should work with all types of input', () => {
    type Input =
      | null
      | undefined
      | number
      | string
      | boolean
      | { a: string; b: number }
      | [boolean, number]
      | Map<string, { x: number }>
      | Set<number>;

    const nonExhaustive = (input: Input) =>
      match<Input>(input)
        .with(null, undefined, (x) => 'Nullable')
        .with(__.boolean, __.number, __.string, (x) => 'primitive')
        .with(
          { a: __.string },
          [true, 2],
          new Map([['key', __]]),
          new Set([__.number]),
          (x) => 'Object'
        )
        .with([false, 2] as const, (x) => '[false, 2]')
        .with([false, __.number] as const, (x) => '[false, number]')
        .run();

    const exhaustive = (input: Input) =>
      match<Input>(input)
        .exhaustive()
        .with(null, undefined, (x) => 'Nullable')
        .with(__.boolean, __.number, __.string, (x) => 'primitive')
        .with(
          { a: __.string },
          [true, 2],
          new Map([['key', __]]),
          new Set([__.number]),
          (x) => 'Object'
        )
        .with([false, 2] as const, (x) => '[false, 2]')
        .with([false, __.number] as const, (x) => '[false, number]')
        .run();

    const cases: { input: Input; expected: string }[] = [
      { input: null, expected: 'Nullable' },
      { input: undefined, expected: 'Nullable' },
      { input: true, expected: 'primitive' },
      { input: 2, expected: 'primitive' },
      { input: 'string', expected: 'primitive' },
      { input: { a: 'hello', b: 2 }, expected: 'Object' },
      { input: [true, 2], expected: 'Object' },
      { input: new Map([['key', { x: 2 }]]), expected: 'Object' },
      { input: new Set([2]), expected: 'Object' },
      { input: [false, 2], expected: '[false, 2]' },
      { input: [false, 3], expected: '[false, number]' },
    ];

    cases.forEach(({ input, expected }) => {
      expect(nonExhaustive(input)).toEqual(expected);
      expect(exhaustive(input)).toEqual(expected);
    });
  });
});
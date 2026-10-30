import { codeBlock } from 'common-tags';
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, test } from 'vitest';

import rule from './sort-imports.ts';

RuleTester.describe = describe;
RuleTester.it = test;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' } },
});

ruleTester.run('sort-imports', rule, {
  valid: [
    `import def, { a, B, type c, d as e, x as f } from 'm';`,
    `import * as ns from 'm';`,
    // digits compare as numbers, unless a run starts with zero
    `import { a2, a10 } from 'm';`,
    `import { n009, n9, n10 } from 'm';`,
    `import { a12b, a12c, a13 } from 'm';`,
    // symbols compare by code point
    `import { $a, _a, a } from 'm';`,
    {
      code: `import { $a, B, _a, a } from 'm';`,
      options: [{ ignoreCase: false }],
    },
    // names which only differ in case keep their order
    `import { A, a } from 'm';`,
    `import { a, A } from 'm';`,
    {
      code: `import { B, a } from 'm';`,
      options: [{ ignoreCase: false }],
    },
    {
      code: `import { b, a } from 'm';`,
      options: [{ order: 'desc' }],
    },
    // exports are not touched
    `export { b, a } from 'm';`,
    codeBlock`
      const a = 1;
      const b = 2;
      export { b, a };
    `,
  ],
  invalid: [
    {
      code: `import { c, b, a } from 'm';`,
      output: `import { a, b, c } from 'm';`,
      errors: [{ messageId: 'unsorted', data: { name: 'b', source: 'm' } }],
    },
    {
      // case is ignored by default
      code: `import { B, a } from 'm';`,
      output: `import { a, B } from 'm';`,
      errors: [{ messageId: 'unsorted', data: { name: 'a', source: 'm' } }],
    },
    {
      // upper case sorts before lower case without ignoreCase
      code: `import { a, B } from 'm';`,
      output: `import { B, a } from 'm';`,
      options: [{ ignoreCase: false }],
      errors: [{ messageId: 'unsorted', data: { name: 'B', source: 'm' } }],
    },
    {
      code: `import { a, b } from 'm';`,
      output: `import { b, a } from 'm';`,
      options: [{ order: 'desc' }],
      errors: [{ messageId: 'unsorted', data: { name: 'b', source: 'm' } }],
    },
    {
      code: `import { a10, a2 } from 'm';`,
      output: `import { a2, a10 } from 'm';`,
      errors: [{ messageId: 'unsorted', data: { name: 'a2', source: 'm' } }],
    },
    {
      code: `import { n9, n009 } from 'm';`,
      output: `import { n009, n9 } from 'm';`,
      errors: [{ messageId: 'unsorted', data: { name: 'n009', source: 'm' } }],
    },
    {
      code: `import { a, _a, $a } from 'm';`,
      output: `import { $a, _a, a } from 'm';`,
      errors: [{ messageId: 'unsorted', data: { name: '_a', source: 'm' } }],
    },
    {
      // type modifiers move with their member and don't change the order
      code: `import { type b, a, type C } from 'm';`,
      output: `import { a, type b, type C } from 'm';`,
      errors: [{ messageId: 'unsorted', data: { name: 'a', source: 'm' } }],
    },
    {
      // aliases are sorted by their local name
      code: `import { a as z, z as a } from 'm';`,
      output: `import { z as a, a as z } from 'm';`,
      errors: [{ messageId: 'unsorted', data: { name: 'a', source: 'm' } }],
    },
    {
      // default imports keep their place
      code: `import def, { b, a } from 'm';`,
      output: `import def, { a, b } from 'm';`,
      errors: [{ messageId: 'unsorted', data: { name: 'a', source: 'm' } }],
    },
    {
      // line breaks and the trailing comma are kept
      code: codeBlock`
        import {
          c,
          a, b,
        } from 'm';
      `,
      output: codeBlock`
        import {
          a,
          b, c,
        } from 'm';
      `,
      errors: [{ messageId: 'unsorted', data: { name: 'a', source: 'm' } }],
    },
    {
      // a comment inside the braces prevents the fix
      code: codeBlock`
        import {
          b, // about b
          a,
        } from 'm';
      `,
      output: null,
      errors: [{ messageId: 'unsorted', data: { name: 'a', source: 'm' } }],
    },
    {
      code: `import { /* first */ b, a } from 'm';`,
      output: null,
      errors: [{ messageId: 'unsorted', data: { name: 'a', source: 'm' } }],
    },
  ],
});

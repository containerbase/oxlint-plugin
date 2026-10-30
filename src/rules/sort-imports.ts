import { defineRule, type ESTree } from '@oxlint/plugins';

interface Options {
  order?: 'asc' | 'desc';
  ignoreCase?: boolean;
}

/**
 * Checks whether a character is an ASCII digit.
 * @param char the character, or `undefined` past the end of a name
 * @returns `true` for `0` to `9`
 */
function isDigit(char: string | undefined): boolean {
  return char !== undefined && char >= '0' && char <= '9';
}

/**
 * Compares two strings by character code.
 * @param a the first string
 * @param b the second string
 * @returns a negative number when `a` comes first
 */
function compareText(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/**
 * Compares two names in the natural order which oxfmt 0.75.0 uses for its
 * `sortImports` option. Measured against oxfmt, the order is that of the
 * Rust `natord` crate:
 * - characters compare by character code, so `$`, `-`, `.`, digits, `@`,
 *   upper case, `_`, lower case and `~` come in that order (`natord` compares
 *   code points, which only differs for characters outside the basic plane);
 * - with `ignoreCase` both names are lower cased first, so `_` comes before
 *   any letter;
 * - runs of digits compare as numbers, so `a2` comes before `a10`, but when
 *   either run starts with `0` they compare digit by digit, so `a02` comes
 *   before `a1` and `n009` before `n9`;
 * - names which compare equal, like `A` and `a` with `ignoreCase`, keep
 *   their order.
 * `natord` also skips whitespace, which can't occur in identifiers.
 * @param a the first name
 * @param b the second name
 * @param ignoreCase whether to compare the lower cased names
 * @returns a negative number when `a` comes first
 */
function compareNames(a: string, b: string, ignoreCase: boolean): number {
  const left = ignoreCase ? a.toLowerCase() : a;
  const right = ignoreCase ? b.toLowerCase() : b;
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (isDigit(left[i]) && isDigit(right[j])) {
      let endI = i;
      while (isDigit(left[endI])) {
        endI++;
      }
      let endJ = j;
      while (isDigit(right[endJ])) {
        endJ++;
      }
      const runA = left.slice(i, endI);
      const runB = right.slice(j, endJ);
      const result =
        runA.startsWith('0') || runB.startsWith('0')
          ? compareText(runA, runB)
          : runA.length - runB.length || compareText(runA, runB);
      if (result !== 0) {
        return result;
      }
      i = endI;
      j = endJ;
      continue;
    }
    const result = left.charCodeAt(i) - right.charCodeAt(j);
    if (result !== 0) {
      return result;
    }
    i++;
    j++;
  }
  return left.length - i - (right.length - j);
}

export default defineRule({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    messages: {
      unsorted:
        "Member '{{name}}' of the import of '{{source}}' is out of order, named imports are sorted alphabetically.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          order: { type: 'string', enum: ['asc', 'desc'] },
          ignoreCase: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    return {
      ImportDeclaration(node) {
        const options = context.options[0] as Options | undefined;
        const ignoreCase = options?.ignoreCase ?? true;
        const direction = options?.order === 'desc' ? -1 : 1;
        /**
         * Compares two named import specifiers by local name in the
         * configured order. `type` modifiers don't change the order.
         * @param a the first specifier
         * @param b the second specifier
         * @returns a negative number when `a` comes first
         */
        const compare = (a: ESTree.ImportSpecifier, b: ESTree.ImportSpecifier): number =>
          direction * compareNames(a.local.name, b.local.name, ignoreCase);

        const named = node.specifiers.filter(
          (specifier): specifier is ESTree.ImportSpecifier => specifier.type === 'ImportSpecifier',
        );
        // report the first member which belongs before its predecessor
        const index = named.findIndex(
          (specifier, i) => i > 0 && compare(named[i - 1]!, specifier) > 0,
        );
        if (index === -1) {
          return;
        }

        const { sourceCode } = context;
        // a comment inside the braces can't be assigned to a member safely
        const open = sourceCode.getTokenBefore(named[0]!)!;
        const close = sourceCode.getTokenBefore(node.source, 1)!;
        const fixable = !sourceCode.commentsExistBetween(open, close);

        // Only the members move, the separators between them stay as they
        // are, so line breaks and a trailing comma are kept.
        const sorted = named.toSorted(compare);
        const { text } = sourceCode;
        const start = named[0]!.range[0];
        const end = named.at(-1)!.range[1];
        context.report({
          node: named[index]!,
          messageId: 'unsorted',
          data: { name: named[index]!.local.name, source: node.source.value },
          ...(fixable && {
            fix: (fixer) =>
              fixer.replaceTextRange(
                [start, end],
                sorted
                  .map((specifier, i) => {
                    const member = text.slice(specifier.range[0], specifier.range[1]);
                    return i === 0
                      ? member
                      : text.slice(named[i - 1]!.range[1], named[i]!.range[0]) + member;
                  })
                  .join(''),
              ),
          }),
        });
      },
    };
  },
});

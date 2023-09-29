import TOML from '@ltd/j-toml';

export function parseToml<T>(input: string): T {
  return TOML.parse(input, {
    joiner: '\n',
  }) as T;
}

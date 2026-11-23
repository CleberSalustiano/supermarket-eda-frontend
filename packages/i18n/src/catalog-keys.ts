export function collectMessageKeys(tree: object): string[] {
  const keys: string[] = [];

  const walk = (node: object, prefix: string): void => {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'function') {
        keys.push(path);
      } else if (typeof value === 'string') {
        if (value.length === 0) {
          throw new Error(`Empty message at ${path}`);
        }
        keys.push(path);
      } else if (typeof value === 'object' && value !== null) {
        walk(value, path);
      }
    }
  };

  walk(tree, '');
  return keys.sort();
}

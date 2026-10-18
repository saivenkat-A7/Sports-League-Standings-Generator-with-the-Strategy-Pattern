/** Renders a markdown-style table with every column padded to its widest cell. */
export function formatTable(headers: string[], rows: Array<Array<string | number>>): string {
  const cells = rows.map((row) => row.map(String));
  const widths = headers.map((header, col) =>
    Math.max(header.length, ...cells.map((row) => row[col].length)),
  );
  const line = (values: string[]): string =>
    `| ${values.map((value, col) => value.padEnd(widths[col])).join(' | ')} |`;
  const separator = `|${widths.map((width) => '-'.repeat(width + 2)).join('|')}|`;
  return [line(headers), separator, ...cells.map(line)].join('\n');
}

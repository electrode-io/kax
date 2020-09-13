import os from 'os';

export const symbolizeText = (
  symbol: string,
  text: string,
  { symbolizeMultiLine }: { symbolizeMultiLine?: boolean } = {},
) =>
  symbolizeMultiLine
    ? text
        .split(os.EOL)
        .map((l) => `${symbol} ${l}`)
        .join(os.EOL)
    : `${symbol} ${text}`;

import chalk from 'chalk';

export const colorizeText = (color: string, text: string) => chalk[color](text);

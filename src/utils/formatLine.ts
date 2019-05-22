import { colorizeText } from './colorizeText'
import { symbolizeText } from './symbolizeText'
import indentString from 'indent-string'
import chalk from 'chalk'

export function formatLine(
  msg: string,
  {
    color,
    symbol,
    indent,
    symbolizeMultiLine,
    time,
  }: {
    color?: string
    symbol?: string
    indent?: number
    symbolizeMultiLine?: boolean
    time?: string
  } = {}
): string {
  let result = msg
  if (color) {
    result = colorizeText(color, result)
  }
  if (symbol) {
    result = symbolizeText(symbol, result, { symbolizeMultiLine })
  }
  if (time) {
    result += chalk.dim(` ${time}`)
  }
  if (indent) {
    result = indentString(result, indent)
  }
  return result
}

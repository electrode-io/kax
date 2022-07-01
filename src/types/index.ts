import { KaxTask } from '../KaxTask'

export interface KaxColorScheme {
  warning?: string
  error?: string
  info?: string
  task?: string
}

export const kaxDefaultColorScheme: KaxColorScheme = {
  warning: 'yellow',
  error: 'red',
  info: 'cyan',
  task: 'white',
}

export interface KaxSymbolScheme {
  warning?: string
  error?: string
  info?: string
  task?: string
  taskRunning?: string
  taskSuccess?: string
  taskFailure?: string
}

export const kaxDefaultSymbolScheme: KaxSymbolScheme = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  taskRunning: 'dots',
  taskSuccess: 'success',
  taskFailure: 'error',
}

export interface KaxOptions {
  colorScheme: KaxColorScheme
  symbolizeMultiLine?: boolean
}

export const kaxDefaultOptions: KaxOptions = {
  colorScheme: kaxDefaultColorScheme,
  symbolizeMultiLine: true,
}

export interface KaxRendererOptions {
  colorScheme?: KaxColorScheme
  symbolScheme?: KaxSymbolScheme
  symbolizeMultiLine?: boolean
  shouldLogTime?: boolean
}

export const kaxRendererDefaultOptions: KaxRendererOptions = {
  colorScheme: kaxDefaultColorScheme,
  symbolScheme: kaxDefaultSymbolScheme,
  symbolizeMultiLine: true,
  shouldLogTime: false,
}

export interface KaxRenderer {
  renderWarning(msg: string)
  renderInfo(msg: string)
  renderError(msg: string)
  renderTask(msg: string, task: KaxTask)
  renderRaw(msg: string)
}

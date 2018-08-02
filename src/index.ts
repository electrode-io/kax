import chalk from 'chalk'
import logUpdate from 'log-update'
import cliSpinners from 'cli-spinners'
import logSymbols from 'log-symbols'
import indentString from 'indent-string'
import EventEmitter from 'events'
import os from 'os'
class KaxTaskEventEmitter extends EventEmitter {}

const colorizeText = (color: string, text: string) => chalk[color](text)

const symbolizeText = (
  symbol: string,
  text: string,
  { symbolizeMultiLine }: { symbolizeMultiLine?: boolean } = {}
) =>
  symbolizeMultiLine
    ? text
        .split(os.EOL)
        .map(l => `${symbol} ${l}`)
        .join(os.EOL)
    : `${symbol} ${text}`

class KaxTimer {
  private _startEpoc: number
  private _curEpoc: number
  private _cursSecs: number = 0
  private _curMins: number = 0
  private _interval: NodeJS.Timer

  public constructor() {
    this._startEpoc = Date.now()
    this._curEpoc = this._startEpoc
  }

  public start() {
    this._interval = setInterval(() => {
      this._curEpoc = Date.now()
      const deltaEpocInSec = (this._curEpoc - this._startEpoc) / 1000
      this._cursSecs = Math.trunc(deltaEpocInSec % 60)
      this._curMins = Math.trunc(deltaEpocInSec / 60)
    }, 500)
    return this
  }

  public stop() {
    clearInterval(this._interval)
    return this
  }

  public toString() {
    this._curEpoc = Date.now()
    return this._curMins > 0
      ? `${this._curMins}m ${this._cursSecs}s`
      : `${this._cursSecs}s`
  }
}

export class KaxTask<T> {
  public readonly emitter: KaxTaskEventEmitter = new KaxTaskEventEmitter()
  public static readonly Success: string = 'success'
  public static readonly Failure: string = 'failure'
  public static readonly Completed: string = 'completed'
  public static readonly TextUpdated: string = 'textupdated'
  private _kaxTimer: KaxTimer = new KaxTimer().start()

  public async run(
    task: Promise<T>,
    {
      errorMsg,
      successMsg,
    }: {
      errorMsg?: string
      successMsg?: string
    } = {}
  ): Promise<T> {
    try {
      const result: T = await task
      this.succeed(successMsg)
      return result
    } catch (e) {
      this.fail(errorMsg)
      throw e
    }
  }

  public set text(msg: string) {
    this.emitter.emit(KaxTask.TextUpdated, msg)
  }

  public succeed(msg?: string) {
    this.emitter.emit(KaxTask.Success, msg)
    this.emitter.emit(KaxTask.Completed)
    this._kaxTimer.stop()
  }

  public fail(msg?: string) {
    this.emitter.emit(KaxTask.Failure, msg)
    this.emitter.emit(KaxTask.Completed)
    this._kaxTimer.stop()
  }

  public get timer(): KaxTimer {
    return this._kaxTimer
  }
}

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
  renderTask<T>(msg: string, task: KaxTask<T>)
}

function formatLine(
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

export class KaxAdvancedRenderer implements KaxRenderer {
  private readonly _opts: KaxRendererOptions
  private readonly _lines
  private _curLevel: number

  public constructor(opts: KaxRendererOptions = kaxRendererDefaultOptions) {
    this._opts = opts
    this._lines = []
    this._curLevel = 0
  }

  public render() {
    logUpdate(this._lines.join('\n'))
  }

  private formatLineInternal(
    msg: string,
    {
      color,
      symbol,
      time,
    }: {
      color?: string
      symbol?: string
      time?: string
    } = {}
  ): string {
    return formatLine(msg, {
      color: color && this._opts.colorScheme && this._opts.colorScheme[color],
      symbol:
        symbol &&
        this._opts.symbolScheme &&
        this._opts.symbolScheme[symbol] &&
        logSymbols[this._opts.symbolScheme[symbol]],
      indent: this._curLevel * 2,
      symbolizeMultiLine: this._opts.symbolizeMultiLine,
      time,
    })
  }

  public renderWarning(msg: string) {
    this._lines.push(
      this.formatLineInternal(msg, {
        color: 'warning',
        symbol: 'warning',
      })
    )
    this.render()
  }

  public renderInfo(msg: string) {
    this._lines.push(
      this.formatLineInternal(msg, { color: 'info', symbol: 'info' })
    )
    this.render()
  }

  public renderError(msg: string) {
    this._lines.push(
      this.formatLineInternal(msg, { color: 'error', symbol: 'error' })
    )
    this.render()
  }

  public renderTask<T>(msg: string, task: KaxTask<T>) {
    const linesIdx =
      this._lines.push(
        this.formatLineInternal(msg, {
          color: 'task',
          symbol: 'taskRunning',
          time: this._opts.shouldLogTime ? task.timer.toString() : undefined,
        })
      ) - 1
    let curFrameIdx = 0
    const curCapturedLevel = this._curLevel
    const interval = setInterval(() => {
      curFrameIdx =
        ++curFrameIdx %
        cliSpinners[this._opts.symbolScheme!.taskRunning].frames.length
      const frame =
        cliSpinners[this._opts.symbolScheme!.taskRunning].frames[curFrameIdx]
      this._lines[linesIdx] = formatLine(msg, {
        color: this._opts.colorScheme && this._opts.colorScheme.task,
        symbol: frame,
        indent: curCapturedLevel * 2,
        symbolizeMultiLine: this._opts.symbolizeMultiLine,
        time: this._opts.shouldLogTime ? task.timer.toString() : undefined,
      })
      this.render()
    }, cliSpinners[this._opts.symbolScheme!.taskRunning].interval)
    this._curLevel++
    task.emitter.on(KaxTask.Success, (m?: string) => {
      this._lines[linesIdx] = formatLine(m || msg, {
        color: this._opts.colorScheme && this._opts.colorScheme.task,
        symbol:
          this._opts.symbolScheme &&
          this._opts.symbolScheme.taskSuccess &&
          logSymbols[this._opts.symbolScheme.taskSuccess],
        indent: curCapturedLevel * 2,
        symbolizeMultiLine: this._opts.symbolizeMultiLine,
        time: this._opts.shouldLogTime ? task.timer.toString() : undefined,
      })
      this.render()
    })
    task.emitter.on(KaxTask.Failure, (m?: string) => {
      this._lines[linesIdx] = formatLine(m || msg, {
        color: this._opts.colorScheme && this._opts.colorScheme.task,
        symbol:
          this._opts.symbolScheme &&
          this._opts.symbolScheme.taskFailure &&
          logSymbols[this._opts.symbolScheme.taskFailure],
        indent: curCapturedLevel * 2,
        symbolizeMultiLine: this._opts.symbolizeMultiLine,
        time: this._opts.shouldLogTime ? task.timer.toString() : undefined,
      })
      this.render()
    })
    task.emitter.on(KaxTask.Completed, () => {
      this._curLevel--
      clearInterval(interval)
    })
    task.emitter.on(KaxTask.TextUpdated, (m: string) => {
      msg = m
    })
    this.render()
  }
}

export class KaxSimpleRenderer implements KaxRenderer {
  private readonly _opts: KaxRendererOptions

  public constructor(opts: KaxRendererOptions = kaxRendererDefaultOptions) {
    this._opts = opts
  }

  public renderLine(
    msg: string,
    stream: NodeJS.WriteStream,
    {
      color,
      symbol,
    }: {
      color?: string
      symbol?: string
    } = {}
  ) {
    stream.write(
      `${formatLine(msg, {
        color,
        symbol,
        symbolizeMultiLine: this._opts.symbolizeMultiLine,
      })}${os.EOL}`
    )
  }

  public renderWarning(msg: string) {
    this.renderLine(msg, process.stdout, {
      color: this._opts.colorScheme && this._opts.colorScheme.warning,
      symbol:
        this._opts.symbolScheme &&
        this._opts.symbolScheme.warning &&
        logSymbols[this._opts.symbolScheme.warning],
    })
  }

  public renderInfo(msg: string) {
    this.renderLine(msg, process.stdout, {
      color: this._opts.colorScheme && this._opts.colorScheme.info,
      symbol:
        this._opts.symbolScheme &&
        this._opts.symbolScheme.info &&
        logSymbols[this._opts.symbolScheme.info],
    })
  }

  public renderError(msg: string) {
    this.renderLine(msg, process.stderr, {
      color: this._opts.colorScheme && this._opts.colorScheme.error,
      symbol:
        this._opts.symbolScheme &&
        this._opts.symbolScheme.error &&
        logSymbols[this._opts.symbolScheme.error],
    })
  }

  public renderTask<T>(msg: string, task: KaxTask<T>) {
    let pendingTaskMsg = `[================ Started ${msg} ================]`
    this.renderLine(pendingTaskMsg, process.stdout, {
      color: this._opts.colorScheme && this._opts.colorScheme.task,
    })
    task.emitter.on(KaxTask.Success, (successMsg?: string) =>
      this.renderLine(
        successMsg || `[================ Completed ${msg} ================]`,
        process.stdout,
        {
          color: this._opts.colorScheme && this._opts.colorScheme.task,
        }
      )
    )
    task.emitter.on(KaxTask.Failure, (errorMsg?: string) =>
      this.renderLine(
        errorMsg || `[================ Failure ${msg} ================]`,
        process.stderr,
        {
          color: this._opts.colorScheme && this._opts.colorScheme.task,
        }
      )
    )
  }
}

export class Kax {
  private _renderer: KaxRenderer

  public constructor(renderer: KaxRenderer) {
    this._renderer = renderer
  }

  public info(msg: string): void {
    this._renderer.renderInfo(msg)
  }

  public warn(msg: string): void {
    this._renderer.renderWarning(msg)
  }

  public error(msg: string): void {
    this._renderer.renderError(msg)
  }

  public task<T>(msg: string): KaxTask<T> {
    const task = new KaxTask<T>()
    this._renderer.renderTask(msg, task)
    return task
  }

  public set renderer(renderer: KaxRenderer) {
    this._renderer = renderer
  }
}

export default new Kax(new KaxAdvancedRenderer())

import chalk from 'chalk'
import logUpdate from 'log-update'
import cliSpinners from 'cli-spinners'
import logSymbols from 'log-symbols'
import indentString from 'indent-string'
import EventEmitter from 'events'
import os from 'os'

class KaxLineEventEmitter extends EventEmitter {}
class KaxTaskEventEmitter extends EventEmitter {}

export class KaxLine {
  private _text: string
  public readonly indent: number
  public readonly emitter: KaxLineEventEmitter

  constructor(
    text: string,
    {
      color,
      symbol,
      symbolizeMultiLine,
      indent,
    }: {
      color?: string
      symbol?: string
      symbolizeMultiLine?: boolean
      indent: number
    }
  ) {
    this.emitter = new KaxLineEventEmitter()
    this.indent = indent
    this.setText(text, { color, symbol, symbolizeMultiLine })
  }

  public get text(): string {
    return this._text
  }

  public setText(
    text: string,
    {
      color,
      symbol,
      symbolizeMultiLine,
    }: { color?: string; symbol?: string; symbolizeMultiLine?: boolean }
  ) {
    if (color) {
      text = colorizeText(color, text)
    }
    if (symbol && symbolizeMultiLine) {
      text = symbolizeText(symbol, text)
    }
    this._text = text
    this.emitter.emit('textUpdated')
  }
}

const colorizeText = (color: string, text: string) => chalk[color](text)

const symbolizeText = (symbol: string, text: string) =>
  text
    .split(os.EOL)
    .map(l => `${symbol} ${l}`)
    .join(os.EOL)

export class KaxInfoLine extends KaxLine {
  constructor(text: string, indent: number, opts: KaxOptions) {
    super(text, {
      color: opts.colorScheme.info,
      symbol: logSymbols.info,
      symbolizeMultiLine: opts.symbolizeMultiLine,
      indent,
    })
  }
}

export class KaxErrorLine extends KaxLine {
  constructor(text: string, indent: number, opts: KaxOptions) {
    super(text, {
      color: opts.colorScheme.error,
      symbol: logSymbols.error,
      symbolizeMultiLine: opts.symbolizeMultiLine,
      indent,
    })
  }
}

export class KaxWarnLine extends KaxLine {
  constructor(text: string, indent: number, opts: KaxOptions) {
    super(text, {
      color: opts.colorScheme.warning,
      symbol: logSymbols.warning,
      symbolizeMultiLine: opts.symbolizeMultiLine,
      indent,
    })
  }
}

export class KaxTaskLine extends KaxLine {
  public readonly timer: NodeJS.Timer
  private _curFrameIdx: number

  constructor(text: string, indent: number, opts: KaxOptions) {
    super(text, {
      color: opts.colorScheme.task,
      symbol: cliSpinners.dots.frames[0],
      symbolizeMultiLine: opts.symbolizeMultiLine,
      indent,
    })
    this._curFrameIdx = 0
    this.timer = setInterval(() => {
      this._curFrameIdx = ++this._curFrameIdx % cliSpinners.dots.frames.length
      const frame = cliSpinners.dots.frames[this._curFrameIdx]
      this.setText(this.text.slice(2), {
        color: opts.colorScheme.task,
        symbol: frame,
        symbolizeMultiLine: opts.symbolizeMultiLine,
      })
    }, cliSpinners.dots.interval)
  }
}

export class KaxTask<T> {
  private _attachedLine: KaxTaskLine
  public readonly emitter: KaxTaskEventEmitter
  public readonly options: KaxOptions

  public constructor(attachedLine: KaxTaskLine, opts: KaxOptions) {
    this._attachedLine = attachedLine
    this.options = opts
    this.emitter = new KaxTaskEventEmitter()
  }

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

  public succeed(msg?: string) {
    this._attachedLine.setText(msg || this._attachedLine.text.slice(2), {
      color: this.options.colorScheme.task,
      symbol: logSymbols.success,
      symbolizeMultiLine: this.options.symbolizeMultiLine,
    })
    this.completed()
  }

  public fail(msg?: string) {
    this._attachedLine.setText(msg || this._attachedLine.text.slice(2), {
      color: this.options.colorScheme.task,
      symbol: logSymbols.error,
      symbolizeMultiLine: this.options.symbolizeMultiLine,
    })
    this.completed()
  }

  public completed() {
    clearInterval(this._attachedLine.timer)
    this.emitter.emit('completed')
  }
}
export class KaxRenderer {
  private _lines: KaxLine[]

  constructor(lines: KaxLine[] = []) {
    this._lines = lines
  }

  public addLine(line: KaxLine) {
    this._lines.push(line)
    this.render()
    line.emitter.on('textUpdated', () => this.render())
  }

  buildCompositeText(arr: KaxLine[], acc: string, level: number) {
    let txt = ''
    for (const kaxLine of arr) {
      txt += `${indentString(kaxLine.text, kaxLine.indent * 2)}\n`
    }
    return txt
  }

  public render() {
    logUpdate(this.buildCompositeText(this._lines, '', 0))
  }
}

export interface KaxColorScheme {
  warning: string
  error: string
  info: string
  task: string
}

export const kaxDefaultColorScheme: KaxColorScheme = {
  warning: 'yellow',
  error: 'red',
  info: 'blue',
  task: 'white',
}

export interface KaxOptions {
  colorScheme: KaxColorScheme
  symbolizeMultiLine?: boolean
}

export const kaxDefaultOptions: KaxOptions = {
  colorScheme: kaxDefaultColorScheme,
  symbolizeMultiLine: true,
}

export class Kax {
  private readonly renderer: KaxRenderer
  private readonly opts: KaxOptions
  private curIndent: number

  public constructor(opts: {
    colorScheme?: {
      warn?: string
      error?: string
      info?: string
      task?: string
    }
    symbolizeMultiLine?: boolean
  }) {
    this.renderer = new KaxRenderer()
    const colorScheme = Object.assign(kaxDefaultColorScheme, opts.colorScheme)
    const symbolizeMultiLine =
      opts.symbolizeMultiLine !== undefined
        ? opts.symbolizeMultiLine
        : kaxDefaultOptions.symbolizeMultiLine
    this.opts = {
      colorScheme,
      symbolizeMultiLine,
    }
    this.curIndent = 0
  }

  public info(msg: string): Kax {
    const line = new KaxInfoLine(msg, this.curIndent, this.opts)
    this.renderer.addLine(line)
    return this
  }

  public warn(msg: string): Kax {
    const line = new KaxWarnLine(msg, this.curIndent, this.opts)
    this.renderer.addLine(line)
    return this
  }

  public error(msg: string) {
    const line = new KaxErrorLine(msg, this.curIndent, this.opts)
    this.renderer.addLine(line)
    return this
  }

  public task<T>(msg: string): KaxTask<T> {
    const line = new KaxTaskLine(msg, this.curIndent, this.opts)
    const task = new KaxTask<T>(line, this.opts)
    this.renderer.addLine(line)
    this.curIndent++
    task.emitter.on('completed', () => this.curIndent--)
    return task
  }
}

export default new Kax(kaxDefaultOptions)

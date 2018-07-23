import logUpdate from 'log-update'
import cliSpinners from 'cli-spinners'
import logSymbols from 'log-symbols'
import indentString from 'indent-string'
import EventEmitter from 'events'

class KaxLineEventEmitter extends EventEmitter {}
class KaxTaskEventEmitter extends EventEmitter {}

export class KaxLine {
  private _text: string
  public readonly emitter: KaxLineEventEmitter
  public readonly indent: number

  constructor(text: string, indent: number) {
    this._text = text
    this.indent = indent
    this.emitter = new KaxLineEventEmitter()
  }

  public get text(): string {
    return this._text
  }

  public set text(value: string) {
    this._text = value
    this.emitter.emit('textUpdated')
  }
}

export class KaxInfoLine extends KaxLine {
  constructor(text: string, indent: number) {
    super(`${logSymbols.info} ${text}`, indent)
  }
}

export class KaxErrorLine extends KaxLine {
  constructor(text: string, indent: number) {
    super(`${logSymbols.error} ${text}`, indent)
  }
}

export class KaxWarnLine extends KaxLine {
  constructor(text: string, indent: number) {
    super(`${logSymbols.warning} ${text}`, indent)
  }
}

export class KaxTaskLine extends KaxLine {
  public readonly timer: NodeJS.Timer
  private _curFrameIdx: number

  constructor(text: string, indent: number) {
    super(`${cliSpinners.dots.frames[0]} ${text}`, indent)
    this._curFrameIdx = 0
    this.timer = setInterval(() => {
      this._curFrameIdx = ++this._curFrameIdx % cliSpinners.dots.frames.length
      const frame = cliSpinners.dots.frames[this._curFrameIdx]
      this.text = `${frame} ${this.text.slice(2)}`
    }, cliSpinners.dots.interval)
  }
}

export class KaxTask<T> {
  private _attachedLine: KaxTaskLine
  public readonly emitter: KaxTaskEventEmitter

  public constructor(attachedLine: KaxTaskLine) {
    this._attachedLine = attachedLine
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
    this._attachedLine.text = `${logSymbols.success} ${msg ||
      this._attachedLine.text.slice(2)}`
    this.completed()
  }

  public fail(msg?: string) {
    this._attachedLine.text = `${logSymbols.error} ${msg ||
      this._attachedLine.text.slice(2)}`
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

export default class Kax {
  private renderer: KaxRenderer
  private curIndent: number

  public constructor() {
    this.renderer = new KaxRenderer()
    this.curIndent = 0
  }

  public info(msg: string): Kax {
    const line = new KaxInfoLine(msg, this.curIndent)
    this.renderer.addLine(line)
    return this
  }

  public warn(msg: string): Kax {
    const line = new KaxWarnLine(msg, this.curIndent)
    this.renderer.addLine(line)
    return this
  }

  public error(msg: string) {
    const line = new KaxErrorLine(msg, this.curIndent)
    this.renderer.addLine(line)
    return this
  }

  public task<T>(msg: string): KaxTask<T> {
    const line = new KaxTaskLine(msg, this.curIndent)
    const task = new KaxTask<T>(line)
    this.renderer.addLine(line)
    this.curIndent++
    task.emitter.on('completed', () => this.curIndent--)
    return task
  }
}

export const kax = new Kax()

import {
  KaxRenderer,
  KaxRendererOptions,
  kaxRendererDefaultOptions,
} from '../types'
import { formatLine } from '../utils'
import { KaxTask } from '../KaxTask'
import logUpdate from 'log-update'
import logSymbols from 'log-symbols'
import cliSpinners from 'cli-spinners'

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

  public renderRaw(msg: string) {
    this._lines.push(msg)
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
        cliSpinners[this._opts.symbolScheme!.taskRunning!].frames.length
      const frame =
        cliSpinners[this._opts.symbolScheme!.taskRunning!].frames[curFrameIdx]
      this._lines[linesIdx] = formatLine(msg, {
        color: this._opts.colorScheme && this._opts.colorScheme.task,
        symbol: frame,
        indent: curCapturedLevel * 2,
        symbolizeMultiLine: this._opts.symbolizeMultiLine,
        time: this._opts.shouldLogTime ? task.timer.toString() : undefined,
      })
      this.render()
    }, cliSpinners[this._opts.symbolScheme!.taskRunning!].interval)
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

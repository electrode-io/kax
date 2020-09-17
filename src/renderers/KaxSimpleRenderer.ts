import {
  KaxRenderer,
  KaxRendererOptions,
  kaxRendererDefaultOptions,
} from '../types'
import { formatLine } from '../utils'
import { KaxTask } from '../KaxTask'
import logSymbols from 'log-symbols'
import os from 'os'

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

  public renderRaw(msg: string) {
    process.stdout.write(`${msg}${os.EOL}`)
  }

  public renderTask<T>(msg: string, task: KaxTask<T>) {
    this.renderLine(`[ ${msg} (Started) ]`, process.stdout, {
      color: this._opts.colorScheme && this._opts.colorScheme.task,
    })
    task.emitter.on(KaxTask.Success, (successMsg?: string) =>
      this.renderLine(
        successMsg || `[ ${msg} (Completed in ${task.timer.toString()})]`,
        process.stdout,
        {
          color: this._opts.colorScheme && this._opts.colorScheme.task,
        }
      )
    )
    task.emitter.on(KaxTask.Failure, (errorMsg?: string) =>
      this.renderLine(errorMsg || `[ ${msg} (Failed) ]`, process.stderr, {
        color: this._opts.colorScheme && this._opts.colorScheme.task,
      })
    )
  }
}

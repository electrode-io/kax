const logUpdate = require('log-update')
const cliSpinners = require('cli-spinners')
const logSymbols = require('log-symbols')
const indentString = require('indent-string')

const EventEmitter = require('events')

class TaskEventEmitter extends EventEmitter {}

export interface WhirlCompletable {
  readonly isComplete: boolean
}

export class WhirlTask implements WhirlCompletable {
  private timer: NodeJS.Timer
  private frameIdx: number
  private _isComplete: boolean
  public currentText: string

  constructor(msg: string) {
    this._isComplete = false
    this.frameIdx = 0
  }

  public get isComplete(): boolean {
    return this._isComplete
  }

  public start(msg: string, spinner = 'dots'): WhirlTask {
    this.currentText = msg
    this.timer = setInterval(() => {
      this.frameIdx = ++this.frameIdx % cliSpinners[spinner].frames.length
      const frame = cliSpinners.dots.frames[this.frameIdx]
      this.updateCurrentText(`${frame} ${msg}`)
    }, cliSpinners.dots.interval)
    return this
  }

  public success(msg?: string): WhirlTask {
    clearInterval(this.timer)
    this._isComplete = true

    this.updateCurrentText(`${logSymbols.success} ${msg}`)

    return this
  }

  public fail(msg?: string): WhirlTask {
    clearInterval(this.timer)
    this._isComplete = true
    this.updateCurrentText(`${logSymbols.fail} ${msg}`)
    return this
  }

  private updateCurrentText(text: string) {
    this.currentText = text
  }
}

class WhirlLineEventEmitter extends EventEmitter {}

export class WhirlLine {
  private _text: string
  public readonly emitter: WhirlLineEventEmitter
  public readonly indent: number

  constructor(text: string, indent: number) {
    this._text = text
    this.indent = indent
    this.emitter = new WhirlLineEventEmitter()
  }

  public get text(): string {
    return this._text
  }

  public set text(value: string) {
    this._text = value
    this.emitter.emit('textUpdated')
  }
}

/* public bottomMostNonCompletedTask(curTaskNode: TaskNode): TaskNode | void {
    const lastChildNode =
      curTaskNode.children.length > 0 &&
      curTaskNode.children[curTaskNode.children.length - 1]
    if (lastChildNode && !lastChildNode.task.isComplete) {
      if (lastChildNode.children.length > 0) {
        return this.bottomMostNonCompletedTask(lastChildNode)
      } else {
        return lastChildNode
      }
    } else {
      return curTaskNode.task.isComplete ? undefined : curTaskNode
    }
  }*/

export class WhirlRenderer {
  private _lines: WhirlLine[]

  constructor(lines: WhirlLine[] = []) {
    this._lines = lines
  }

  public addLine(line: WhirlLine, indent: number) {
    this._lines.push(line)
    line.emitter.on('textUpdated', () => this.render())
  }

  buildCompositeText(arr: WhirlLine[], acc: string, level: number) {
    let txt = ''
    for (const whirlLine of arr) {
      txt += `${indentString(whirlLine.text, whirlLine.indent * 2)}\n`
    }
    return txt
  }

  public render() {
    logUpdate(this.buildCompositeText(this._lines, '', 0))
  }
}

export const last = (arr: any[]) => arr[arr.length - 1]

export class Whirl {
  private renderer: WhirlRenderer
  private completables: WhirlCompletable[]

  public constructor() {
    this.renderer = new WhirlRenderer()
    this.completables = []
  }

  // [complete:true, [complete:true, complete:true], complete: false, [complete: true, complet: false, [ complet:true ]]
  // [complete: true, complete:true, complete:true]

  public add(
    arr: any[],
    completable: WhirlCompletable,
    indent: number
  ): number {
    for (const entry of arr) {
      if (Array.isArray(entry)) {
        if (entry.some(e => !e.isComplete)) {
          return this.add(entry, completable, indent + 2)
        }
      } else {
        if (!entry.isComplete) {
          arr.push([completable])
          return indent
        }
      }
    }
    return indent
  }

  public display(msg: string): WhirlAction {
    const whirLine = new WhirlLine()
  }

  public async run<T>({
    task,
    msg,
    errorMsg,
    successMsg,
  }: {
    task: Promise<T>
    msg: string
    errorMsg?: string
    successMsg?: string
  }): Promise<T> {
    const whirlTask = new WhirlTask().start(msg)
    this.renderer.addTask(whirlTask)
    try {
      const result: T = await task
      whirlTask.success(successMsg || msg)
      return result
    } catch (e) {
      whirlTask.fail(errorMsg || msg)
      throw e
    }
  }
}

export const whirl = new Whirl()

const delay = (d: number) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, d)
  })

const subtask = async () => {
  await whirl.run({ task: delay(2000), msg: 'This is a sub test !' })
  await whirl.run({ task: delay(2000), msg: 'This is another sub test !' })
}

const main = async () => {
  await whirl.run({ task: delay(4000), msg: 'This is a test !' })
  await whirl.run({
    task: subtask(),
    msg: 'This is another test !',
  })
  await whirl.run({ task: delay(1000), msg: 'This is yet another test !' })

  // await whirl.run('msg').task(tsk)
  //              |_> to create message and entry first
  //                         |_task
}

main().then(() => console.log('done'))

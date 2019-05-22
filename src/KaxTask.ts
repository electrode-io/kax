import { KaxTaskEventEmitter } from './KaxTaskEventEmitter'
import { KaxTimer } from './KaxTimer'

export class KaxTask<T> {
  public readonly emitter: KaxTaskEventEmitter = new KaxTaskEventEmitter()
  public static readonly Success: string = 'success'
  public static readonly Failure: string = 'failure'
  public static readonly Completed: string = 'completed'
  public static readonly TextUpdated: string = 'textupdated'
  private _kaxTimer: KaxTimer = new KaxTimer().start()

  public async run<T>(
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

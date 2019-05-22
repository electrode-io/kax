import { KaxRenderer } from './types'
import { KaxTask } from './KaxTask'

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

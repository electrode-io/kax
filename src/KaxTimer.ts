export class KaxTimer {
  private _startEpoc: number;

  private _curEpoc: number;

  private _cursSecs = 0;

  private _curMins = 0;

  private _interval: NodeJS.Timeout | null = null;

  public constructor() {
    this._startEpoc = Date.now();
    this._curEpoc = this._startEpoc;
  }

  public start() {
    this._interval = setInterval(() => {
      this._curEpoc = Date.now();
      const deltaEpocInSec = (this._curEpoc - this._startEpoc) / 1000;
      this._cursSecs = Math.trunc(deltaEpocInSec % 60);
      this._curMins = Math.trunc(deltaEpocInSec / 60);
    }, 500);
    return this;
  }

  public stop() {
    if (this._interval) {
      clearInterval(this._interval);
    }
    return this;
  }

  public toString() {
    this._curEpoc = Date.now();
    return this._curMins > 0
      ? `${this._curMins}m ${this._cursSecs}s`
      : `${this._cursSecs}s`;
  }
}

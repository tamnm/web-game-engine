export interface CameraShakeOptions {
  intensity: number; // max pixel offset at t=0
  durationMs: number; // total duration in ms
  frequencyHz?: number; // oscillations per second (default 25)
}

export class Camera2D {
  x = 0;
  y = 0;
  zoom = 1;

  private shakeTimeRemaining = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  private shakeFreq = 25;
  private phaseX = 0;
  private phaseY = Math.PI / 2; // quadrature for orthogonal movement
  private _shakeOffsetX = 0;
  private _shakeOffsetY = 0;

  get shakeOffset(): { x: number; y: number } {
    return { x: this._shakeOffsetX, y: this._shakeOffsetY };
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.0001, zoom);
  }

  shake(options: CameraShakeOptions): void {
    this.shakeIntensity = Math.max(0, options.intensity);
    this.shakeDuration = Math.max(0, options.durationMs);
    this.shakeTimeRemaining = this.shakeDuration;
    this.shakeFreq = options.frequencyHz ?? 25;
    // Reset phases so behavior is deterministic across runs
    this.phaseX = 0;
    this.phaseY = Math.PI / 2;
    this._shakeOffsetX = 0;
    this._shakeOffsetY = 0;
  }

  update(dtMs: number): void {
    if (this.shakeTimeRemaining <= 0 || this.shakeDuration <= 0 || this.shakeIntensity <= 0) {
      this._shakeOffsetX = 0;
      this._shakeOffsetY = 0;
      this.shakeTimeRemaining = 0;
      return;
    }
    const dtSec = Math.max(0, dtMs) / 1000;
    this.shakeTimeRemaining = Math.max(0, this.shakeTimeRemaining - dtMs);
    const t = 1 - this.shakeTimeRemaining / this.shakeDuration;
    const amplitude = this.shakeIntensity * (1 - t); // linear decay
    const omega = 2 * Math.PI * this.shakeFreq;
    this.phaseX += omega * dtSec;
    this.phaseY += omega * dtSec;
    this._shakeOffsetX = Math.sin(this.phaseX) * amplitude;
    this._shakeOffsetY = Math.cos(this.phaseY) * amplitude;
    if (this.shakeTimeRemaining === 0) {
      this._shakeOffsetX = 0;
      this._shakeOffsetY = 0;
    }
  }
}

export type { Camera2D as Camera };

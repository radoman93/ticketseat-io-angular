import { makeAutoObservable, action } from 'mobx';

export class RotationStore {
  isRotating = false;
  rotationCenter: { x: number, y: number } | null = null;

  constructor() {
    makeAutoObservable(this, {
      // Explicitly mark actions
      startRotation: action,
      endRotation: action
    });
  }

  startRotation = action('startRotation', (center: { x: number, y: number }) => {
    this.isRotating = true;
    this.rotationCenter = center;
  });

  endRotation = action('endRotation', () => {
    this.isRotating = false;
    this.rotationCenter = null;
  });
}

// Create singleton instance
export default new RotationStore(); 
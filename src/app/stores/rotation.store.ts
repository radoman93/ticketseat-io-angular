import { makeAutoObservable, action } from 'mobx';

class RotationStore {
  isRotating = false;
  pivot: { x: number, y: number } | null = null;

  constructor() {
    makeAutoObservable(this, {
      startRotation: action,
      endRotation: action
    });
  }

  startRotation(pivot: { x: number, y: number }) {
    this.isRotating = true;
    this.pivot = pivot;
  }

  endRotation() {
    this.isRotating = false;
    this.pivot = null;
  }
}

export const rotationStore = new RotationStore(); 
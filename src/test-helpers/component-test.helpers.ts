/**
 * Test helpers for component testing
 */
import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

/**
 * Query selector helper for finding elements in component
 */
export function query<T>(fixture: ComponentFixture<T>, selector: string): DebugElement {
  return fixture.debugElement.query(By.css(selector));
}

/**
 * Query all selector helper for finding multiple elements
 */
export function queryAll<T>(fixture: ComponentFixture<T>, selector: string): DebugElement[] {
  return fixture.debugElement.queryAll(By.css(selector));
}

/**
 * Trigger click event on element
 */
export function click(element: DebugElement | HTMLElement): void {
  if (element instanceof HTMLElement) {
    element.click();
  } else {
    element.nativeElement.click();
  }
}

/**
 * Set input value and trigger input event
 */
export function setInputValue(element: DebugElement | HTMLElement, value: string): void {
  const inputElement = element instanceof HTMLElement ? element : element.nativeElement;
  inputElement.value = value;
  inputElement.dispatchEvent(new Event('input'));
}

/**
 * Trigger mouse events for drag and drop testing
 */
export function triggerMouseEvent(
  element: HTMLElement,
  eventType: string,
  x: number,
  y: number
): void {
  const event = new MouseEvent(eventType, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y
  });
  element.dispatchEvent(event);
}

/**
 * Simulate drag operation
 */
export function simulateDrag(
  element: HTMLElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): void {
  triggerMouseEvent(element, 'mousedown', startX, startY);
  triggerMouseEvent(element, 'mousemove', endX, endY);
  triggerMouseEvent(element, 'mouseup', endX, endY);
}

/**
 * Wait for async operations
 */
export function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock canvas context for grid testing
 */
export function createMockCanvasContext(): CanvasRenderingContext2D {
  return {
    clearRect: jasmine.createSpy('clearRect'),
    beginPath: jasmine.createSpy('beginPath'),
    moveTo: jasmine.createSpy('moveTo'),
    lineTo: jasmine.createSpy('lineTo'),
    stroke: jasmine.createSpy('stroke'),
    fillRect: jasmine.createSpy('fillRect'),
    strokeRect: jasmine.createSpy('strokeRect'),
    save: jasmine.createSpy('save'),
    restore: jasmine.createSpy('restore'),
    scale: jasmine.createSpy('scale'),
    translate: jasmine.createSpy('translate'),
    rotate: jasmine.createSpy('rotate'),
    arc: jasmine.createSpy('arc'),
    fill: jasmine.createSpy('fill')
  } as any;
}

/**
 * Mock HTMLCanvasElement for testing
 */
export function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const mockContext = createMockCanvasContext();
  spyOn(canvas, 'getContext').and.returnValue(mockContext);
  return canvas;
}

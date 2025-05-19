import { AfterViewInit, Component, ElementRef, ViewChild, HostListener, OnDestroy } from '@angular/core';
import { gridStore } from '../../stores/grid.store';
import { MobxAngularModule } from 'mobx-angular';

@Component({
  selector: 'app-grid',
  imports: [MobxAngularModule],
  standalone: true,
  templateUrl: './grid.component.html',
  // Using Tailwind CSS classes instead of separate CSS file
})
export class GridComponent implements AfterViewInit, OnDestroy {
  // Reference to our MobX store
  store = gridStore;

  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.setCanvasSize();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
      this.drawGrid();
      
      // Register the drawGrid method as a callback
      this.store.registerRedrawCallback(this.drawGrid.bind(this));
    }
  }

  //The idea is to make large canvas and have it contained within grid-container
  private setCanvasSize() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.store.canvasWidth;
    canvas.height = this.store.canvasHeight;
  }

  private drawGrid(): void {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    const { width, height } = canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.save();

    this.ctx.translate(this.store.panOffset.x, this.store.panOffset.y);
    this.ctx.scale(this.store.zoomLevel / 100, this.store.zoomLevel / 100);

    const startX =
      Math.floor(-this.store.panOffset.x / (this.store.gridSize * (this.store.zoomLevel / 100))) *
      this.store.gridSize;
    const startY =
      Math.floor(-this.store.panOffset.y / (this.store.gridSize * (this.store.zoomLevel / 100))) *
      this.store.gridSize;
    const endX = width / (this.store.zoomLevel / 100) + startX + this.store.gridSize;
    const endY = height / (this.store.zoomLevel / 100) + startY + this.store.gridSize;

    this.ctx.strokeStyle = 'rgb(200, 200, 200)';
    this.ctx.lineWidth = 0.5;

    for (let x = startX; x <= endX; x += this.store.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += this.store.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, 0);
    this.ctx.lineTo(endX, 0);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(0, startY);
    this.ctx.lineTo(0, endY);
    this.ctx.stroke();

    this.ctx.restore();
  }

  @HostListener('window:resize')
  onResize() {
    this.setCanvasSize();
    this.drawGrid();
  }

  ngOnDestroy() {
    // Unregister the callback when component is destroyed
    this.store.unregisterRedrawCallback(this.drawGrid.bind(this));
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.button === 1) {
      this.store.startPanning(event.clientX, event.clientY);
      event.preventDefault();
    }

    //
    // Clearing selection when left click the canvas
    // else if (!this.selectedTool && event.button === 0) {
    //   this.selectionService.clearSelection();
    // }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.store.setMousePosition(event.clientX, event.clientY);

    if (this.store.isPanning) {
      this.store.pan(event.clientX, event.clientY);
      this.drawGrid();
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (event.button === 1) {
      this.store.stopPanning();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.store.stopPanning();
  }

  @HostListener('wheel', ['$event'])
  onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    this.store.adjustZoom(zoomDirection * 10);
    this.drawGrid();
  }

  zoomIn(): void {
    this.store.zoomIn();
    this.drawGrid();
  }

  zoomOut(): void {
    this.store.zoomOut();
    this.drawGrid();
  }

}

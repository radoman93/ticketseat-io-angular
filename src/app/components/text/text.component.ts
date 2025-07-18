import { Component, Input, HostBinding, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import { makeAutoObservable, observable, computed, action } from 'mobx';
import { rootStore } from '../../stores/root.store';
import viewerStore from '../../stores/viewer.store';
import { TextElement } from '../../models/elements.model';

@Component({
  selector: 'app-text',
  standalone: true,
  imports: [CommonModule, FormsModule, MobxAngularModule],
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.css']
})
export class TextComponent implements OnInit, OnChanges {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() text: string = 'Text Label';
  @Input() fontSize: number = 14;
  @Input() fontFamily: string = 'Arial';
  @Input() fontWeight: string = 'normal';
  @Input() fontStyle: string = 'normal';
  @Input() textAlign: string = 'left';
  @Input() color: string = '#000000';
  @Input() backgroundColor?: string;
  @Input() borderColor?: string;
  @Input() borderWidth?: number;
  @Input() padding?: number;
  @Input() width?: number;
  @Input() height?: number;
  @Input() textData!: TextElement;
  @Input() isSelected: boolean = false;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;

  // Internal observable properties that sync with inputs
  public _x: number = 0;
  public _y: number = 0;
  public _text: string = 'Text Label';
  public _fontSize: number = 14;
  public _fontFamily: string = 'Arial';
  public _fontWeight: string = 'normal';
  public _fontStyle: string = 'normal';
  public _textAlign: string = 'left';
  public _color: string = '#000000';
  public _backgroundColor?: string;
  public _borderColor?: string;
  public _borderWidth?: number;
  public _padding?: number;
  public _width?: number;
  public _height?: number;
  public _textData: TextElement | null = null;
  public _isSelected: boolean = false;
  public _isPreview: boolean = false;
  public _rotation: number = 0;
  

  store = rootStore;
  viewerStore = viewerStore;

  @HostBinding('class') @Input() class: string = '';

  constructor() {
    makeAutoObservable(this, {
      // Computed properties
      effectiveText: computed,
      effectiveFontSize: computed,
      effectiveFontFamily: computed,
      effectiveFontWeight: computed,
      effectiveFontStyle: computed,
      effectiveTextAlign: computed,
      effectiveColor: computed,
      effectiveBackgroundColor: computed,
      effectiveBorderColor: computed,
      effectiveBorderWidth: computed,
      effectivePadding: computed,
      effectiveWidth: computed,
      effectiveHeight: computed,
      dynamicWidth: computed,
      textPosition: computed,
      textStyles: computed,
      textStylesWithoutTransform: computed,
      // Internal observable properties
      _x: observable,
      _y: observable,
      _text: observable,
      _fontSize: observable,
      _fontFamily: observable,
      _fontWeight: observable,
      _fontStyle: observable,
      _textAlign: observable,
      _color: observable,
      _backgroundColor: observable,
      _borderColor: observable,
      _borderWidth: observable,
      _padding: observable,
      _width: observable,
      _height: observable,
      _textData: observable,
      _isSelected: observable,
      _isPreview: observable,
      _rotation: observable,
      // Actions
      syncInputs: action,
      handleTextClick: action,
      // Exclude @Input properties from being observable to prevent MobX strict mode warnings
      x: false,
      y: false,
      text: false,
      fontSize: false,
      fontFamily: false,
      fontWeight: false,
      fontStyle: false,
      textAlign: false,
      color: false,
      backgroundColor: false,
      borderColor: false,
      borderWidth: false,
      padding: false,
      width: false,
      height: false,
      textData: false,
      isSelected: false,
      isPreview: false,
      rotation: false,
      class: false,
      // Exclude stores as they are already observable
      store: false,
      viewerStore: false
    });
  }

  ngOnInit() {
    this.syncInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.syncInputs();
  }


  @action
  public syncInputs() {
    this._x = this.x;
    this._y = this.y;
    this._text = this.text;
    this._fontSize = this.fontSize;
    this._fontFamily = this.fontFamily;
    this._fontWeight = this.fontWeight;
    this._fontStyle = this.fontStyle;
    this._textAlign = this.textAlign;
    this._color = this.color;
    this._backgroundColor = this.backgroundColor;
    this._borderColor = this.borderColor;
    this._borderWidth = this.borderWidth;
    this._padding = this.padding;
    this._width = this.width;
    this._height = this.height;
    this._textData = this.textData;
    this._isSelected = this.isSelected;
    this._isPreview = this.isPreview;
    this._rotation = this.rotation;
  }

  // Handle text click for selecting the text
  handleTextClick(event: MouseEvent): void {
    event.stopPropagation();

    if (this._textData && this._textData.id) {
      this.store.selectionStore.selectItem(this._textData);
    }
  }


  // Computed properties for effective values
  get effectiveText(): string {
    return this._textData ? this._textData.text : this._text;
  }

  get effectiveFontSize(): number {
    return this._textData ? this._textData.fontSize : this._fontSize;
  }

  get effectiveFontFamily(): string {
    return this._textData ? this._textData.fontFamily : this._fontFamily;
  }

  get effectiveFontWeight(): string {
    return this._textData ? this._textData.fontWeight : this._fontWeight;
  }

  get effectiveFontStyle(): string {
    return this._textData ? this._textData.fontStyle : this._fontStyle;
  }

  get effectiveTextAlign(): string {
    return this._textData ? this._textData.textAlign : this._textAlign;
  }

  get effectiveColor(): string {
    return this._textData ? this._textData.color : this._color;
  }

  get effectiveBackgroundColor(): string | undefined {
    return this._textData ? this._textData.backgroundColor : this._backgroundColor;
  }

  get effectiveBorderColor(): string | undefined {
    return this._textData ? this._textData.borderColor : this._borderColor;
  }

  get effectiveBorderWidth(): number {
    return this._textData ? (this._textData.borderWidth ?? 0) : (this._borderWidth ?? 0);
  }

  get effectivePadding(): number {
    return this._textData ? (this._textData.padding ?? 4) : (this._padding ?? 4);
  }

  get effectiveWidth(): number | undefined {
    return this._textData ? this._textData.width : this._width;
  }

  get effectiveHeight(): number | undefined {
    return this._textData ? this._textData.height : this._height;
  }

  // Dynamic width calculation based on content
  get dynamicWidth(): string {
    // If user has set a specific width, use it
    if (this.effectiveWidth && this.effectiveWidth > 0) {
      return `${this.effectiveWidth}px`;
    }
    
    // Otherwise, use auto with max-width constraint
    return 'auto';
  }

  // Text positioning
  get textPosition(): { x: number; y: number } {
    // Prioritize direct inputs over textData for position
    const x = this._x !== 0 ? this._x : (this._textData ? this._textData.x : 0);
    const y = this._y !== 0 ? this._y : (this._textData ? this._textData.y : 0);
    return { x, y };
  }

  // Combined text styles without transform (handled by parent div)
  get textStylesWithoutTransform(): { [key: string]: string } {
    const styles: { [key: string]: string } = {
      fontSize: `${this.effectiveFontSize}px`,
      fontFamily: this.effectiveFontFamily,
      fontWeight: this.effectiveFontWeight,
      fontStyle: this.effectiveFontStyle,
      textAlign: this.effectiveTextAlign,
      color: this.effectiveColor,
      padding: `${this.effectivePadding}px`,
      width: this.dynamicWidth,
      maxWidth: this.effectiveWidth && this.effectiveWidth > 0 ? `${this.effectiveWidth}px` : '300px'
    };

    if (this.effectiveHeight && this.effectiveHeight > 0) {
      styles['height'] = `${this.effectiveHeight}px`;
    }

    if (this.effectiveBackgroundColor) {
      styles['backgroundColor'] = this.effectiveBackgroundColor;
    }

    if (this.effectiveBorderColor && this.effectiveBorderWidth) {
      styles['border'] = `${this.effectiveBorderWidth}px solid ${this.effectiveBorderColor}`;
    }

    return styles;
  }

  // Combined text styles (legacy - keeping for compatibility)
  get textStyles(): { [key: string]: string } {
    const styles: { [key: string]: string } = {
      fontSize: `${this.effectiveFontSize}px`,
      fontFamily: this.effectiveFontFamily,
      fontWeight: this.effectiveFontWeight,
      fontStyle: this.effectiveFontStyle,
      textAlign: this.effectiveTextAlign,
      color: this.effectiveColor,
      padding: `${this.effectivePadding}px`,
      transform: `rotate(${this._rotation}deg)`,
      transformOrigin: 'center',
      width: this.dynamicWidth,
      maxWidth: this.effectiveWidth && this.effectiveWidth > 0 ? `${this.effectiveWidth}px` : '300px'
    };

    if (this.effectiveHeight && this.effectiveHeight > 0) {
      styles['height'] = `${this.effectiveHeight}px`;
      styles['overflow'] = 'hidden';
    }

    if (this.effectiveBackgroundColor && this.effectiveBackgroundColor !== 'transparent') {
      styles['backgroundColor'] = this.effectiveBackgroundColor;
    }

    if (this.effectiveBorderColor && this.effectiveBorderColor !== 'transparent' && this.effectiveBorderWidth > 0) {
      styles['border'] = `${this.effectiveBorderWidth}px solid ${this.effectiveBorderColor}`;
    }

    if (this._isPreview) {
      styles['opacity'] = '0.7';
    }

    return styles;
  }
}
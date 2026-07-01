// icon.component.ts — stroke icon set for Seat Map Studio.
// Ports editor/seat-icons.jsx (EdIcons) + the Logo/Moon/Sun from icons.jsx.
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'sms-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [':host{display:inline-flex;align-items:center;justify-content:center;line-height:0;}'],
  template: `
    @switch (name) {
      @case ('Logo') {
        <svg [attr.width]="s" [attr.height]="s * (24/32)" viewBox="0 0 32 24" fill="none" aria-label="TicketSeat">
          <defs>
            <mask id="lgcut">
              <rect x="3" y="3" width="26" height="18" rx="4.5" fill="white"/>
              <circle cx="3" cy="12" r="3.4" fill="black"/>
              <circle cx="29" cy="12" r="3.4" fill="black"/>
            </mask>
          </defs>
          <g mask="url(#lgcut)"><rect x="3" y="3" width="26" height="18" rx="4.5" fill="#6668ee"/></g>
          <line x1="21.5" y1="5.5" x2="21.5" y2="18.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="0.2 2.6"/>
          <path d="M8.4 7.6h9.4v2.7h-3.3v6.1h-2.8v-6.1H8.4z" fill="#fff"/>
        </svg>
      }
      @default {
        <svg [attr.width]="s" [attr.height]="s" viewBox="0 0 24 24"
             [attr.fill]="name === 'Star' ? 'currentColor' : 'none'"
             [attr.stroke]="name === 'Star' ? 'none' : 'currentColor'"
             stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
             [style.transform]="rot ? 'rotate(' + rot + 'deg)' : null"
             [style.transition]="rot !== undefined && animate ? '.15s' : null">
          <g [innerHTML]="path"></g>
        </svg>
      }
    }
  `,
})
export class IconComponent {
  @Input() name = '';
  @Input() s = 20;
  /** rotation in degrees (e.g. 45 to turn the Add glyph into a close ✕) */
  @Input() rot?: number;
  @Input() animate = false;

  private static readonly P: Record<string, string> = {
    Cursor:  '<path d="M12.586 12.586 19 19"/><path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z"/>',
    Stage:   '<path d="M4 17v-2a8 6.5 0 0 1 16 0v2Z"/><path d="M2 20h20"/>',
    Row:     '<rect x="2.25" y="10" width="5.5" height="6" rx="1.8"/><rect x="9.25" y="8.6" width="5.5" height="6" rx="1.8"/><rect x="16.25" y="10" width="5.5" height="6" rx="1.8"/>',
    Segrow:  '<path d="M3 16 9 9l5 4 7-8"/><circle cx="3" cy="16" r="1.7" fill="currentColor" stroke="none"/><circle cx="9" cy="9" r="1.7" fill="currentColor" stroke="none"/><circle cx="14" cy="13" r="1.7" fill="currentColor" stroke="none"/><circle cx="21" cy="5" r="1.7" fill="currentColor" stroke="none"/>',
    Table:   '<circle cx="12" cy="12" r="5"/><circle cx="20.6" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="16.3" cy="4.55" r="1.7" fill="currentColor" stroke="none"/><circle cx="7.7" cy="4.55" r="1.7" fill="currentColor" stroke="none"/><circle cx="3.4" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="7.7" cy="19.45" r="1.7" fill="currentColor" stroke="none"/><circle cx="16.3" cy="19.45" r="1.7" fill="currentColor" stroke="none"/>',
    Zone:    '<rect width="18" height="18" x="3" y="3" rx="2" stroke-dasharray="4 3"/>',
    Polygon: '<path d="M10.83 2.38a2 2 0 0 1 2.34 0l8 5.74a2 2 0 0 1 .73 2.25l-3.04 9.26a2 2 0 0 1-1.9 1.37H7.04a2 2 0 0 1-1.9-1.37L2.1 10.37a2 2 0 0 1 .73-2.25z"/>',
    Label:   '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
    Marker:  '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    Line:    '<path d="M5 19 19 5"/><circle cx="5" cy="19" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="5" r="2" fill="currentColor" stroke="none"/>',
    Undo:    '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>',
    Redo:    '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13"/>',
    ZoomIn:  '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>',
    ZoomOut: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/>',
    Grid:    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    Magnet:  '<path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15"/><path d="m5 8 4 4"/><path d="m12 15 4 4"/>',
    Trash:   '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    Copy:    '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    Menu:    '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    Layers:  '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    Help:    '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    Edit:    '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    Eye:     '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    Rotate:  '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    List:    '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    Map:     '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v15"/><path d="M15 6v15"/>',
    Add:     '<path d="M5 12h14"/><path d="M12 5v14"/>',
    Minus:   '<path d="M5 12h14"/>',
    Check:   '<path d="M20 6 9 17l-5-5"/>',
    Wand:    '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
    Drag:    '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',
    Cart:    '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    Moon:    '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    Sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  };

  private _safe = new Map<string, SafeHtml>();
  constructor(private sanitizer: DomSanitizer) {}

  get path(): SafeHtml {
    const raw = IconComponent.P[this.name] ?? IconComponent.P['Marker'];
    let s = this._safe.get(raw);
    if (!s) { s = this.sanitizer.bypassSecurityTrustHtml(raw); this._safe.set(raw, s); }
    return s;
  }
}

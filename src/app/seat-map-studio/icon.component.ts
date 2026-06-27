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
    Cursor:  '<path d="M5 3l6 16 2.2-6.3L19.5 10.5 5 3z"/>',
    Stage:   '<path d="M4 9c4-3 12-3 16 0M4 9v8h16V9"/>',
    Row:     '<path d="M3 14c3-3 15-3 18 0"/><circle cx="6" cy="13" r="1.6"/><circle cx="12" cy="11.6" r="1.6"/><circle cx="18" cy="13" r="1.6"/>',
    Table:   '<circle cx="12" cy="12" r="5"/><circle cx="12" cy="4.5" r="1.4"/><circle cx="12" cy="19.5" r="1.4"/><circle cx="4.5" cy="12" r="1.4"/><circle cx="19.5" cy="12" r="1.4"/>',
    Zone:    '<rect x="3.5" y="6" width="17" height="12" rx="2" stroke-dasharray="2.5 2.5"/>',
    Polygon: '<path d="M12 3.5 20 9.2 17 19 7 19 4 9.2 12 3.5Z" stroke-dasharray="2.6 2.6"/><circle cx="12" cy="3.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="20" cy="9.2" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="9.2" r="1.5" fill="currentColor" stroke="none"/>',
    Label:   '<path d="M5 7h14M9 7v11M15 7v11" stroke-width="1.6"/>',
    Marker:  '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2"/>',
    Undo:    '<path d="M9 7 4.5 11.5 9 16M4.5 11.5H14a5.5 5.5 0 0 1 0 11h-2"/>',
    Redo:    '<path d="m15 7 4.5 4.5L15 16M19.5 11.5H10a5.5 5.5 0 0 0 0 11h2"/>',
    ZoomIn:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2M11 8.4v5.2M8.4 11h5.2"/>',
    ZoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2M8.4 11h5.2"/>',
    Grid:    '<path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    Magnet:  '<path d="M6 4v7a6 6 0 0 0 12 0V4M6 4H3.5M6 4h3M18 4h2.5M18 4h-3M6 11v3M18 11v3"/>',
    Trash:   '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13"/>',
    Copy:    '<rect x="8" y="8" width="12" height="12" rx="2.2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    Menu:    '<path d="M4 7h16M4 12h16M4 17h16"/>',
    Layers:  '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3.5 12 8.5 4.8L20.5 12"/>',
    Edit:    '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M14 6l4 4"/>',
    Eye:     '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="2.6"/>',
    Rotate:  '<path d="M3.5 12a8.5 8.5 0 1 1 2.5 6"/><path d="M6 21v-4H10"/>',
    List:    '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    Map:     '<path d="m9 4 6 2 6-2v15l-6 2-6-2-6 2V6l6-2Z"/><path d="M9 4v15M15 6v15"/>',
    Add:     '<path d="M12 5v14M5 12h14"/>',
    Check:   '<path d="m4.5 12.5 5 5 10-11"/>',
    Wand:    '<path d="m15 6 3 3M5 21 16 10l-2-2L3 19l2 2ZM18 3l.7 1.8L20.5 5.5 18.7 6.2 18 8l-.7-1.8L15.5 5.5 17.3 4.8 18 3Z"/>',
    Drag:    '<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>',
    Cart:    '<path d="M3 4h2l2.2 11.4a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L21 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/>',
    // from icons.jsx
    Moon:    '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5Z"/>',
    Sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.5 4.5l1.5 1.5M18 18l1.5 1.5M2.5 12h2M19.5 12h2M4.5 19.5 6 18M18 6l1.5-1.5"/>',
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

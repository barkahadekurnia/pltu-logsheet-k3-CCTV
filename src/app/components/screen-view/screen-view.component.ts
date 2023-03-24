import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-screen-view',
  templateUrl: './screen-view.component.html',
  styleUrls: ['./screen-view.component.scss'],
})
export class ScreenViewComponent {
  @Input() className: string;
  @Input() type: 'loading' | 'no-data' | 'nfc-scan' | 'preferences' | 'qr-scan';
  @Input() message: string;
  @Input() description: string;

  @Input() button: {
    text: string;
    icon?: string;
    iconEnd?: boolean;
    handler?: () => any | void;
  };
}

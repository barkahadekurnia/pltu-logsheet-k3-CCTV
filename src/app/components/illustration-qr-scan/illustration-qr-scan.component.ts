import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-illustration-qr-scan',
  templateUrl: './illustration-qr-scan.component.html',
  styleUrls: ['./illustration-qr-scan.component.scss'],
})
export class IllustrationQrScanComponent {
  @Input() className: string;
  @Input() darkMode: boolean;
}

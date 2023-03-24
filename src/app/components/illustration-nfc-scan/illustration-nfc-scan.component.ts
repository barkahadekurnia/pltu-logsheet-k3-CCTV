import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-illustration-nfc-scan',
  templateUrl: './illustration-nfc-scan.component.html',
  styleUrls: ['./illustration-nfc-scan.component.scss'],
})
export class IllustrationNfcScanComponent {
  @Input() className: string;
  @Input() darkMode: boolean;
}

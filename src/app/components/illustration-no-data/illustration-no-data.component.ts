import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-illustration-no-data',
  templateUrl: './illustration-no-data.component.html',
  styleUrls: ['./illustration-no-data.component.scss'],
})
export class IllustrationNoDataComponent {
  @Input() className: string;
  @Input() darkMode: boolean;
}

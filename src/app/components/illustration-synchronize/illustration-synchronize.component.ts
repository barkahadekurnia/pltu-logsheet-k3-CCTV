import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-illustration-synchronize',
  templateUrl: './illustration-synchronize.component.html',
  styleUrls: ['./illustration-synchronize.component.scss'],
})
export class IllustrationSynchronizeComponent {
  @Input() className: string;
  @Input() darkMode: boolean;
}

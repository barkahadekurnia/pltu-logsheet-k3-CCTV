import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-illustration-progress',
  templateUrl: './illustration-progress.component.html',
  styleUrls: ['./illustration-progress.component.scss'],
})
export class IllustrationProgressComponent {
  @Input() className: string;
  @Input() darkMode: boolean;
}

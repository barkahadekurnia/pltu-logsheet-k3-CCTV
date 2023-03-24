import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-illustration-preferences',
  templateUrl: './illustration-preferences.component.html',
  styleUrls: ['./illustration-preferences.component.scss'],
})
export class IllustrationPreferencesComponent {
  @Input() className: string;
  @Input() darkMode: boolean;
}

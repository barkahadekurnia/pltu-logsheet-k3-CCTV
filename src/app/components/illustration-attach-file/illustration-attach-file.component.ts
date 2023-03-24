import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-illustration-attach-file',
  templateUrl: './illustration-attach-file.component.html',
  styleUrls: ['./illustration-attach-file.component.scss'],
})
export class IllustrationAttachFileComponent {
  @Input() className: string;
  @Input() darkMode: boolean;
}

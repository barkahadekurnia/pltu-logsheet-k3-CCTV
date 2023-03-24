import { Component } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-save-options',
  templateUrl: './save-options.component.html',
  styleUrls: ['./save-options.component.scss'],
})
export class SaveOptionsComponent {
  primaryButton: any;
  remember: boolean;
  secondaryButton: any;

  private id: string;

  constructor(
    private navParams: NavParams,
    private popoverCtrl: PopoverController
  ) {
    this.remember = false;
    this.id = this.navParams.get('id');
  }

  dismissPopover(value: any) {
    const data = {
      type: value,
      remember: this.remember
    };
console.log('alert data',data)
console.log('alert id',this.id)
    this.popoverCtrl.dismiss(data, undefined, this.id);
  }
}

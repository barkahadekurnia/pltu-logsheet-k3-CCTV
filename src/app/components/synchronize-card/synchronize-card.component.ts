import { Component, OnDestroy } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';

export interface SynchronizeCardOptions {
  complexMessage?: any[];
  buttons?: SynchronizeCardButton[];
  observable?: Observable<SynchronizeCardOptions>;
}

export type SynchronizeCardButton = {
  text: string;
  handler: any | void;
};

@Component({
  selector: 'app-synchronize-card',
  templateUrl: './synchronize-card.component.html',
  styleUrls: ['./synchronize-card.component.scss'],
})
export class SynchronizeCardComponent implements OnDestroy {
  options: SynchronizeCardOptions;
  primaryButton: any;
  secondaryButton: any;
  subscription: Subscription;

  constructor(private navParams: NavParams) {
    this.options = this.navParams.get('options');
    [this.primaryButton, this.secondaryButton] = this.options?.buttons || [];

    if (this.options.observable) {
      this.subscription = this.options.observable
        .subscribe((data) => {
          this.options = data;
          [this.primaryButton, this.secondaryButton] = this.options?.buttons || [];
        });
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

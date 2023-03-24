import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { NavController } from '@ionic/angular';
import { SharedService } from 'src/app/services/shared/shared.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  noAuthPages: string[];

  constructor(private navCtrl: NavController, private shared: SharedService) {
    this.noAuthPages = ['/login'];
  }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    if (this.shared.isInitialCheck) {
      await this.shared.getAppData();
    }

    const atNeedAuthPage = !this.noAuthPages.includes(state.url);

    if (
      atNeedAuthPage && this.shared.isAuthenticated
      || !atNeedAuthPage && !this.shared.isAuthenticated
    ) {
      return true;
    }

    console.log('isAuthenticated', this.shared.isAuthenticated);
    console.log('atNeedAuthPage', atNeedAuthPage);
    console.log('noAuthPages', this.noAuthPages);
    this.navCtrl.navigateRoot(atNeedAuthPage ? this.noAuthPages[0] : '/tabs');
    return false;
  }
}

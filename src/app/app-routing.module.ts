import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AppGuard } from './guards/app/app.guard';
import { AuthGuard } from './guards/auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'home',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'settings',
    canActivate: [AppGuard],
    loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule)
  },
  {
    path: 'test-connection',
    canActivate: [AppGuard],
    loadChildren: () => import('./pages/test-connection/test-connection.module').then(m => m.TestConnectionPageModule)
  },
  {
    path: 'rfid-scan',
    canActivate: [AppGuard],
    loadChildren: () => import('./pages/rfid-scan/rfid-scan.module').then(m => m.RfidScanPageModule)
  },
  {
    path: 'app-information',
    canActivate: [AppGuard],
    loadChildren: () => import('./pages/app-information/app-information.module').then(m => m.AppInformationPageModule)
  },
  {
    path: 'activity-logs',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/activity-logs/activity-logs.module').then(m => m.ActivityLogsPageModule)
  },
  {
    path: 'activity-log-details',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/activity-log-details/activity-log-details.module').then(m => m.ActivityLogDetailsPageModule)
  },
  {
    path: 'schedules',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/schedules/schedules.module').then(m => m.SchedulesPageModule)
  },
  {
    path: 'equipment-schedules',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/equipment-schedules/equipment-schedules.module').then(m => m.EquipmentSchedulesPageModule)
  },
  {
    path: 'form-preview',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/form-preview/form-preview.module').then(m => m.FormPreviewPageModule)
  },
  {
    path: 'scan-form',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/scan-form/scan-form.module').then(m => m.ScanFormPageModule)
  },
  {
    path: 'assets',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/assets/assets.module').then(m => m.AssetsPageModule)
  },
  {
    path: 'transactions',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/transactions/transactions.module').then(m => m.TransactionsPageModule)
  },
  {
    path: 'attachment-settings',
    canActivate: [AppGuard],
    loadChildren: () => import('./pages/attachment-settings/attachment-settings.module').then(m => m.AttachmentSettingsPageModule)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfilePageModule)
  },
  {
    path: 'tabs',
    canActivate: [AuthGuard], //secure all child routes
    loadChildren: () => import('./pages/tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'jadwal',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/jadwal/jadwal.module').then(m => m.JadwalPageModule)
  },
  {
    path: 'rfid',
    loadChildren: () => import('./pages/rfid/rfid.module').then(m => m.RfidPageModule)
  },
  {
    path: 'menu',
    loadChildren: () => import('./pages/menu/menu.module').then( m => m.MenuPageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.module').then( m => m.AdminPageModule)
  },
  {
    path: 'change-rfid',
    loadChildren: () => import('./pages/change-rfid/change-rfid.module').then( m => m.ChangeRfidPageModule)
  },
  {
    path: 'akun',
    loadChildren: () => import('./pages/akun/akun.module').then( m => m.AkunPageModule)
  },
  {
    path: 'check',
    loadChildren: () => import('./pages/check/check.module').then( m => m.CheckPageModule)
  },
  {
    path: 'report',
    loadChildren: () => import('./pages/report/report.module').then( m => m.ReportPageModule)
  },
  {
    path: 'asset-category',
    loadChildren: () => import('./pages/asset-category/asset-category.module').then( m => m.AssetCategoryPageModule)
  },
  {
    path: 'schedule-category',
    loadChildren: () => import('./pages/schedule-category/schedule-category.module').then( m => m.ScheduleCategoryPageModule)
  },
  {
    path: 'schedule-detail',
    loadChildren: () => import('./pages/schedule-detail/schedule-detail.module').then( m => m.ScheduleDetailPageModule)
  },
  {
    path: 'schedule-lokasi',
    loadChildren: () => import('./pages/schedule-lokasi/schedule-lokasi.module').then( m => m.ScheduleLokasiPageModule)
  },
  {
    path: 'laporan-harian',
    loadChildren: () => import('./pages/laporan-harian/laporan-harian.module').then( m => m.LaporanHarianPageModule)
  },
  {
    path: 'laporan-harian-detail',
    loadChildren: () => import('./pages/laporan-harian-detail/laporan-harian-detail.module').then( m => m.LaporanHarianDetailPageModule)
  },
  {
    path: 'transaction-detail',
    loadChildren: () => import('./pages/transaction-detail/transaction-detail.module').then( m => m.TransactionDetailPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { JadwalPage } from './jadwal.page';

const routes: Routes = [
  {
    path: '',
    component: JadwalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JadwalPageRoutingModule { }

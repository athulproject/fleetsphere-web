import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Login } from './login/login';
import { DashboardHandler } from './dashboard/dashboard-handler/dashboard-handler';

export const routes: Routes = [
  { path: '', component: Login },
  {
    path: 'dashboard', component: MainLayout,
    children: [
      { path: '', component: DashboardHandler },
      { path: 'dashboard', component: DashboardHandler },
    ],
  },
  { path: '**', redirectTo: '' }
];

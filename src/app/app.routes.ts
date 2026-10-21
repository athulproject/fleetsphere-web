import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Login } from './login/login';
import { DashboardHandler } from './dashboard/dashboard-handler/dashboard-handler';
import { DynamicMasterListComponent } from './dynamic-master/dynamic-master-list.component';
import { DynamicMasterFormComponent } from './dynamic-master/dynamic-master-form.component';
import { MenuMasterComponent } from './menu-master/menu-master.component';
import { authGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  { path: '', component: Login },
  {
    path: ':role',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardHandler },
      { path: 'master/menus', component: MenuMasterComponent },
      { path: 'master/:masterCode', component: DynamicMasterListComponent },
      { path: 'master/:masterCode/create', component: DynamicMasterFormComponent },
      { path: 'master/:masterCode/edit/:id', component: DynamicMasterFormComponent },
      { path: 'employees', component: DashboardHandler },
      { path: 'attendance', component: DashboardHandler },
      { path: 'payroll', component: DashboardHandler },
      { path: 'documents', component: DashboardHandler },
      { path: 'calendar', component: DashboardHandler },
      { path: 'settings', component: DashboardHandler },
    ],
  },
  // Auto-redirect if accessed without role prefix (e.g. /dashboard or /master/hierarchy)
  {
    path: 'dashboard',
    redirectTo: () => {
      const auth = inject(AuthService);
      return `${auth.primaryRole()}/dashboard`;
    },
    pathMatch: 'full',
  },
  {
    path: 'dashboard/master/:masterCode',
    redirectTo: (route) => {
      const auth = inject(AuthService);
      const code = route.params['masterCode'];
      return `${auth.primaryRole()}/master/${code}`;
    },
  },
  {
    path: 'master/:masterCode',
    redirectTo: (route) => {
      const auth = inject(AuthService);
      const code = route.params['masterCode'];
      return `${auth.primaryRole()}/master/${code}`;
    },
  },
  {
    path: 'master/:masterCode/create',
    redirectTo: (route) => {
      const auth = inject(AuthService);
      const code = route.params['masterCode'];
      return `${auth.primaryRole()}/master/${code}/create`;
    },
  },
  {
    path: 'master/:masterCode/edit/:id',
    redirectTo: (route) => {
      const auth = inject(AuthService);
      const code = route.params['masterCode'];
      const id = route.params['id'];
      return `${auth.primaryRole()}/master/${code}/edit/${id}`;
    },
  },
  { path: '**', redirectTo: '' },
];

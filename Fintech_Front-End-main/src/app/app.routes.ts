import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { CompteComponent } from './components/compte/compte.component';
import { ProfilComponent } from './components/profil/profil.component';
import { AideComponent } from './components/aide/aide.component';
import { LoginComponent } from './components/login/login.component';
import { NewAccountComponent } from './components/new-account/new-account.component';
import { authGuard } from './guard/auth.guard';
import { loginGuard } from './guard/login.guard';

export const routes: Routes = [
    { path: '',            redirectTo: '/login',                pathMatch: 'full' },
    { path: 'login',       component: LoginComponent,           title: 'Login',        canActivate: [loginGuard]},
    { path: 'newAccount',  component: NewAccountComponent,      title: 'Register',         canActivate: [loginGuard] },
    { path: 'dashboard',   component: DashboardComponent,       title: 'Dashboard',    canActivate: [authGuard]},
    { path: 'transaction', component: TransactionsComponent,    title: 'Transactions', canActivate: [authGuard] },
    { path: 'compte',      component: CompteComponent,          title: 'Compte',       canActivate: [authGuard] },
    { path: 'profil',      component: ProfilComponent,          title: 'Profil',       canActivate: [authGuard] },
    { path: 'aide',        component: AideComponent,            title: 'Aide',         canActivate: [authGuard] },
    { path: '**',          redirectTo: '/login' }
];

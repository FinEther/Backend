import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { inject } from '@angular/core';

export const loginGuard: CanActivateFn = (route, state) => {  
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  // Redirect to dashboard if already logged in
  router.navigate(['/dashboard']);
  return false;
};

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      if (authService.isLoggedIn()) {
        resolve(true);
      } else {
        router.navigate(['/login']);
        resolve(false);
      }
    }, 100);  //la verification de l'authentification se fait apres une seconde
  });
  
};
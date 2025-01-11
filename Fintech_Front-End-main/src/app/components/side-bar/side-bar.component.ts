import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { UserService } from '../../service/user.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent implements OnInit{
  current: number = 0;
  etat: string[] = ['selected', 'button', 'button', 'button', 'button', 'button'];
  lastone: number = 0;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
      this.findCurrent();
  }

  changeCurrent(choix: number){
    if (this.lastone !== choix){
      this.etat[choix] = 'selected';
      this.etat[this.lastone] = 'button';
      this.lastone = choix;
    }
  }

  findCurrent(){
    this.router.events.subscribe(event =>{
      if(event instanceof NavigationEnd){
        const nom_current: string = event.urlAfterRedirects;
        switch (nom_current){
          case '/dashboard':
            this.current = 0;
            break;
          case '/transaction':
            this.current = 1;
            break;
          case '/compte':
            this.current = 2;
            break;
          case '/profil':
            this.current = 5;
            break;
          case '/aide':
            this.current = 4;
            break;
        }
        if(nom_current.includes('/dashboard')){
          this.current = 0;
        }
        this.changeCurrent(this.current);
      }
    });
  }

  logout(){
    this.authService.logout();
  }

}

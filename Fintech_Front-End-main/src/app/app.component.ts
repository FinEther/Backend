import { AuthService } from './service/auth.service';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBarComponent } from "./components/side-bar/side-bar.component";
import { TopBarComponent } from "./components/top-bar/top-bar.component";
import { HttpClientModule } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { LoginComponent } from "./components/login/login.component";
import { NewAccountComponent } from "./components/new-account/new-account.component";
import { MetaMaskService } from './service/meta-mask.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SideBarComponent, TopBarComponent, HttpClientModule, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'Fintech-Front_end';
  login: boolean = false; //true lorsqu'on a une session
  newAcc: boolean = false;

  constructor(public authService: AuthService, private metaMaskService: MetaMaskService){ }

  ngOnInit(){
    this.login = false;
    this.metaMaskService.connectWallet();
    this.authService.startTokenMonitor(); 
  }

  toNewAcc(nbr: number){
    if(nbr == 1)
      this.newAcc = true;
  }

  ngOnDestroy(): void {
    this.authService.stopTokenMonitor();
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    Swal.fire({
                title: 'Oops...',
                text: "Session expired",
                icon: "info",
                confirmButtonText: 'OK',
                confirmButtonColor: '#064494',
              });
  }

}

import { NotificationService } from './../../service/notification.service';
import { Component, ElementRef, OnInit } from '@angular/core';
import { GraphService } from '../../service/graph.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables)
import 'chartjs-adapter-date-fns';
import {MatTableModule} from '@angular/material/table';
import { NotificationModel } from '../../model/notification-model';
import { NavigationEnd, Router } from '@angular/router';
import { UserService } from '../../service/user.service';
import { User } from '../../model/user';
import { CompteService } from '../../service/compte.service';
import { Compte } from '../../model/compte';
import { TransactionService } from '../../service/transaction.service';
import { MetaMaskService } from '../../service/meta-mask.service';
import { Carte } from '../../model/carte';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit{

  currentFilter: string | undefined;
  notificationData: NotificationModel[] = [];
  displayedColumns: string[] = ['Titre', 'Objet', 'Date'];
  user!: User;
  compte!: Compte;
  nom: string = '404';
  prenom: string = '404';
  numberOfTransactions: number = 0;
  totalAmount: number = 0;
  totalTransactions: number = 0;
  balance: string = "";
  carte: Carte = this.compteService.emptyCarte();

  constructor(
    private graphService: GraphService,
    private notificationService: NotificationService,
    private userService: UserService,
    private compteService: CompteService,
    private transactionService: TransactionService,
    private metaMaskService: MetaMaskService,
  ) {}

  async ngOnInit() {
    this.chargerGraphData();
    this.chargerNotificationData();
    this.user = this.userService.user;
    this.chargerCompte();
    this.nom = this.user.full_name.split(' ')[0].toUpperCase();
    this.prenom = this.user.full_name.split(' ')[1];
    this.numberOfTransactions = this.transactionService.numberOfTransactions;
    this.loadTotalTransactions();
    this.loadTotalAmount();
    this.balance = await this.metaMaskService.getBalance();
    this.carte = await this.compteService.chargerCarte();
    console.log("carte obtenue from dashboard: ", this.carte);
    // setTimeout(() => {//ne marche pas!!!!
    //   this.toNotif();
    // }, 1000);
  }

  // ngAfterViewInit(): void {
  //   setTimeout(() => {//ne marche pas!!!!
  //     this.toNotif();
  //   });
  // }

  // toNotif(){
  //   this.router.events.subscribe(event =>{//ne marche pas!!!!
  //     if( event instanceof NavigationEnd && event.urlAfterRedirects.includes('#notification-element')){
  //       console.log('true');
  //       this.scrollToElement();
  //     }
  //   });
  // }

  // scrollToElement() {//ne marche pas!!!!
  //   console.log('reçut');
  //   const element = this.elementRef.nativeElement.querySelector('#target-element');
    
  //   if (element) {
  //     setTimeout(() => {
  //       element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //       console.log('executé');

  //     }, 1000);
  //   }
  // }

  chargerCompte(){
    this.compteService.getCompte().subscribe(element => {
      if(element){
        this.compte = element[0];
      }
    });
    if(!this.compte)
      this.compte = this.compteService.empty();
  }
  async loadTotalAmount() {
    await this.transactionService.calculateTotalAmount();
    this.totalAmount = this.transactionService.totalAmount;
    console.log('Total Amount in Dashboard:', this.totalAmount);
  }

  async loadTotalTransactions() {
    this.totalTransactions = await this.transactionService.getTotalTransactions();
    console.log('Total Transactions:', this.totalTransactions);
  }

  chargerGraphData(){
    this.graphService.chargeDonneesGraph().subscribe(data =>{
      const dates = data.map(entry => {
        const [day, month, year] = entry.date.split('/');
        return `${year}-${month}-${day}`;
      });
      //const balances = data.map(entry => entry.balance);
      const debitData = data.map(entry => entry.debit);
      const crediData = data.map(entry => entry.credit);
          
      this.renderBalanceGraph();
      this.renderDifferenceGraph(dates, debitData, crediData);
      console.log(data);
    });
    
  }

  chargerNotificationData(){
    this.notificationService.getNotification().subscribe(element =>{
      if(element !== null){
        this.notificationData = element;
      }
    }); 
  }

  renderDifferenceGraph(labelData: string[], debitData: number[], creditData: number[]) {
    const lineGraph = new Chart('differencegraph', {
      type: 'line',
      data: {
        labels: labelData,
        datasets: [
          {
            label: 'Debit',
            data: debitData,
            backgroundColor: 'rgba(6, 62, 148, 0.2)',
            borderColor: 'rgba(6, 62, 148, 0.7)',
            borderWidth: 2,
            fill: true,
          },
          {
            label: 'Credit',
            data: creditData,
            backgroundColor: 'rgba(213, 1, 1, 0.2)',
            borderColor: 'rgba(213, 1, 1, 0.7)',
            borderWidth: 2,
            fill: true,
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          },
          x: {
            type: 'time',
            time: {
              unit: 'day'
            }
          }
        }
      }
    });
  }
  

  renderBalanceGraph() {
    this.metaMaskService.getBalanceHistory('daily').subscribe(
      (balanceHistory: { dates: string[]; balances: number[] }) => {
        const { dates, balances } = balanceHistory;
        console.log('Fetched balance data:', dates, balances);
  
        const balanceGraph = new Chart('balancegraph', {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              {
                label: 'Balance du Compte',
                data: balances,
                borderColor: 'rgba(6, 62, 148, 1)',
                backgroundColor: 'rgba(6, 62, 148, 0.7)',
                fill: true,
                tension: 0.1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: false,
              },
              x: {
                type: 'time',
                time: {
                  unit: 'day',
                },
              },
            },
          },
        });
      },
      (error) => {
        console.error('Error fetching balance history:', error);
      }
    );
  }
  
}
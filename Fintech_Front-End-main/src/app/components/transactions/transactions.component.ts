import { UserService } from './../../service/user.service';
import { TransactionModel } from './../../model/transaction-model';
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../service/transaction.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { NgIf, NgStyle } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MetaMaskService } from '../../service/meta-mask.service';
import { EthereumLog } from '../../model/ethereum-log';
import { firstValueFrom } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HistoryTransactions } from '../../model/meta-mask-hisotry';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [MatTableModule, NgStyle, ReactiveFormsModule, NgIf],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit{
  historique: TransactionModel[] = [];
  dataSource = new MatTableDataSource<TransactionModel>(this.historique);
  displayedColumns: string[] = ['numCompte', 'Montant', 'Date', 'Type'];
  virementForm!: FormGroup;
  factureForm!: FormGroup;
  indice: number = 0;
  column: keyof TransactionModel = 'account_number';
  clicked: boolean = false;


  constructor(
    public transcationService: TransactionService,
    private fb: FormBuilder,
    public metaMaskService: MetaMaskService,
    private userService: UserService
  ) {
    this.virementForm = this.fb.group({
      compte: ['', [Validators.required, ]],
      montant: ['', [Validators.required,]],
      source: ['', Validators.required],
    });
    this.factureForm = this.fb.group({
      facturierID: ['', Validators.required],
      service: ['', Validators.required],
      identifiant: ['', Validators.required],
      codePayement: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      // numCompte: number,
      // montant: number,
      // date: string,
      // type: string,
    });
  }

  async ngOnInit() {
    try {
      // Initialize MetaMask transactions
      await this.transcationService.chargerHistoriqueMeta();
      this.historique = this.transcationService.fromMeta;
      this.dataSource.data = this.historique;
      console.log('Initialized transactions:', this.historique);
    } catch (error) {
      console.error('Error initializing transactions:', error);
    }
  }

  async onSourceHistoriqueChange(event: any) {
    try {
      if (event.target.value === 'wallet') {
        // Refresh MetaMask transactions before displaying
        await this.transcationService.chargerHistoriqueMeta();
        this.historique = await this.transcationService.mapFromMetaToDisplay(
          this.transcationService.fromMeta
        );
      } else if (event.target.value === 'compte') {
        this.historique = await this.loadHistorique();
      }
      this.dataSource.data = this.historique;
    } catch (error) {
      console.error('Error changing source:', error);
    }
  }
  

  loadHistorique(): Promise<TransactionModel[]> {
    return new Promise((resolve, reject) => {
      this.transcationService.getTransaction().subscribe({
        next: (element) => {
          if (element !== null) {
            console.log('Transaction data:', element);
            resolve(element);
          } else {
            reject('No transactions found');
          }
        },
        error: (error) => {
          console.error('Error fetching transactions:', error);
          reject(error);
        }
      });
    });
  }

  // onVirementSubmit() {
  //   if (this.virementForm.valid) {
  //     let entree = this.virementForm.value;
  //     let newVir: TransactionModel = this.transcationService.empty();
  //     newVir.numCompte = entree.compte;
  //     newVir.montant = entree.montant;
  //     newVir.date = this.getCurrentDate();
  //     newVir.type = 'virement';
  //     console.log(newVir);
  //     this.transcationService.sendNewTransaction(newVir);
  //     this.virementForm.reset();
  //   } else {
  //     console.error('Virement Form is invalid');
  //   }
  // }

  // onFactureSubmit() {
  //   if (this.factureForm.valid) {
  //     let entree = this.factureForm.value;
  //     let newVir: TransactionModel = this.transcationService.empty();
  //     newVir.numCompte = entree.facturierID;
  //     newVir.montant = parseFloat((Math.random() * (1000 - 1) + 1).toFixed(2));
  //     newVir.date = this.getCurrentDate();
  //     newVir.data = [entree.service, entree.identifiant, entree.codePayement];
  //     newVir.type = 'facture';
  //     console.log(newVir);
  //     this.transcationService.sendNewTransaction(newVir);
  //     this.factureForm.reset();
  //   } else {
  //     console.error('Facture Form is invalid');
  //   }
  // }

  async onVirementSubmit() {
    if (!this.virementForm.valid){
      console.error('Virement Form is invalid');
      return;
    }
    let transaction = this.mapValuesVirement();
    if(this.virementForm.get('source')?.value === 'wallet'){
      try {
        const receipt = await this.metaMaskService.sendTransaction(transaction);
        Swal.fire({
          title: 'Succès!',
          text: 'hash de la transaction: ' + receipt.transactionHash,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#064494',
          draggable: true
        });
      } catch (error:any) {
        let errorMessage = 'Transaction échouée. Veuillez réessayer.';
    
        if (error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error && error.error && error.error.detail) {
          errorMessage = error.error.detail;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        Swal.fire({
          title: 'Oops...',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#064494',
          draggable: true
        });
      }
    }
    else if(this.virementForm.get('source')?.value === 'carte') {
      await this.transcationService.sendNewTransaction(transaction).subscribe({
        next: (response:any) => {
          Swal.fire({
            title: 'Succès!',
            text: response.message,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#064494',
            draggable: true
          });
        },
        error: (error) => {
          let errorMessage = 'Transaction pas effectuée';
          if (error?.error?.detail?.detail) {
            errorMessage = error.error.detail.detail;
          }
          Swal.fire({
            title: 'Oops...',
            text: errorMessage,
            icon: "error",
            confirmButtonText: 'OK',
            confirmButtonColor: '#064494',
            draggable: true
          });
        },
      });
    }
  }

  async onFactureSubmit() {
    if (!this.factureForm.valid){
      console.error('Facture Form is invalid');
      return;
    }
    let transaction = this.mapFactureValues();
      console.log(transaction);
      await this.transcationService.sendNewTransaction(transaction).subscribe({
        next: (response) => {
          console.log('Success:', response);
          Swal.fire({
            title: 'Succès!',
            text: 'Facture payee avec succès',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4caf50',
            draggable: true
          });
        },
        error: (error) => console.error('Error:', error),
      });
  }

  mapValuesVirement(): TransactionModel {
    const transaction: TransactionModel = {
      account_number: this.virementForm.get('compte')?.value || '',
      amount: parseFloat(this.virementForm.get('montant')?.value || '0'),
      date: this.getCurrentDate(),
    };
  
    return transaction;
  }
  

  mapFactureValues(): TransactionModel {
    let transaction: TransactionModel = this.transcationService.empty();
    transaction.date = this.getCurrentDate();
    transaction.account_number = String(this.factureForm.get('facturierID')?.value || ''),
    transaction.amount = Number(parseFloat((Math.random() * (1000 - 1) + 1).toFixed(2))) || 0.00;
    return transaction;
  }

  getCurrentDate(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0'); // Add leading zero if needed
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const year = now.getFullYear().toString();
  
    return `${day}/${month}/${year}`;
  }

// heavy processing; fetching data from the blockchain it self block by block
  // chargerHistoriqueMeta(){
  //   return this.metaMaskService.getAllTransactions().then((transactions) => {
  //     this.historique = transactions.map((tx) => {
  //       return {
  //         account_number: tx.to,
  //         amount: tx.value,
  //         date: new Date(tx.timeStamp * 1000).toLocaleString()
  //       };
  //     });
  //   }).catch((error) => {
  //     console.error('Error fetching transactions:', error);
  //   });
  // }

  // chargerHistoriqueMeta(): Promise<void> {
  //   const startBlock = 0; // You might want to make this configurable
    
  //   return this.metaMaskService.getTransactions(startBlock)
  //     .then(async (logs: EthereumLog[]) => {
  //       // Filter for relevant transactions and process them
  //       const processedLogs = await Promise.all(logs.map(async (log) => {
  //         try {
  //           // Get transaction details since log.data might not contain the value
  //           const transaction = await this.metaMaskService.getweb3().eth.getTransaction(log.transactionHash);
            
  //           const amount = this.weiToEther(transaction.value);
            
  //           return {
  //             account_number: Number(log.address),
  //             amount: parseFloat(amount),
  //             date: new Date(Number(await this.getBlockTimestamp(log.blockNumber))).toLocaleString(),
  //             hash: log.transactionHash
  //           };
  //         } catch (error) {
  //           console.error('Error processing transaction:', error);
  //           return null;
  //         }
  //       }));
        
  //       // Remove any failed processing attempts
  //       this.historique = processedLogs.filter(entry => entry !== null) as TransactionModel[];
  //     })
  //     .catch((error) => {
  //       console.error('Error fetching transactions:', error);
  //       throw error;
  //     });
  // }
  
  // private weiToEther(value: string): string {
  //   try {
  //     const weiValue = BigInt(value);
  //     const etherValue = Number(weiValue) / 1e18;  // 1 ETH = 10^18 Wei
  //     return etherValue.toFixed(6);
  //   } catch {
  //     return '0.000000';
  //   }
  // }
  
  // private async getBlockTimestamp(blockNumber: number): Promise<string> {
  //   const block = await this.metaMaskService.getweb3().eth.getBlock(blockNumber);
  //   return String(block.timestamp);
  // }

  toggleInvalidClass(input: string) {
    let formInput = this.virementForm.get(input);
    if (formInput?.invalid &&
      (formInput.dirty || formInput.touched)) {
      return true;
    }
    return false;
  }

  toggleInvalidClass2(input: string) {
    let formInput = this.factureForm.get(input);
    if (formInput?.invalid &&
      (formInput.dirty || formInput.touched)) {
      return true;
    }
    return false;
  }

  exportToPdf() {
    const doc = new jsPDF();
    const margin = 10;
    const lineHeight = 10;
    let currentY = margin;

    // Title
    doc.setFontSize(16);
    doc.text('Historique des transactions', margin, currentY);
    currentY += lineHeight;

    // User information
    doc.setFontSize(12);
    doc.text('Utilisateur: ' + this.userService.user.full_name, margin, currentY);
    currentY += lineHeight;

    // Table headers and data
    const tableData = this.historique.map(row => [
      row.account_number,
      row.date,
      row.amount,
    ]);

    const headers = ['N° de compte source', 'Date', 'Montant', 'Type'];

    // Add table to PDF
    autoTable(doc, { 
      head: [headers], 
      body: tableData, 
      startY: currentY,
      theme: 'grid' 
    });

    // Save the PDF
    doc.save(`historique_${this.userService.user.username}.pdf`); 
  }
  
  onTrierClick(){
    this.clicked = true;
    this.column = this.displayedColumns[this.indice] as keyof TransactionModel;
    this.historique = this.historique.sort((a, b) => {
      return a[this.column] > b[this.column] ? 1 : -1;
    });
    this.dataSource.data = this.historique;
    this.indice++;
    if(this.indice === this.displayedColumns.length){
      this.indice = 0;
    }
  }

}

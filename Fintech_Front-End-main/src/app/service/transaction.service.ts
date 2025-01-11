import { NewTransactionModel } from './../model/new-transaction-model';
import { HttpClient, HttpResponse,HttpHeaders} from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { TransactionModel } from '../model/transaction-model';
import { MetaMaskService } from './meta-mask.service';
import { HistoryTransactions } from '../model/meta-mask-hisotry';
import { EthereumLog } from '../model/ethereum-log';

@Injectable({
  providedIn: 'root'
})
export class TransactionService implements OnInit {
  url: string = window.env?.GATEWAY_URL || 'http://localhost:8005';
  fromMeta: TransactionModel[] = [];
  address: Promise<string | null> = Promise.resolve(null);
  numberOfTransactions: number = 0;
  totalAmount: number = 0;

  constructor(private http: HttpClient, private metaMaskService: MetaMaskService) {
    this.ngOnInit();
   }

  async ngOnInit() {
    this.address = firstValueFrom(this.metaMaskService.account$);
    await this.chargerHistoriqueMeta();
    this.getTotalTransactions();
  }

  getTransaction(): Observable<TransactionModel[]> {
    const token = localStorage.getItem('access_token');
  
    if (!token) {
      throw new Error('No token found');
    }
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  
    return this.http.get<TransactionModel[]>(`${this.url}/transactions/history`, { headers });
  }

  sendNewTransaction(newTransaction: TransactionModel): Observable<TransactionModel> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<TransactionModel>(`${this.url}/transaction/simple`, newTransaction, { headers });
  }

  empty(): TransactionModel{
    let empty: TransactionModel = {
      account_number: "404",
      amount: 404,
      date: "04/04/4040",
    };
    return empty;
  }

  async mapFromMetaToDisplay(fromMeta: TransactionModel[]): Promise<TransactionModel[]> {
    const address = await this.address;
    return fromMeta.map((tx: TransactionModel) => ({
      account_number: tx.account_number,
      amount: tx.amount,
      date: tx.date
    }));
  }
  
  
  private formatEtherValue(value: string): string {
    try {
      const weiValue = BigInt(value);
      const etherValue = Number(weiValue) / 1e18;
      return `${etherValue.toFixed(6)}`;
    } catch {
      return '0.000000';
    }
  }


async calculateTotalAmount(): Promise<void> {
  try {
    const transactions = await firstValueFrom(this.getTransaction());
    this.totalAmount = transactions.reduce((total, transaction) => {
      const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;

      return total + amount;


      return total;
    }, 0);

    console.log('Total Amount:', this.totalAmount);

  } catch (error) {
    console.error('Error calculating total amount:', error);
    this.totalAmount = 0;
  }
}
async getTotalTransactions(): Promise<number> {
  try {
    const transactions = await firstValueFrom(this.getTransaction());
    return transactions.length;
  } catch (error) {
    console.error('Error fetching total transactions:', error);
    return 0;
  }
}
  
async chargerHistoriqueMeta(): Promise<TransactionModel[]> {
  try {
    const account = await this.address || await this.metaMaskService.connectWallet();
    if (!account) {
      console.error('No MetaMask account connected');
      return [];
    }

    const startBlock = 0;
    const logs = await this.metaMaskService.getTransactions(startBlock);
    console.log('Transaction Logs:', logs);
    
    if (!Array.isArray(logs) || logs.length === 0) {
      console.log('No MetaMask transactions found');
      return [];
    }

    const processedTransactions = await Promise.all(
      logs.map(async (log) => {
        try {
          const transaction = await this.metaMaskService.getweb3().eth.getTransaction(log.transactionHash);
          const block = await this.metaMaskService.getweb3().eth.getBlock(log.blockNumber);
          
          return {
            account_number: transaction.from,
            amount: parseFloat(this.formatEtherValue(transaction.value)),
            date: new Date(Number(block.timestamp) * 1000).toLocaleDateString(),
          };
        } catch (error) {
          console.error('Error processing transaction:', error);
          return null;
        }
      })
    );

    this.fromMeta = processedTransactions.filter((tx): tx is TransactionModel => tx !== null);
    console.log('Loaded MetaMask transactions:', this.fromMeta);
    return this.fromMeta;

  } catch (error) {
    console.error('Error loading MetaMask transactions:', error);
    return [];
  }
}


}

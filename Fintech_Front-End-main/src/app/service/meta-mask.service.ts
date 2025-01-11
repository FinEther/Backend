import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, firstValueFrom ,Observable } from 'rxjs';
import Web3 from 'web3';
import { isAddress } from 'web3-validator';
import { TransactionModel } from '../model/transaction-model';

@Injectable({
  providedIn: 'root'
})
export class MetaMaskService{
  private web3 = new Web3("https://sepolia.infura.io/v3/43a3ba8d63244b2282f9ce50292466a0");
  private account = new BehaviorSubject<string | null>(null);
  
  account$ = this.account.asObservable();

  public getweb3(): Web3 {
    if (!this.web3) {
      throw new Error('Web3 is not initialized');
    }
    return this.web3;
  }

  async connectWallet(): Promise<boolean> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[] | undefined;
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.web3 = new Web3(window.ethereum);
      this.account.next(accounts[0]);
      console.log('Connected to MetaMask:');

      window.ethereum.on('accountsChanged', (...args: unknown[]) => {
        const accounts = args as string[];
        this.account.next(accounts[0] || null);
      });

      return true;
    } catch (error) {
      console.error('Failed to connect to MetaMask:', error);
      return false;
    }
  }
  getBalanceHistory(interval: 'hourly' | 'daily'): Observable<{ dates: string[]; balances: number[] }> {
    return new Observable((observer) => {
      this.fetchBalanceHistory(interval).then(
        (balanceHistory) => {
          observer.next(balanceHistory);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  private async fetchBalanceHistory(
    interval: 'hourly' | 'daily'
  ): Promise<{ dates: string[]; balances: number[] }> {
    if (!this.web3) {
      throw new Error('Web3 is not initialized');
    }
    if (this.account.value === null) {
      throw new Error('Wallet not connected');
    }

    const balanceHistory: { dates: string[]; balances: number[] } = {
      dates: [],
      balances: [],
    };

    const currentBlock = await this.web3.eth.getBlockNumber();
    const currentTime = new Date().getTime();
    const intervalMs = interval === 'hourly' ? 3600000 : 86400000;
    const blocksPerInterval = BigInt(Math.floor(intervalMs / 15000));

    for (let i = 0; i < 24; i++) {
      const timestamp = currentTime - i * intervalMs;
      const date = new Date(timestamp).toISOString().slice(0, 10);
      balanceHistory.dates.unshift(date);

      const blockOffset = blocksPerInterval * BigInt(i);
      const blockNumber = currentBlock - blockOffset;
      
      try {
        const balance = await this.web3.eth.getBalance(
          this.account.value,
          blockNumber
        );
        balanceHistory.balances.unshift(
          parseFloat(this.web3.utils.fromWei(balance, 'ether'))
        );
      } catch (error) {
        console.error(`Error fetching balance at block ${blockNumber}:`, error);
        balanceHistory.balances.unshift(
          balanceHistory.balances.length > 0 
            ? balanceHistory.balances[balanceHistory.balances.length - 1]
            : 0
        );
      }
    }

    return balanceHistory;
  }
 
  async getBalance(): Promise<string> {
    if (!this.web3) {
      throw new Error('Web3 is not initialized');
    }
    if (this.account.value === null) {
      throw new Error('Wallet not connected');
    }
    
    const balance = await this.web3.eth.getBalance(this.account.value);
    return this.web3.utils.fromWei(balance, 'ether');
  }
  


  
  async signMessage(message: string): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
  
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    }) as string[];
    const address = accounts[0];
  
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    }) as string;
  
    console.log('Address:', address);
    console.log('Message:', message);
    console.log('Signature:', signature);
  
    return signature;
  }
  
  
  
  isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  async sendTransaction(transaction: TransactionModel): Promise<any> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    }) as string[];
    const address = accounts[0];
    const senderAddress = address.toLowerCase();
    const receiverAddress = transaction.account_number.toLowerCase();
  

    if (senderAddress === receiverAddress) {
      throw new Error('Cannot send transaction to yourself');
    }
    const receipt = await this.web3.eth.sendTransaction({
      from: senderAddress,
      to: receiverAddress,
      value: this.web3.utils.toWei(transaction.amount.toString(), 'ether')
    });
    
    return receipt;
  }

  
  async getTransactions(startBlock: number = 0): Promise<any[]> {
    if (!this.web3 || !this.account.value) {
      throw new Error('Wallet not connected');
    }
    const latestBlock = await this.web3.eth.getBlockNumber();
    return await this.web3.eth.getPastLogs({
      fromBlock: startBlock,
      toBlock: latestBlock,
      address: this.account.value
    });
  }
  async getAllTransactions(): Promise<any[]> {
    if (!this.web3) {
      const connected = await this.connectWallet();
      if (!connected) {
        console.error("Web3 not initialized");
        return [];
      }
    }
    const address = await firstValueFrom(this.account$);
    if (!address) {
      console.error("Address not found");
      return [];
    }
    

    const transactions: any[] = [];
    let currentBlock = BigInt(await this.web3!.eth.getBlockNumber());

    const maxBlocksToScan = 500;
    const blocksPerRequest = 100;

    try {
      while (transactions.length < 100 && currentBlock > 0 && currentBlock > (await this.web3!.eth.getBlockNumber()) - BigInt(maxBlocksToScan)) {
        const fromBlock = Math.max(0, Number(currentBlock - BigInt(blocksPerRequest) + BigInt(1)));
        console.log(`Scanning blocks ${fromBlock} to ${currentBlock}`);

        const blockPromises = [];
        for (let i = fromBlock; i <= currentBlock; i++) {
          blockPromises.push(this.web3!.eth.getBlock(i, true));
        }
        const blocks = await Promise.all(blockPromises);

        for (const block of blocks) {
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx !== 'string' && (tx.from.toLowerCase() === address.toLowerCase() || tx.to?.toLowerCase() === address.toLowerCase())) {
                transactions.push(tx);
              }
            }
          }
        }
        currentBlock = BigInt(fromBlock) - BigInt(1);
      }

    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
    return transactions;
  }

}
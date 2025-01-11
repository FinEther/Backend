import { MetaMaskInpageProvider } from '@metamask/providers';

declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
    env: {
      GATEWAY_URL: string;
    }
  }
}
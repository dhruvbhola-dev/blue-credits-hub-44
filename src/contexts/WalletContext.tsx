import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getWalletAddress, getProvider } from '@/contracts/contract';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  walletAddress: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Try to connect wallet on load if user has it saved
    if (profile?.wallet_address) {
      checkWalletConnection();
    }
  }, [profile]);

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum && profile?.wallet_address) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.includes(profile.wallet_address)) {
          setWalletAddress(profile.wallet_address);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask Required',
        description: 'Please install MetaMask to connect your wallet',
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Get provider and ensure correct network
      await getProvider();
      
      // Get wallet address
      const address = await getWalletAddress();
      setWalletAddress(address);
      setIsConnected(true);

      // Save wallet address to user profile
      if (profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ wallet_address: address })
          .eq('id', profile.id);

        if (error) {
          console.error('Error saving wallet address:', error);
        }
      }

      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to MetaMask on Sepolia network'
      });

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setIsConnected(false);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletAddress('');
    setIsConnected(false);
  };

  const refreshWallet = async () => {
    if (isConnected) {
      await connectWallet();
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== walletAddress) {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [walletAddress]);

  const value: WalletContextType = {
    walletAddress,
    isConnected,
    isConnecting,
    connectWallet,
    disconnect,
    refreshWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
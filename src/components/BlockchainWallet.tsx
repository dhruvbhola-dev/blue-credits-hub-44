import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, RefreshCw, ExternalLink } from 'lucide-react';
import { 
  getWalletAddress, 
  getSellerData, 
  getBuyerCredits, 
  getVerifierAddress 
} from '@/contracts/contract';

interface BlockchainWalletProps {
  userRole?: string;
  autoRefresh?: boolean;
}

const BlockchainWallet: React.FC<BlockchainWalletProps> = ({ 
  userRole, 
  autoRefresh = true 
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [sellerData, setSellerData] = useState<any>(null);
  const [buyerCredits, setBuyerCredits] = useState<number>(0);
  const [verifierAddress, setVerifierAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      fetchWalletData();
      const interval = setInterval(fetchWalletData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      // Get wallet address
      const address = await getWalletAddress();
      setWalletAddress(address);
      setConnected(true);

      // Update user profile with wallet address if user is logged in
      if (profile?.id && address) {
        await supabase
          .from('profiles')
          .update({ wallet_address: address })
          .eq('id', profile.id);
      }

      // Get verifier address for comparison
      const verifier = await getVerifierAddress();
      setVerifierAddress(verifier);

      // Fetch role-specific data
      if (userRole === 'ngo' || userRole === 'localpeople') {
        const seller = await getSellerData(address);
        setSellerData({
          hasSubmitted: seller[0],
          credits: Number(seller[1]),
          forSale: Number(seller[2])
        });
      }

      if (userRole === 'company') {
        const credits = await getBuyerCredits(address);
        setBuyerCredits(Number(credits));
      }

    } catch (error: any) {
      console.error('Error fetching wallet data:', error);
      setConnected(false);
      toast({
        title: 'Wallet Error',
        description: error.message || 'Failed to connect to wallet',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      await fetchWalletData();
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to MetaMask'
      });
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive'
      });
    }
  };

  const openEtherscan = () => {
    if (walletAddress) {
      window.open(`https://sepolia.etherscan.io/address/${walletAddress}`, '_blank');
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Blockchain Wallet
          </span>
          <div className="flex items-center space-x-2">
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWalletData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Your blockchain wallet status and carbon credit balance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!connected ? (
          <div className="text-center py-4">
            <Button onClick={connectWallet} disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Wallet Address */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Wallet Address:</span>
                <Button variant="ghost" size="sm" onClick={openEtherscan}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
              <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                {walletAddress}
              </div>
              {walletAddress === verifierAddress && (
                <Badge variant="outline" className="text-xs">
                  Official Verifier
                </Badge>
              )}
            </div>

            {/* Role-specific information */}
            {(userRole === 'ngo' || userRole === 'localpeople') && sellerData && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{sellerData.credits}</div>
                  <div className="text-xs text-muted-foreground">Total Credits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sellerData.forSale}</div>
                  <div className="text-xs text-muted-foreground">For Sale</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {sellerData.credits - sellerData.forSale}
                  </div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </div>
            )}

            {userRole === 'company' && (
              <div className="text-center pt-4 border-t">
                <div className="text-3xl font-bold text-primary">{buyerCredits}</div>
                <div className="text-sm text-muted-foreground">Purchased Credits</div>
              </div>
            )}

            {userRole === 'verifier' && (
              <div className="pt-4 border-t">
                <Badge variant="outline" className="w-full justify-center py-2">
                  Official Carbon Credit Verifier
                </Badge>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockchainWallet;
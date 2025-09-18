import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Store, Users, TrendingUp } from 'lucide-react';
import { getContract, getContractReadOnly, getWalletAddress } from '@/contracts/contract';
import { supabase } from '@/integrations/supabase/client';

interface Seller {
  address: string;
  credits: number;
  forSale: number;
  profile?: {
    full_name: string;
    organization?: string;
  };
}

const Marketplace = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingLoading, setBuyingLoading] = useState<{[key: string]: boolean}>({});
  const [buyAmounts, setBuyAmounts] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      // Get all profiles to map addresses to names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, organization')
        .in('role', ['ngo', 'localpeople']);

      const contract = await getContractReadOnly();
      const sellersData: Seller[] = [];

      for (const profileData of profiles || []) {
        try {
          // For demo purposes, we'll use a mock address based on user ID
          const mockAddress = `0x${profileData.id.replace(/-/g, '').substring(0, 40)}`;
          
          const sellerInfo = await contract.sellers(mockAddress);
          if (sellerInfo.forSale > 0) {
            sellersData.push({
              address: mockAddress,
              credits: Number(sellerInfo.credits),
              forSale: Number(sellerInfo.forSale),
              profile: {
                full_name: profileData.full_name,
                organization: profileData.organization
              }
            });
          }
        } catch (error) {
          // Skip this seller if blockchain call fails
        }
      }

      setSellers(sellersData);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (sellerAddress: string, amount: number) => {
    setBuyingLoading(prev => ({ ...prev, [sellerAddress]: true }));
    
    try {
      const contract = await getContract();
      const tx = await contract.buy(sellerAddress, amount, {
        value: amount // 1 wei per credit as per contract
      });
      
      toast({
        title: 'Transaction Submitted',
        description: 'Waiting for blockchain confirmation...',
      });
      
      await tx.wait();
      
      toast({
        title: 'Success',
        description: `Successfully purchased ${amount} credits!`,
      });
      
      // Refresh the sellers list
      await fetchSellers();
      setBuyAmounts(prev => ({ ...prev, [sellerAddress]: '' }));
      
    } catch (error: any) {
      console.error('Buy credits failed:', error);
      toast({
        title: 'Transaction Failed',
        description: error.message || 'Failed to purchase credits',
        variant: 'destructive'
      });
    } finally {
      setBuyingLoading(prev => ({ ...prev, [sellerAddress]: false }));
    }
  };

  if (profile?.role !== 'company') {
    return (
      <div className="text-center py-12">
        <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">
          This page is only accessible to companies.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carbon Credits Marketplace</h1>
          <p className="text-muted-foreground">
            Purchase verified carbon credits from certified projects
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Store className="w-4 h-4 mr-2" />
          {sellers.length} Sellers
        </Badge>
      </div>

      {sellers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Credits Available</h2>
            <p className="text-muted-foreground">
              There are no carbon credits available for purchase at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {sellers.map((seller) => (
            <Card key={seller.address} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      {seller.profile?.full_name || 'Unknown Seller'}
                    </CardTitle>
                    <CardDescription>
                      {seller.profile?.organization && (
                        <span className="text-sm">{seller.profile.organization}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {seller.forSale} Available
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Seller Address:</strong></p>
                    <p className="font-mono text-xs break-all">{seller.address}</p>
                  </div>
                  <div>
                    <p><strong>Total Credits:</strong> {seller.credits} tCO₂e</p>
                    <p><strong>For Sale:</strong> {seller.forSale} tCO₂e</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 pt-4 border-t">
                  <Input
                    type="number"
                    placeholder="Amount to buy"
                    min="1"
                    max={seller.forSale}
                    value={buyAmounts[seller.address] || ''}
                    onChange={(e) => setBuyAmounts(prev => ({
                      ...prev,
                      [seller.address]: e.target.value
                    }))}
                    className="w-32"
                  />
                  
                  <Button
                    onClick={() => {
                      const amount = parseInt(buyAmounts[seller.address] || '0');
                      if (amount > 0 && amount <= seller.forSale) {
                        handleBuyCredits(seller.address, amount);
                      } else {
                        toast({
                          title: 'Invalid Amount',
                          description: 'Please enter a valid amount to purchase',
                          variant: 'destructive'
                        });
                      }
                    }}
                    disabled={buyingLoading[seller.address] || !buyAmounts[seller.address]}
                    className="flex items-center"
                  >
                    {buyingLoading[seller.address] ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Buy Credits
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Cost: {buyAmounts[seller.address] || '0'} wei
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
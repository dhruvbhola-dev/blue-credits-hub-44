import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Store, Users, TrendingUp, MapPin, Award, Download } from 'lucide-react';
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
  project?: {
    id: string;
    title?: string;
    location?: string;
  };
  certificate?: {
    id: string;
    certificate_url?: string;
  } | null;
  price_per_credit: number;
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
      // Get all profiles with wallet addresses that could have credits
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          organization,
          wallet_address,
          projects!projects_owner_id_fkey (
            id,
            title,
            location,
            status
          ),
          certificates!certificates_generated_by_fkey (
            id,
            certificate_url,
            project_id
          )
        `)
        .not('wallet_address', 'is', null);

      if (profilesError) throw profilesError;

      const sellersData: Seller[] = [];

      // Check blockchain state for each profile with a wallet address
      for (const profile of profiles || []) {
        if (!profile.wallet_address) continue;

        try {
          const contract = await getContractReadOnly();
          const sellerInfo = await contract.sellers(profile.wallet_address);
          const blockchainCredits = Number(sellerInfo.credits);
          const blockchainForSale = Number(sellerInfo.forSale);

          // Only include sellers who have credits for sale on blockchain
          if (blockchainForSale > 0) {
            // Find a verified project for this seller
            const verifiedProject = profile.projects?.find(p => p.status === 'verified');
            const certificate = profile.certificates?.find(c => c.project_id === verifiedProject?.id);

            sellersData.push({
              address: profile.wallet_address,
              credits: blockchainCredits,
              forSale: blockchainForSale,
              profile: {
                full_name: profile.full_name,
                organization: profile.organization
              },
              project: verifiedProject ? {
                id: verifiedProject.id,
                title: verifiedProject.title,
                location: verifiedProject.location
              } : undefined,
              certificate: certificate || null,
              price_per_credit: 0.001 // Default price, could be made configurable
            });
          }
        } catch (error) {
          console.error(`Failed to get blockchain data for ${profile.full_name}:`, error);
          // Skip this seller if blockchain data can't be fetched
        }
      }

      setSellers(sellersData);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace data from blockchain',
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
      // Calculate the cost based on the seller's price
      const seller = sellers.find(s => s.address === sellerAddress);
      const costInWei = Math.floor(amount * (seller?.price_per_credit || 0.001) * 1e18);
      
      const tx = await contract.buy(sellerAddress, amount, {
        value: costInWei
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
                <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p><strong>Project:</strong> {seller.project?.title || 'N/A'}</p>
                    {seller.project?.location && (
                      <p className="flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {seller.project.location}
                      </p>
                    )}
                  </div>
                  <div>
                    <p><strong>Credits Available:</strong> {seller.forSale} tCO₂e</p>
                    <p><strong>Price:</strong> {seller.price_per_credit} ETH per credit</p>
                  </div>
                </div>

                {seller.certificate && (
                  <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg mb-4">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-sm font-medium">Verified Certificate Available</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (seller.certificate?.certificate_url) {
                          window.open(seller.certificate.certificate_url, '_blank');
                        } else {
                          toast({
                            title: 'Certificate',
                            description: 'Certificate generated and verified in system',
                          });
                        }
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      View Certificate
                    </Button>
                  </div>
                )}

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
                    className="w-40"
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
                    className="flex items-center bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {buyingLoading[seller.address] ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Buy Credits Now
                      </>
                    )}
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    <p>Cost: {((parseFloat(buyAmounts[seller.address] || '0')) * seller.price_per_credit).toFixed(6)} ETH</p>
                    <p>({buyAmounts[seller.address] || '0'} credits × {seller.price_per_credit} ETH)</p>
                  </div>
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
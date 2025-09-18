import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import CarbonMap from '@/components/Map/CarbonMap';
import { TrendingUp, Leaf, Award, BarChart3, Wallet } from 'lucide-react';
import { getContractReadOnly, getWalletAddress } from '@/contracts/contract';

interface CarbonCredit {
  id: string;
  credits_amount: number;
  status: string;
  created_at: string;
  projects: {
    title: string;
    location: string;
  };
}

const CarbonTracker = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockchainBalance, setBlockchainBalance] = useState({
    sellerCredits: '0',
    ownedCredits: '0'
  });

  useEffect(() => {
    if (profile) {
      fetchCredits();
      fetchBlockchainBalance();
    }
  }, [profile]);

  const fetchBlockchainBalance = async () => {
    try {
      const contract = await getContractReadOnly();
      const walletAddress = await getWalletAddress();
      
      const sellerData = await contract.sellers(walletAddress);
      const buyerCredits = await contract.buyers(walletAddress);
      
      setBlockchainBalance({
        sellerCredits: sellerData.credits.toString(),
        ownedCredits: buyerCredits.toString()
      });
    } catch (error) {
      console.error('Error fetching blockchain balance:', error);
    }
  };

  const fetchCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('carbon_credits')
        .select(`
          *,
          projects (
            title,
            location
          )
        `)
        .eq('owner_id', profile?.id);

      if (error) throw error;
      setCredits(data || []);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carbon Credit Tracker</h1>
          <p className="text-muted-foreground">
            Monitor your carbon credits and environmental impact
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">My Credits</p>
                <p className="text-2xl font-bold text-primary">{blockchainBalance.sellerCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-secondary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Purchased Credits</p>
                <p className="text-2xl font-bold text-secondary">{blockchainBalance.ownedCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-accent" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{credits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle>Tree Plantation Locations</CardTitle>
          <CardDescription>
            Interactive map showing verified tree plantation sites and carbon credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CarbonMap />
        </CardContent>
      </Card>

      {/* Certificate Section - only visible to Admin, NGO, Panchayat */}
      {profile?.role && ['admin', 'ngo', 'panchayat'].includes(profile.role) && (
        <Card>
          <CardHeader>
            <CardTitle>Certificate Generation</CardTitle>
            <CardDescription>
              Generate certificates for verified projects (requires verifier approval)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Certificates can only be generated after project verification is complete.
            </p>
            <Button disabled variant="outline">
              Certificate Generation (Pending Implementation)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CarbonTracker;
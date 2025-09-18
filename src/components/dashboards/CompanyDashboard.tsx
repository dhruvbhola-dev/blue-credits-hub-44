import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, TrendingUp, ShoppingCart, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBuyerCredits, getWalletAddress } from '@/contracts/contract';

const CompanyDashboard = () => {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCredits: 0,
    availableProjects: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchCompanyData();
    }
  }, [profile]);

  const fetchCompanyData = async () => {
    if (!profile) return;

    try {
      // Get blockchain credits for this company
      let blockchainCredits = 0;
      try {
        const walletAddress = await getWalletAddress();
        blockchainCredits = await getBuyerCredits(walletAddress);
      } catch (error) {
        console.log('Could not fetch blockchain data:', error);
      }

      // Fetch available projects in marketplace
      const { data: marketplaceData } = await supabase
        .from('marketplace_listings')
        .select('credits_amount')
        .eq('status', 'active');

      const availableProjects = marketplaceData?.length || 0;

      setStats({
        totalCredits: Number(blockchainCredits),
        availableProjects,
        totalSpent: 0 // This would come from actual purchase history
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {t('dashboard.welcomeBack')}, {profile?.full_name}!
          </h2>
          <p className="text-muted-foreground">Manage your carbon credit purchases and sustainability goals</p>
        </div>
        <Button onClick={() => navigate('/marketplace')} className="bg-gradient-to-r from-primary to-green-secondary">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Owned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalCredits}</div>
            <p className="text-xs text-muted-foreground">tCO₂e in your portfolio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.availableProjects}</div>
            <p className="text-xs text-muted-foreground">In marketplace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpent.toFixed(6)} ETH</div>
            <p className="text-xs text-muted-foreground">Total spent on credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary" onClick={() => navigate('/marketplace')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Browse Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explore verified carbon credit projects from NGOs and purchase credits directly.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-secondary" onClick={() => navigate('/carbon-tracker')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Track Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor your carbon credit portfolio and environmental impact metrics.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Preview</CardTitle>
          <CardDescription>
            Available carbon credit projects ready for purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Visit the marketplace to see verified projects and purchase carbon credits directly from NGOs.
            </p>
            <Button onClick={() => navigate('/marketplace')}>
              View All Available Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;
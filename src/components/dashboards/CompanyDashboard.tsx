import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, TrendingUp, ShoppingCart, Clock, CheckCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBuyerCredits, getWalletAddress } from '@/contracts/contract';

interface PurchaseRequest {
  id: string;
  project_id: string;
  amount: number;
  total_cost: number;
  status: string;
  created_at: string;
  seller_id: string;
  projects?: {
    title: string;
    location: string;
  };
}

const CompanyDashboard = () => {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [stats, setStats] = useState({
    totalCredits: 0,
    pendingRequests: 0,
    approvedRequests: 0,
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

      // Fetch company's purchase requests
      const { data: requestsData } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          projects (
            title,
            location
          )
        `)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      const pendingRequests = requestsData?.filter(r => r.status === 'pending').length || 0;
      const approvedRequests = requestsData?.filter(r => r.status === 'approved').length || 0;
      const totalSpent = requestsData?.filter(r => r.status === 'approved').reduce((sum, r) => sum + Number(r.total_cost), 0) || 0;

      if (requestsData) {
        setPurchaseRequests(requestsData);
      }

      setStats({
        totalCredits: Number(blockchainCredits),
        pendingRequests,
        approvedRequests,
        totalSpent
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting NGO approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Purchases</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedRequests}</div>
            <p className="text-xs text-muted-foreground">Successful transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpent.toFixed(6)} ETH</div>
            <p className="text-xs text-muted-foreground">Total investment</p>
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
              Explore verified carbon credit projects from NGOs and request credits.
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

      {/* Purchase Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Your Purchase Requests</CardTitle>
          <CardDescription>
            Track the status of your carbon credit purchase requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseRequests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Requests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by browsing the marketplace and requesting credits from NGOs.
              </p>
              <Button onClick={() => navigate('/marketplace')}>
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchaseRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                  <div>
                    <h4 className="font-semibold">{request.projects?.title || 'Unknown Project'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {request.projects?.location} • {request.amount} credits • {request.total_cost.toFixed(6)} ETH
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                    <p className="text-sm text-muted-foreground mt-1">
                      From: {request.seller_id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;
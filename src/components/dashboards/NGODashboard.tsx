import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Award, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  location: string;
  area_hectares: number;
  status: string;
  estimated_credits: number;
  created_at: string;
  owner_id: string;
}

const NGODashboard = () => {
  const { profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    verifiedProjects: 0,
    totalCredits: 0,
    pendingCredits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchNGOData();
    }
  }, [profile]);

  const fetchNGOData = async () => {
    if (!profile) return;

    try {
      // Fetch NGO's projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false });

      // Get blockchain credits for this NGO
      let blockchainCredits = 0;
      try {
        const { getSellerData, getWalletAddress } = await import('@/contracts/contract');
        const walletAddress = await getWalletAddress();
        const sellerData = await getSellerData(walletAddress);
        blockchainCredits = Number(sellerData[1]); // Credits from smart contract
      } catch (error) {
        console.log('Could not fetch blockchain data:', error);
      }

      // Fetch NGO's carbon credits from database
      const { data: creditsData } = await supabase
        .from('carbon_credits')
        .select('credits_amount, status')
        .eq('owner_id', profile.id);

      const dbCredits = creditsData?.reduce((sum, credit) => sum + Number(credit.credits_amount), 0) || 0;
      const totalCredits = blockchainCredits + dbCredits; // Combine blockchain and database credits
      
      const verifiedProjects = projectsData?.filter(p => p.status === 'verified').length || 0;
      const pendingCredits = projectsData?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.estimated_credits), 0) || 0;

      if (projectsData) {
        const mappedProjects: Project[] = projectsData.map(project => ({
          id: project.id,
          title: project.title,
          location: project.location,
          area_hectares: project.area_hectares,
          status: project.status,
          estimated_credits: project.estimated_credits || 0,
          created_at: project.created_at,
          owner_id: project.owner_id
        }));
        setProjects(mappedProjects);
      }

      setStats({
        totalProjects: projectsData?.length || 0,
        verifiedProjects,
        totalCredits,
        pendingCredits
      });
    } catch (error) {
      console.error('Error fetching NGO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
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
          <p className="text-muted-foreground">Manage your environmental projects and carbon credits</p>
        </div>
        <Button onClick={() => navigate('/reporting')} className="bg-gradient-to-r from-primary to-green-secondary">
          <Plus className="w-4 h-4 mr-2" />
          Submit New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => navigate('/reporting')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalProjects')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Click to submit new</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Projects</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verifiedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully verified</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => navigate('/carbon-tracker')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalCredits')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Click to view tracker</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.pendingVerification')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary" onClick={() => navigate('/reporting')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              {t('reporting.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Submit new plantation or restoration projects for carbon credit generation.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-secondary" onClick={() => navigate('/carbon-tracker')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              {t('navigation.carbonTracker')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor your carbon credit portfolio and environmental impact.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and download certificates for your verified projects.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>
            Track the status of your submitted projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by submitting your first environmental project.
              </p>
              <Button onClick={() => navigate('/reporting')}>
                Submit Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                  <div>
                    <h4 className="font-semibold">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.location} • {project.area_hectares} hectares
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(project.status)}
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.estimated_credits} credits
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

export default NGODashboard;
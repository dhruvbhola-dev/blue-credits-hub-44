import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileText, Award, Eye, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contractCode } from '@/utils/dummyData';

interface Project {
  id: string;
  title: string;
  location: string;
  area_hectares: number;
  description: string;
  status: string;
  estimated_credits: number;
  created_at: string;
  owner_id: string;
  profiles?: {
    full_name: string;
    organization?: string;
  };
}

const VerifierDashboard = () => {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showContract, setShowContract] = useState(false);
  const [stats, setStats] = useState({
    pendingReviews: 0,
    verifiedProjects: 0,
    rejectedProjects: 0,
    totalReviewed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifierData();
  }, []);

  const fetchVerifierData = async () => {
    try {
      const { data: pendingData } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_owner_id_fkey (
            full_name,
            organization
          )
        `)
        .in('status', ['pending'])
        .order('created_at', { ascending: true });

      const { data: allProjects } = await supabase
        .from('projects')
        .select('status')
        .not('verifier_id', 'is', null);

      const verifiedCount = allProjects?.filter(p => p.status === 'verified').length || 0;
      const rejectedCount = allProjects?.filter(p => p.status === 'rejected').length || 0;

      if (pendingData) {
        const mappedProjects: Project[] = pendingData.map(project => ({
          id: project.id,
          title: project.title,
          location: project.location,
          area_hectares: project.area_hectares,
          description: project.description || '',
          status: project.status,
          estimated_credits: project.estimated_credits || 0,
          created_at: project.created_at,
          owner_id: project.owner_id,
          profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles
        }));
        setPendingProjects(mappedProjects);
      }

      setStats({
        pendingReviews: pendingData?.length || 0,
        verifiedProjects: verifiedCount,
        rejectedProjects: rejectedCount,
        totalReviewed: verifiedCount + rejectedCount
      });
    } catch (error) {
      console.error('Error fetching verifier data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch verification data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProject = async (projectId: string, status: 'verified' | 'rejected') => {
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status,
          verifier_id: profile?.id,
          verified_at: status === 'verified' ? new Date().toISOString() : null
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      if (status === 'verified') {
        const project = pendingProjects.find(p => p.id === projectId);
        if (project) {
          const { error: creditError } = await supabase
            .from('carbon_credits')
            .insert({
              project_id: projectId,
              owner_id: project.owner_id,
              credits_amount: project.estimated_credits,
              status: 'active'
            });

          if (creditError) throw creditError;
        }
      }

      toast({
        title: 'Success',
        description: `Project ${status} successfully`,
      });

      fetchVerifierData();
      setSelectedProject(null);
      setVerificationNotes('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">{t('verification.title')}</h2>
          <p className="text-muted-foreground">Review and verify environmental projects</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowContract(!showContract)} variant="outline">
            <Code className="w-4 h-4 mr-2" />
            {showContract ? 'Hide' : 'Show'} Contract
          </Button>
          <Button onClick={() => navigate('/verification')}>
            <Eye className="w-4 h-4 mr-2" />
            View All Projects
          </Button>
        </div>
      </div>

      {showContract && (
        <Card>
          <CardHeader>
            <CardTitle>{t('verification.contractCode')}</CardTitle>
            <CardDescription>
              Solidity smart contract for carbon credit verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
              <code>{contractCode}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits to Assign</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1000</div>
            <p className="text-xs text-muted-foreground">Available for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('verification.pendingProjects')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verifiedProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviewed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviewed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects for Review</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingProjects.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Projects to Review</h3>
              <p className="text-muted-foreground">All projects have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        By {project.profiles?.full_name} 
                        {project.profiles?.organization && ` (${project.profiles.organization})`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.location} • {project.area_hectares} hectares • {project.estimated_credits} estimated credits
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      PENDING
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-4">{project.description}</p>
                  
                  {selectedProject?.id === project.id ? (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <label className="text-sm font-medium">Verification Notes</label>
                        <Textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Add your verification notes..."
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleVerifyProject(project.id, 'verified')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t('verification.approve')}
                        </Button>
                        
                        <Button
                          onClick={() => handleVerifyProject(project.id, 'rejected')}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {t('verification.reject')}
                        </Button>
                        
                        <Button
                          onClick={() => setSelectedProject(null)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedProject(project)}
                      variant="outline"
                    >
                      Review Project
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifierDashboard;
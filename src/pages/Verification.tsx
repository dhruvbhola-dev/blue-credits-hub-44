import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, X, Clock, FileText, MapPin, Calendar, Wallet } from 'lucide-react';
import { getContract, getWalletAddress, getSellerData } from '@/contracts/contract';
import BlockchainWallet from '@/components/BlockchainWallet';
import CertificateGenerator from '@/components/Certificate/CertificateGenerator';

interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  area_hectares: number;
  estimated_credits: number;
  status: string;
  created_at: string;
  owner_id: string;
  profiles: {
    full_name: string;
    organization: string;
  };
}

const Verification = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState<{[key: string]: string}>({});
  const [blockchainLoading, setBlockchainLoading] = useState<{[key: string]: boolean}>({});
  const [pendingAddresses, setPendingAddresses] = useState<string[]>([]);
  const [showCertificate, setShowCertificate] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (profile?.role === 'verifier') {
      fetchPendingProjects();
    }
  }, [profile]);

  const fetchPendingProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_owner_id_fkey (
            full_name,
            organization
          )
        `)
        .in('status', ['pending', 'under_review'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects for verification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockchainVerification = async (projectId: string, sellerAddress: string, amount: number) => {
    setBlockchainLoading(prev => ({ ...prev, [projectId]: true }));
    
    try {
      const contract = await getContract();
      const tx = await contract.assignTokens(sellerAddress, amount);
      
      toast({
        title: 'Transaction Submitted',
        description: 'Waiting for blockchain confirmation...',
      });
      
      await tx.wait();
      
      toast({
        title: 'Success',
        description: `Tokens assigned successfully to ${sellerAddress}`,
      });
      
      // Update the project status in Supabase after blockchain success
      await handleVerification(projectId, 'verify');
      
    } catch (error: any) {
      console.error('Blockchain verification failed:', error);
      toast({
        title: 'Blockchain Error',
        description: error.message || 'Failed to assign tokens on blockchain',
        variant: 'destructive'
      });
    } finally {
      setBlockchainLoading(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleVerification = async (projectId: string, action: 'verify' | 'reject') => {
    if (!profile) return;

    try {
      const updates: any = {
        status: action === 'verify' ? 'verified' : 'rejected',
        verifier_id: profile.id,
        verified_at: new Date().toISOString(),
        verification_notes: verificationNotes[projectId] || null
      };

      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      if (action === 'reject') {
        toast({
          title: 'Success',
          description: 'Project rejected successfully',
        });
      }

      // Refresh the list
      fetchPendingProjects();
      
      // Clear notes
      setVerificationNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[projectId];
        return newNotes;
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} project`,
        variant: 'destructive'
      });
    }
  };

  const updateToReview = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'under_review' })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project moved to under review',
      });

      fetchPendingProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project status',
        variant: 'destructive'
      });
    }
  };

  if (profile?.role !== 'verifier') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">
          This page is only accessible to verified project verifiers.
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
                <div className="h-4 bg-muted rounded w-4/6"></div>
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
          <h1 className="text-3xl font-bold">Project Verification</h1>
          <p className="text-muted-foreground">
            Review and verify carbon credit projects
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {projects.length} Pending
        </Badge>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
            <p className="text-muted-foreground">
              There are no projects pending verification at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {project.location}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={project.status === 'pending' ? 'secondary' : 'default'}
                    className={project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}
                  >
                    {project.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Submitter:</strong> {project.profiles?.full_name}</p>
                    {project.profiles?.organization && (
                      <p><strong>Organization:</strong> {project.profiles.organization}</p>
                    )}
                  </div>
                  <div>
                    <p><strong>Area:</strong> {project.area_hectares} hectares</p>
                    <p><strong>Estimated Credits:</strong> {project.estimated_credits} tCO2e</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Project Description</h4>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor={`notes-${project.id}`}>Verification Notes</Label>
                  <Textarea
                    id={`notes-${project.id}`}
                    placeholder="Add your verification notes, concerns, or recommendations..."
                    value={verificationNotes[project.id] || ''}
                    onChange={(e) => setVerificationNotes(prev => ({
                      ...prev,
                      [project.id]: e.target.value
                    }))}
                    rows={3}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {project.status === 'pending' && (
                    <Button
                      variant="outline"
                      onClick={() => updateToReview(project.id)}
                      className="flex items-center"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Start Review
                    </Button>
                  )}
                  
                  <Button
                    onClick={async () => {
                      try {
                        // Get project owner's wallet address from profiles
                        const { data: ownerProfile } = await supabase
                          .from('profiles')
                          .select('wallet_address, user_id')
                          .eq('id', project.owner_id)
                          .single();

                        if (!ownerProfile?.wallet_address) {
                          toast({
                            title: 'Error',
                            description: 'Project owner must connect their wallet first',
                            variant: 'destructive'
                          });
                          return;
                        }

                        const creditsToAssign = project.estimated_credits || 0;
                        if (creditsToAssign <= 0) {
                          toast({
                            title: 'Error', 
                            description: 'No credits to assign for this project',
                            variant: 'destructive'
                          });
                          return;
                        }

                        await handleBlockchainVerification(project.id, ownerProfile.wallet_address, creditsToAssign);
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to assign tokens',
                          variant: 'destructive'
                        });
                      }
                    }}
                    disabled={blockchainLoading[project.id]}
                    className="flex items-center bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {blockchainLoading[project.id] ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifying on Blockchain...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Verify & Assign Tokens
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => handleVerification(project.id, 'reject')}
                    className="flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Verification;
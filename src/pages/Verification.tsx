import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, X, Clock, FileText, MapPin, Calendar, Wallet, Award, AlertCircle } from 'lucide-react';
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
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState<{[key: string]: string}>({});
  const [blockchainLoading, setBlockchainLoading] = useState<{[key: string]: boolean}>({});
  const [backupLoading, setBackupLoading] = useState<{[key: string]: boolean}>({});
  const [pendingAddresses, setPendingAddresses] = useState<string[]>([]);
  const [showCertificate, setShowCertificate] = useState<{[key: string]: boolean}>({});
  const [creditInputs, setCreditInputs] = useState<{[key: string]: string}>({});
  const [showBackupButton, setShowBackupButton] = useState<{[key: string]: boolean}>({});

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
        description: `${amount} credits assigned successfully to NGO`,
      });
      
      // Update the project status and assign credits in Supabase after blockchain success
      await supabase
        .from('projects')
        .update({ 
          status: 'verified',
          verifier_id: profile?.id,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNotes[projectId] || null
        })
        .eq('id', projectId);

      // Create carbon credits record for the NGO
      await supabase
        .from('carbon_credits')
        .insert({
          project_id: projectId,
          owner_id: projects.find(p => p.id === projectId)?.owner_id,
          credits_amount: amount,
          status: 'active',
          for_sale: amount // Make all credits available for sale by default
        });

      // Create marketplace listing
      await supabase
        .from('marketplace_listings')
        .insert({
          project_id: projectId,
          seller_id: projects.find(p => p.id === projectId)?.owner_id,
          credits_amount: amount,
          price_per_credit: 0.001, // Default price per credit
          status: 'active'
        });
      
      // Refresh projects list
      fetchPendingProjects();
      setCreditInputs(prev => ({ ...prev, [projectId]: '' }));
      
    } catch (error: any) {
      console.error('Blockchain verification failed:', error);
      setShowBackupButton(prev => ({ ...prev, [projectId]: true }));
      toast({
        title: 'Blockchain Error',
        description: 'Transaction failed. Use "Issue Credits with Certificate" as backup.',
        variant: 'destructive'
      });
    } finally {
      setBlockchainLoading(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleBackupCreditsWithCertificate = async (projectId: string, amount: number) => {
    setBackupLoading(prev => ({ ...prev, [projectId]: true }));
    
    try {
      // Update project status as verified
      await supabase
        .from('projects')
        .update({ 
          status: 'verified',
          verifier_id: profile?.id,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNotes[projectId] || null
        })
        .eq('id', projectId);

      // Create carbon credits record
      await supabase
        .from('carbon_credits')
        .insert({
          project_id: projectId,
          owner_id: projects.find(p => p.id === projectId)?.owner_id,
          credits_amount: amount,
          status: 'active',
          for_sale: amount
        });

      // Create marketplace listing
      await supabase
        .from('marketplace_listings')
        .insert({
          project_id: projectId,
          seller_id: projects.find(p => p.id === projectId)?.owner_id,
          credits_amount: amount,
          price_per_credit: 0.001,
          status: 'active'
        });

      // Generate certificate
      await supabase
        .from('certificates')
        .insert({
          project_id: projectId,
          generated_by: profile?.id,
          certificate_data: {
            credits: amount,
            issued_via: 'backup_system',
            issued_at: new Date().toISOString()
          }
        });
      
      toast({
        title: 'Success',
        description: `${amount} credits issued with certificate. Project is now in marketplace.`,
      });
      
      // Refresh projects list
      fetchPendingProjects();
      setCreditInputs(prev => ({ ...prev, [projectId]: '' }));
      setShowBackupButton(prev => ({ ...prev, [projectId]: false }));
      
    } catch (error: any) {
      console.error('Backup credit issuance failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue credits with certificate',
        variant: 'destructive'
      });
    } finally {
      setBackupLoading(prev => ({ ...prev, [projectId]: false }));
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

      {/* Wallet Connection Status */}
      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800">Wallet Connection Required</h3>
                <p className="text-sm text-orange-700">
                  Connect your MetaMask wallet to verify projects and assign credits
                </p>
              </div>
              <Button onClick={connectWallet} variant="outline">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <Label htmlFor={`credits-${project.id}`}>Credits to Assign to NGO</Label>
                  <Input
                    id={`credits-${project.id}`}
                    type="number"
                    placeholder={`Enter credits (Estimated: ${project.estimated_credits})`}
                    value={creditInputs[project.id] || ''}
                    onChange={(e) => setCreditInputs(prev => ({
                      ...prev,
                      [project.id]: e.target.value
                    }))}
                    min="1"
                    max="10000"
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button
                    onClick={async () => {
                      const creditsToAssign = parseInt(creditInputs[project.id] || '0');
                      
                      if (creditsToAssign <= 0) {
                        toast({
                          title: 'Error', 
                          description: 'Please enter a valid number of credits to assign',
                          variant: 'destructive'
                        });
                        return;
                      }

                      try {
                        // Check if verifier wallet is connected
                        if (!isConnected || !walletAddress) {
                          toast({
                            title: 'Wallet Not Connected',
                            description: 'Please connect your MetaMask wallet first',
                            variant: 'destructive'
                          });
                          return;
                        }
                        
                        // Get project owner's wallet address from profiles
                        const { data: ownerProfile, error: profileError } = await supabase
                          .from('profiles')
                          .select('wallet_address, full_name')
                          .eq('id', project.owner_id)
                          .single();

                        if (profileError) {
                          toast({
                            title: 'Error',
                            description: 'Failed to fetch project owner profile',
                            variant: 'destructive'
                          });
                          return;
                        }

                        const ownerWalletAddress = ownerProfile?.wallet_address;

                        if (!ownerWalletAddress) {
                          toast({
                            title: 'Owner Wallet Not Connected',
                            description: `${ownerProfile?.full_name || 'Project owner'} must connect their wallet first. Please ask them to visit their dashboard and connect MetaMask.`,
                            variant: 'destructive'
                          });
                          return;
                        }

                        await handleBlockchainVerification(project.id, ownerWalletAddress, creditsToAssign);
                      } catch (error: any) {
                        console.error('Wallet connection error:', error);
                        toast({
                          title: 'Wallet Connection Error',
                          description: 'Please ensure MetaMask is connected and on Sepolia network',
                          variant: 'destructive'
                        });
                      }
                     }}
                     disabled={blockchainLoading[project.id] || !creditInputs[project.id] || !isConnected}
                     className="flex items-center bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                     size="lg"
                  >
                    {blockchainLoading[project.id] ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending Credits to NGO...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Send Credits to NGO
                      </>
                    )}
                  </Button>

                  {showBackupButton[project.id] && (
                    <Button
                      onClick={() => {
                        const creditsToAssign = parseInt(creditInputs[project.id] || '0');
                        if (creditsToAssign > 0) {
                          handleBackupCreditsWithCertificate(project.id, creditsToAssign);
                        }
                      }}
                      disabled={backupLoading[project.id] || !creditInputs[project.id]}
                      className="flex items-center bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      size="lg"
                    >
                      {backupLoading[project.id] ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Generating Certificate...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          Generate Certificate
                        </>
                      )}
                    </Button>
                  )}
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
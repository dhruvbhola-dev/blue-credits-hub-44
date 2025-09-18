import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, MapPin, Wallet } from 'lucide-react';
import { locationOptions } from '@/utils/dummyData';
import { getContract } from '@/contracts/contract';
import BlockchainStats from '@/components/BlockchainStats';

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
}

const Reporting = () => {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingToBlockchain, setSubmittingToBlockchain] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    area_hectares: '',
    description: '',
    location: '',
  });
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchProjects();
    }
  }, [profile]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToBlockchain = async () => {
    setSubmittingToBlockchain(true);
    
    try {
      const contract = await getContract();
      const tx = await contract.submitDocument();
      
      toast({
        title: 'Transaction Submitted',
        description: 'Document submission sent to blockchain...',
      });
      
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'Document successfully submitted to blockchain!',
      });
      
    } catch (error: any) {
      console.error('Blockchain submission failed:', error);
      toast({
        title: 'Blockchain Error',
        description: error.message || 'Failed to submit document to blockchain',
        variant: 'destructive'
      });
    } finally {
      setSubmittingToBlockchain(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setPhotos(prev => [...prev, e.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast({
        title: t('common.error'),
        description: 'Profile not found',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          area_hectares: parseFloat(formData.area_hectares),
          owner_id: profile.id,
          estimated_credits: Math.floor(parseFloat(formData.area_hectares) * 20),
          gps_coordinates: {
            lat: 20.5937 + (Math.random() - 0.5) * 10,
            lng: 78.9629 + (Math.random() - 0.5) * 10
          }
        })
        .select()
        .single();

      if (projectError) throw projectError;

      toast({
        title: t('common.success'),
        description: t('reporting.projectSubmitted'),
      });

      setFormData({
        title: '',
        area_hectares: '',
        description: '',
        location: '',
      });
      setPhotos([]);
      
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Error submitting project:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to submit project',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profile?.role !== 'ngo' && profile?.role !== 'localpeople') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is only available to NGOs and Local People.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reporting.title')}</h1>
          <p className="text-muted-foreground">
            Submit and track your blue carbon projects
          </p>
        </div>
      </div>

      <BlockchainStats projects={projects} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Blockchain Integration
          </CardTitle>
          <CardDescription>
            Submit your project documentation to the blockchain for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSubmitToBlockchain}
            disabled={submittingToBlockchain}
            className="flex items-center"
          >
            {submittingToBlockchain ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting to Blockchain...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Submit Document to Blockchain
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              New Project Submission
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="text-sm font-medium">
                  Area (Hectares) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.area_hectares}
                  onChange={(e) => handleInputChange('area_hectares', e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Select onValueChange={(value) => handleInputChange('location', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your project"
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Project'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reporting;
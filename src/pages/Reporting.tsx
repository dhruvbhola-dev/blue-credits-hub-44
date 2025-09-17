import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, MapPin } from 'lucide-react';
import { locationOptions } from '@/utils/dummyData';

const Reporting = () => {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    area_hectares: '',
    description: '',
    location: '',
  });
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          area_hectares: parseFloat(formData.area_hectares),
          owner_id: profile.id,
          estimated_credits: Math.floor(parseFloat(formData.area_hectares) * 20), // Estimate 20 credits per hectare
          gps_coordinates: {
            lat: 20.5937 + (Math.random() - 0.5) * 10, // Random coordinates for demo
            lng: 78.9629 + (Math.random() - 0.5) * 10
          }
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Upload photos
      if (photos.length > 0 && project) {
        const photoPromises = photos.map(async (photo, index) => {
          return supabase
            .from('project_images')
            .insert({
              project_id: project.id,
              image_url: `project-${project.id}-${index}.jpg`,
              image_data: photo,
              uploaded_by: profile.id
            });
        });

        await Promise.all(photoPromises);
      }

      toast({
        title: t('common.success'),
        description: t('reporting.projectSubmitted'),
      });

      // Reset form
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

  // Only show to NGO and Local People
  if (profile?.role !== 'ngo' && profile?.role !== 'localpeople') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is only available to NGOs and Local People.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            {t('reporting.title')}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                {t('reporting.projectName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('reporting.projectNamePlaceholder')}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label htmlFor="area" className="text-sm font-medium">
                {t('reporting.area')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                min="0"
                value={formData.area_hectares}
                onChange={(e) => handleInputChange('area_hectares', e.target.value)}
                placeholder={t('reporting.areaPlaceholder')}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                {t('reporting.location')} <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(value) => handleInputChange('location', value)} required>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder={t('reporting.locationPlaceholder')} />
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {t('reporting.description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('reporting.descriptionPlaceholder')}
                rows={4}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                {t('reporting.uploadPhotos')}
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors duration-200">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t('reporting.photosHelper')}
                  </p>
                  <Button type="button" variant="outline" className="mt-2" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </span>
                  </Button>
                </label>
              </div>

              {/* Photo Previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-green-secondary hover:from-primary/90 hover:to-green-secondary/90 transition-all duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.loading') : t('reporting.submitProject')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reporting;
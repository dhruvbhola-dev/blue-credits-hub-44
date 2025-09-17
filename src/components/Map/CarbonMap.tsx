import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Leaf } from 'lucide-react';
import { indiaBlueProjectsData } from '@/utils/dummyData';

interface MapboxProject {
  id: string;
  title: string;
  location: string;
  gps_coordinates: {
    lat: number;
    lng: number;
  };
  area_hectares: number;
  estimated_credits: number;
  status: string;
}

const CarbonMap = () => {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [mapboxToken, setMapboxToken] = useState('');
  const [projects, setProjects] = useState<MapboxProject[]>([]);
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [useDummyData, setUseDummyData] = useState(false);

  useEffect(() => {
    // Check if we have a stored token
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      setMapboxToken(storedToken);
      setShowTokenInput(false);
      loadProjectData();
    }
  }, []);

  useEffect(() => {
    if (profile && !showTokenInput) {
      loadProjectData();
    }
  }, [profile, showTokenInput]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapboxToken.trim()) {
      toast({
        title: t('common.error'),
        description: 'Please enter your Mapbox token',
        variant: 'destructive'
      });
      return;
    }

    localStorage.setItem('mapbox_token', mapboxToken);
    setShowTokenInput(false);
    loadProjectData();
  };

  const loadProjectData = async () => {
    if (useDummyData) {
      // Use dummy data for demo
      const dummyProjects = indiaBlueProjectsData.map(point => ({
        id: point.id,
        title: point.name,
        location: point.location,
        gps_coordinates: {
          lat: point.coordinates[1],
          lng: point.coordinates[0]
        },
        area_hectares: point.area,
        estimated_credits: point.credits,
        status: point.status
      }));
      setProjects(dummyProjects);
      return;
    }

    // Fetch real data from database
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'verified')
        .not('gps_coordinates', 'is', null);

      if (error) throw error;

      if (data && data.length > 0) {
        const validProjects = data.filter(project => {
          const coords = project.gps_coordinates as any;
          return coords && 
            typeof coords === 'object' &&
            coords.lat && 
            coords.lng;
        }).map(project => ({
          id: project.id,
          title: project.title,
          location: project.location,
          gps_coordinates: project.gps_coordinates as { lat: number; lng: number },
          area_hectares: project.area_hectares,
          estimated_credits: project.estimated_credits || 0,
          status: project.status
        }));
        setProjects(validProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Fallback to dummy data
      setUseDummyData(true);
      loadProjectData();
    }
  };

  const useDummyDataInstead = () => {
    setUseDummyData(true);
    setShowTokenInput(false);
    loadProjectData();
  };

  if (showTokenInput) {
    return (
      <div className="space-y-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              {t('carbonTracker.mapTitle')}
            </CardTitle>
            <CardDescription>
              Please enter your Mapbox public token to display the interactive map.
              Get your token from{' '}
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                mapbox.com
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Mapbox Public Token</Label>
                <Input
                  id="token"
                  type="text"
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIi..."
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Initialize Interactive Map
              </Button>
            </form>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Or use demo data instead:
              </p>
              <Button 
                variant="outline" 
                onClick={useDummyDataInstead}
                className="w-full"
              >
                View Demo Map with Sample Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Leaf className="w-6 h-6 mr-3 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">{t('carbonTracker.mapTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {projects.length} verified blue carbon project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {useDummyData && (
          <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Demo Mode
          </div>
        )}
      </div>
      
      {/* Project Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {projects.length}
            </div>
            <p className="text-xs text-muted-foreground">Active Projects</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {projects.reduce((sum, p) => sum + p.area_hectares, 0).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Hectares Restored</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {projects.reduce((sum, p) => sum + p.estimated_credits, 0).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Carbon Credits (tCO2e)</p>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle>Project Locations</CardTitle>
          <CardDescription>
            Blue carbon restoration projects across India's coastal regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
              <p className="text-muted-foreground">
                No verified projects with GPS coordinates available
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">{project.title}</h4>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {project.location}
                      </p>
                      <div className="flex justify-between text-xs">
                        <span>{project.area_hectares} hectares</span>
                        <span className="text-green-600 font-medium">
                          {project.estimated_credits} tCO2e
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Lat: {project.gps_coordinates.lat.toFixed(4)}</span>
                        <span>Lng: {project.gps_coordinates.lng.toFixed(4)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {!useDummyData && (
        <div className="text-xs text-muted-foreground text-center">
          * Interactive map requires Mapbox token. Data shown represents verified blue carbon projects.
        </div>
      )}
    </div>
  );
};

export default CarbonMap;
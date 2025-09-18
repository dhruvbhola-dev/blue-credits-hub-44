import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Leaf } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  credits: number;
  status: string;
}

interface CarbonProjectMapProps {
  projects?: Project[];
  height?: string;
  showControls?: boolean;
}

const CarbonProjectMap: React.FC<CarbonProjectMapProps> = ({ 
  projects = [], 
  height = "400px",
  showControls = false 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw');

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [78.9629, 20.5937], // Center of India
        zoom: 5,
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add markers for projects
      map.current.on('load', () => {
        projects.forEach((project) => {
          if (project.coordinates) {
            // Create custom marker element
            const markerElement = document.createElement('div');
            markerElement.className = 'custom-marker';
            markerElement.style.width = '30px';
            markerElement.style.height = '30px';
            markerElement.style.borderRadius = '50%';
            markerElement.style.backgroundColor = project.status === 'verified' ? '#22c55e' : '#f59e0b';
            markerElement.style.display = 'flex';
            markerElement.style.alignItems = 'center';
            markerElement.style.justifyContent = 'center';
            markerElement.style.cursor = 'pointer';
            markerElement.style.border = '2px solid white';
            markerElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            markerElement.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

            // Create popup
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-3">
                <h3 class="font-semibold text-sm mb-1">${project.title}</h3>
                <p class="text-xs text-gray-600 mb-1">${project.location}</p>
                <p class="text-xs"><span class="font-medium">${project.credits}</span> Credits</p>
                <p class="text-xs"><span class="px-2 py-1 rounded text-xs font-medium ${
                  project.status === 'verified' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }">${project.status}</span></p>
              </div>
            `);

            // Add marker to map
            new mapboxgl.Marker(markerElement)
              .setLngLat([project.coordinates.lng, project.coordinates.lat])
              .setPopup(popup)
              .addTo(map.current!);
          }
        });
      });

      // Cleanup
      return () => {
        map.current?.remove();
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [projects, mapboxToken]);

  return (
    <div className="space-y-4">
      {showControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Map Configuration
            </CardTitle>
            <CardDescription>
              Enter your Mapbox public token to display the map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your token from{" "}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Leaf className="w-5 h-5 mr-2" />
            Carbon Projects Map
          </CardTitle>
          <CardDescription>
            View active carbon credit projects across India
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapContainer} 
            className="w-full rounded-lg shadow-lg border"
            style={{ height }}
          />
          {projects.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">No projects to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CarbonProjectMap;
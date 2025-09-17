import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import CarbonMap from '@/components/Map/CarbonMap';
import { AlertTriangle } from 'lucide-react';

const CarbonTracker = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carbon Credit Tracker</h1>
          <p className="text-muted-foreground">
            Monitor your carbon credits and environmental impact
          </p>
        </div>
        {/* Red button as requested - placeholder page */}
        <Button onClick={() => navigate('/placeholder-page')} className="bg-red-600 hover:bg-red-700">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Placeholder Page
        </Button>
      </div>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle>Tree Plantation Locations</CardTitle>
          <CardDescription>
            Interactive map showing verified tree plantation sites and carbon credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CarbonMap />
        </CardContent>
      </Card>

      {/* Certificate Section - only visible to Admin, NGO, Panchayat */}
      {profile?.role && ['admin', 'ngo', 'panchayat'].includes(profile.role) && (
        <Card>
          <CardHeader>
            <CardTitle>Certificate Generation</CardTitle>
            <CardDescription>
              Generate certificates for verified projects (requires verifier approval)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Certificates can only be generated after project verification is complete.
            </p>
            <Button disabled variant="outline">
              Certificate Generation (Pending Implementation)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CarbonTracker;
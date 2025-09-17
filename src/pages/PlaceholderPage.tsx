import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaceholderPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Construction className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <CardTitle>Placeholder Page</CardTitle>
          <CardDescription>
            This is the red button placeholder page as requested
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            This page is currently empty and serves as a placeholder for future functionality.
          </p>
          <Button onClick={() => navigate(-1)} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
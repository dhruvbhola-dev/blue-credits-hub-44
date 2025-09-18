import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { profile } = useAuth();

  // Import role-specific dashboard components
  const AdminDashboard = React.lazy(() => import('@/components/dashboards/AdminDashboard'));
  const NGODashboard = React.lazy(() => import('@/components/dashboards/NGODashboard'));
  const PanchayatDashboard = React.lazy(() => import('@/components/dashboards/PanchayatDashboard'));
  const VerifierDashboard = React.lazy(() => import('@/components/dashboards/VerifierDashboard'));
  const CompanyDashboard = React.lazy(() => import('@/components/dashboards/CompanyDashboard'));

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  const renderRoleDashboard = () => {
    switch (profile.role) {
      case 'ngo':
        return (
          <React.Suspense fallback={<div className="animate-pulse">Loading NGO dashboard...</div>}>
            <NGODashboard />
          </React.Suspense>
        );
      case 'localpeople':
        return (
          <React.Suspense fallback={<div className="animate-pulse">Loading Local People dashboard...</div>}>
            <PanchayatDashboard />
          </React.Suspense>
        );
      case 'verifier':
        return (
          <React.Suspense fallback={<div className="animate-pulse">Loading Verifier dashboard...</div>}>
            <VerifierDashboard />
          </React.Suspense>
        );
      case 'company':
        return (
          <React.Suspense fallback={<div className="animate-pulse">Loading Company dashboard...</div>}>
            <CompanyDashboard />
          </React.Suspense>
        );
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Unknown Role</h3>
            <p className="text-muted-foreground">
              Your account role is not recognized. Please contact support.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/20 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Welcome back, {profile?.full_name}!
        </h1>
        <p className="text-muted-foreground">
          Role: <Badge variant="outline" className="ml-1">{profile?.role?.toUpperCase()}</Badge>
          {profile?.organization && (
            <span className="ml-4">Organization: {profile.organization}</span>
          )}
        </p>
      </div>

      {/* Role-specific dashboard content */}
      {renderRoleDashboard()}
    </div>
  );
};

export default Dashboard;
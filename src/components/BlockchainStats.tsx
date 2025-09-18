import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, TrendingUp, FileText, Users } from 'lucide-react';

interface BlockchainStatsProps {
  projects: Array<{
    status: string;
    estimated_credits?: number;
  }>;
}

const BlockchainStats: React.FC<BlockchainStatsProps> = ({ projects }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Leaf className="h-8 w-8 text-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold">
                {projects.reduce((sum, project) => sum + (project.estimated_credits || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Verified Projects</p>
              <p className="text-2xl font-bold">
                {projects.filter(p => p.status === 'verified').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">
                {projects.filter(p => p.status === 'pending' || p.status === 'under_review').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainStats;
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/contexts/I18nContext';

interface ProfileBoxProps {
  name: string;
  email: string;
  role: string;
  organization?: string;
  logoUrl?: string;
}

const ProfileBox: React.FC<ProfileBoxProps> = ({ 
  name, 
  email, 
  role, 
  organization, 
  logoUrl 
}) => {
  const { t } = useI18n();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ngo':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'localpeople':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'verifier':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'company':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md">
      <Avatar className="h-10 w-10">
        {logoUrl ? (
          <img src={logoUrl} alt="Profile" className="rounded-full" />
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {name}
          </h3>
          <Badge 
            variant="secondary" 
            className={`text-xs ${getRoleColor(role)}`}
          >
            {t(`roles.${role}`)}
          </Badge>
        </div>
        
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {email}
          </p>
          {organization && (
            <p className="text-xs text-muted-foreground truncate">
              {organization}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileBox;
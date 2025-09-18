import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Store,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import ProfileBox from '@/components/ProfileBox';
import LanguageToggle from '@/components/LanguageToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = user ? [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    ...(profile?.role === 'ngo' || profile?.role === 'localpeople' ? [{ name: t('navigation.reporting'), href: '/reporting', icon: FileText }] : []),
    ...(profile?.role === 'verifier' ? [{ name: t('navigation.verification'), href: '/verification', icon: CheckCircle }] : []),
    { name: t('navigation.carbonTracker'), href: '/carbon-tracker', icon: TrendingUp },
    ...(profile?.role === 'company' ? [{ name: t('navigation.marketplace'), href: '/marketplace', icon: Store }] : []),
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="text-2xl font-bold">
              BlueCarbon Credits
            </Link>
            
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <LanguageToggle />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('common.signOut')}
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <LanguageToggle />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/auth')}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {t('common.login')}
                </Button>
                <Button 
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t('common.signup')}
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {user && (
          <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-card border-r min-h-screen transition-all duration-300 md:transition-none ${mobileMenuOpen ? 'fixed inset-0 z-50 md:relative md:inset-auto md:z-auto' : ''}`}>
            <div className="p-4">
              {/* Profile Box */}
              {profile && (
                <div className="mb-6">
                  <ProfileBox
                    name={profile.full_name}
                    email={user.email || ''}
                    role={profile.role}
                    organization={profile.organization}
                  />
                </div>
              )}
              
              {/* Navigation */}
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground hover:shadow-sm'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className={`flex-1 ${user ? 'p-6' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
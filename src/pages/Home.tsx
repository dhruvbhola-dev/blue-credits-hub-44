import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Shield, TrendingUp, Users } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Leaf,
      title: 'Carbon Credit Trading',
      description: 'Trade verified blue carbon credits from coastal ecosystem restoration projects'
    },
    {
      icon: Shield,
      title: 'Verified Projects',
      description: 'All projects undergo rigorous verification by certified professionals'
    },
    {
      icon: TrendingUp,
      title: 'Track Impact',
      description: 'Monitor your carbon footprint reduction and environmental impact in real-time'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Connect with NGOs, Panchayats, and verifiers in a transparent ecosystem'
    }
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-24 px-6 bg-gradient-to-br from-primary/20 to-secondary/30 rounded-xl">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-10">
            BlueCarbon Credits Platform
          </h1>

          {/* Logos Row */}
          <div className="flex flex-col sm:flex-row justify-center items-center mb-12 gap-6 sm:gap-10">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Digital_India_logo.svg/1200px-Digital_India_logo.svg.png" 
              alt="Digital India" 
              className="h-16 sm:h-20 transition-transform duration-300 hover:scale-105"
            />
            <img 
              src="https://iiitbhopal.ac.in/assets/websiteRef/img/logo.png" 
              alt="IIIT Bhopal" 
              className="h-16 sm:h-20 transition-transform duration-300 hover:scale-105"
            />
            <img 
              src="https://iiitbhopal.ac.in/assets/websiteRef/img/Gandhi.png" 
              alt="Gandhi Ji" 
              className="h-12 sm:h-14 transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* CTA Section */}
          {user ? (
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="text-base sm:text-lg px-8 sm:px-10 py-3 transition-transform duration-300 hover:scale-105"
            >
              Go to Dashboard
            </Button>
          ) : (
            <div className="mt-12">
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-4">
                Join thousands of organizations and individuals working together to restore coastal ecosystems.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-base sm:text-lg px-8 sm:px-10 py-3 transition-transform duration-300 hover:scale-105"
              >
                Sign Up Today
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-14">
            Why Choose BlueCarbon Credits?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title} 
                  className="text-center transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm sm:text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-primary/5 rounded-xl">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-14">Platform Impact</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-3">1,250+</div>
              <div className="text-muted-foreground text-sm sm:text-base">Hectares Restored</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-3">50,000+</div>
              <div className="text-muted-foreground text-sm sm:text-base">Carbon Credits Issued</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-3">200+</div>
              <div className="text-muted-foreground text-sm sm:text-base">Active Projects</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="text-center py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Ready to Make an Impact?</h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10">
              Join thousands of organizations and individuals working together to restore coastal ecosystems.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-base sm:text-lg px-8 sm:px-10 py-3 transition-transform duration-300 hover:scale-105"
            >
              Sign Up Today
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
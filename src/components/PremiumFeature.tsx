import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumFeatureProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
}

export const PremiumFeature = ({ children, feature, fallback }: PremiumFeatureProps) => {
  const { tier } = useSubscription();
  const navigate = useNavigate();

  if (tier === 'premium') {
    return <>{children}</>;
  }

  return fallback || (
    <div className="relative p-8 rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="absolute top-4 right-4">
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <Sparkles className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>
      <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-primary/10 rounded-full">
          <Lock className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-xl mb-2">{feature || 'Premium Feature'}</h3>
          <p className="text-sm text-muted-foreground">
            Unlock this feature at just ₹49/month. Join thousands of students who upgraded!
          </p>
        </div>
        <Button 
          onClick={() => navigate('/pricing')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>
      </div>
    </div>
  );
};

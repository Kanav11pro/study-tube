import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Award, Clock } from 'lucide-react';

export const SubscriptionExpiryNotification = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [stats, setStats] = useState({ aiNotesUsed: 0, playlists: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    checkExpiry();
  }, []);

  const checkExpiry = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id, end_date, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription) return;

    // Calculate days left
    const endDate = new Date(subscription.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Show notification if less than 7 days left
    if (diffDays <= 7 && diffDays > 0) {
      // Get usage stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('ai_notes_used_this_month')
        .eq('id', user.id)
        .single();

      const { count: playlistCount } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        aiNotesUsed: profile?.ai_notes_used_this_month || 0,
        playlists: playlistCount || 0,
      });

      setDaysLeft(diffDays);
      setShowDialog(true);
    }

    // Auto-downgrade if expired
    if (diffDays <= 0) {
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('id', subscription.id);

      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', user.id);
    }
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-warning/10 rounded-full">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <AlertDialogTitle className="text-xl">Premium Expiring Soon!</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4">
            <p className="text-base">
              Your premium subscription expires in <span className="font-bold text-warning">{daysLeft} day{daysLeft > 1 ? 's' : ''}</span>. 
              Don't lose access to these amazing features you've been using!
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Your Premium Journey So Far
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">AI Notes Used</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.aiNotesUsed}</p>
                </div>

                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-success" />
                    <span className="text-xs text-muted-foreground">Playlists</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.playlists}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm text-foreground">
                <span className="font-bold">Continue your success story!</span> Renew now at just <span className="text-primary font-bold">₹49/month</span> and keep crushing your JEE/NEET prep! 🚀
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDialog(false)}
            className="w-full sm:w-auto"
          >
            Remind Me Later
          </Button>
          <Button
            onClick={() => {
              setShowDialog(false);
              navigate('/pricing');
            }}
            className="w-full sm:w-auto bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Renew Premium Now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
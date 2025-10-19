import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionLimits {
  playlists: number | null;
  aiNotes: number;
}

interface SubscriptionUsage {
  playlists: number;
  aiNotesUsed: number;
}

interface SubscriptionInfo {
  tier: 'free' | 'premium';
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
  isLoading: boolean;
  subscription?: {
    end_date: string;
    status: string;
  };
  checkLimit: (feature: 'playlists' | 'aiNotes') => {
    allowed: boolean;
    current?: number;
    max?: number;
  };
  refresh: () => Promise<void>;
}

export const useSubscription = (): SubscriptionInfo => {
  const [tier, setTier] = useState<'free' | 'premium'>('free');
  const [limits, setLimits] = useState<SubscriptionLimits>({ playlists: 3, aiNotes: 5 });
  const [usage, setUsage] = useState<SubscriptionUsage>({ playlists: 0, aiNotesUsed: 0 });
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get profile with subscription info
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, ai_notes_used_this_month')
        .eq('id', user.id)
        .single();

      // Get platform settings for limits
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'tier_limits')
        .single();

      const tierLimits = settings?.setting_value[profile?.subscription_tier || 'free'];
      
      // Count user's playlists
      const { count: playlistCount } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get active subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('end_date, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setTier((profile?.subscription_tier as 'free' | 'premium') || 'free');
      setLimits({
        playlists: tierLimits?.playlists || 3,
        aiNotes: tierLimits?.ai_notes || 5,
      });
      setUsage({
        playlists: playlistCount || 0,
        aiNotesUsed: profile?.ai_notes_used_this_month || 0,
      });
      setSubscription(subData);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const checkLimit = (feature: 'playlists' | 'aiNotes') => {
    if (tier === 'premium' && limits.playlists === null) {
      return { allowed: true };
    }
    
    if (feature === 'playlists') {
      const max = limits.playlists || 3;
      return {
        allowed: usage.playlists < max,
        current: usage.playlists,
        max,
      };
    }
    
    return {
      allowed: usage.aiNotesUsed < limits.aiNotes,
      current: usage.aiNotesUsed,
      max: limits.aiNotes,
    };
  };

  return { 
    tier, 
    limits, 
    usage, 
    isLoading, 
    subscription,
    checkLimit, 
    refresh: loadSubscription 
  };
};

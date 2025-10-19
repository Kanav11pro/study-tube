import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, DollarSign, CheckCircle, XCircle, Eye, ArrowLeft, 
  Settings as SettingsIcon, TrendingUp, Clock 
} from 'lucide-react';
import { format } from 'date-fns';

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    pendingRequests: 0,
    monthlyRevenue: 0,
  });
  const [requests, setRequests] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [platformSettings, setPlatformSettings] = useState<any>({
    upi_details: { upi_id: '', display_name: '' },
    pricing: { monthly: 49, yearly: 499 },
    tier_limits: { free: { playlists: 3, ai_notes: 5 }, premium: { playlists: null, ai_notes: 20 } },
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!role) {
      toast.error('Access denied: Admin only');
      navigate('/dashboard');
      return;
    }

    setIsAdmin(true);
    loadDashboard();
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    await Promise.all([
      loadStats(),
      loadRequests(),
      loadSubscriptions(),
      loadUsers(),
      loadSettings(),
    ]);
    setIsLoading(false);
  };

  const loadStats = async () => {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: freeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_tier', 'free');

    const { count: premiumUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_tier', 'premium');

    const { count: pendingRequests } = await supabase
      .from('subscription_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: approvedRequests } = await supabase
      .from('subscription_requests')
      .select('amount_paid')
      .eq('status', 'approved')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString());

    const monthlyRevenue = approvedRequests?.reduce((sum, req) => sum + Number(req.amount_paid), 0) || 0;

    setStats({ totalUsers: totalUsers || 0, freeUsers: freeUsers || 0, premiumUsers: premiumUsers || 0, pendingRequests: pendingRequests || 0, monthlyRevenue });
  };

  const loadRequests = async () => {
    const { data } = await supabase
      .from('subscription_requests')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    setRequests(data || []);
  };

  const loadSubscriptions = async () => {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('*, profiles(full_name, email), subscription_plans(name, price_inr)')
      .eq('status', 'active')
      .order('end_date', { ascending: true });

    setSubscriptions(data || []);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, subscription_tier, created_at')
      .order('created_at', { ascending: false });

    setUsers(data || []);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('setting_key, setting_value');

    if (data) {
      const settings: any = {};
      data.forEach(s => settings[s.setting_key] = s.setting_value);
      setPlatformSettings(settings);
    }
  };

  const handleApprove = async (requestId: string, userId: string, planId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('subscription_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), admin_notes: adminNotes })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('duration_days')
        .eq('id', planId)
        .single();

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan?.duration_days || 30));

      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
        }, { onConflict: 'user_id' });

      if (subError) throw subError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'premium' })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('Subscription approved and activated!');
      setSelectedRequest(null);
      setAdminNotes('');
      loadDashboard();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), admin_notes: adminNotes })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request rejected');
      setSelectedRequest(null);
      setAdminNotes('');
      loadDashboard();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      for (const [key, value] of Object.entries(platformSettings)) {
        await supabase
          .from('platform_settings')
          .upsert({ 
            setting_key: key, 
            setting_value: value as any,
            updated_at: new Date().toISOString() 
          }, { 
            onConflict: 'setting_key' 
          });
      }
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading admin panel...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage subscriptions, users, and settings</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Free Users</p>
                  <p className="text-2xl font-bold">{stats.freeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Premium Users</p>
                  <p className="text-2xl font-bold">{stats.premiumUsers}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue (MTD)</p>
                  <p className="text-2xl font-bold">₹{stats.monthlyRevenue}</p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">
              Requests {stats.pendingRequests > 0 && <Badge className="ml-2">{stats.pendingRequests}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="subscriptions">Active Subscriptions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Platform Settings</TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Requests</CardTitle>
                <CardDescription>Review and approve payment verifications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{req.full_name}</p>
                            <p className="text-sm text-muted-foreground">{req.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {req.amount_paid === 499 ? 'Yearly' : 'Monthly'}
                        </TableCell>
                        <TableCell>₹{req.amount_paid}</TableCell>
                        <TableCell>{format(new Date(req.payment_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge
                            variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'}
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(req)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Active Premium Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{sub.subscription_plans?.name}</TableCell>
                        <TableCell>{format(new Date(sub.start_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-warning font-medium">
                          {format(new Date(sub.end_date), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                            {user.subscription_tier}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(user.created_at), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Update pricing, UPI details, and tier limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">UPI Payment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>UPI ID</Label>
                      <Input
                        value={platformSettings.upi_details?.upi_id || ''}
                        onChange={(e) => setPlatformSettings({
                          ...platformSettings,
                          upi_details: { ...platformSettings.upi_details, upi_id: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={platformSettings.upi_details?.display_name || ''}
                        onChange={(e) => setPlatformSettings({
                          ...platformSettings,
                          upi_details: { ...platformSettings.upi_details, display_name: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Pricing (in INR)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monthly Price</Label>
                      <Input
                        type="number"
                        value={platformSettings.pricing?.monthly || 49}
                        onChange={(e) => setPlatformSettings({
                          ...platformSettings,
                          pricing: { ...platformSettings.pricing, monthly: Number(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Yearly Price</Label>
                      <Input
                        type="number"
                        value={platformSettings.pricing?.yearly || 499}
                        onChange={(e) => setPlatformSettings({
                          ...platformSettings,
                          pricing: { ...platformSettings.pricing, yearly: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Tier Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Free: Max Playlists</Label>
                      <Input
                        type="number"
                        value={platformSettings.tier_limits?.free?.playlists || 3}
                        onChange={(e) => setPlatformSettings({
                          ...platformSettings,
                          tier_limits: {
                            ...platformSettings.tier_limits,
                            free: { ...platformSettings.tier_limits.free, playlists: Number(e.target.value) }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Free: AI Notes/Month</Label>
                      <Input
                        type="number"
                        value={platformSettings.tier_limits?.free?.ai_notes || 5}
                        onChange={(e) => setPlatformSettings({
                          ...platformSettings,
                          tier_limits: {
                            ...platformSettings.tier_limits,
                            free: { ...platformSettings.tier_limits.free, ai_notes: Number(e.target.value) }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Premium: AI Notes/Month</Label>
                      <Input
                        type="number"
                        value={platformSettings.tier_limits?.premium?.ai_notes || 20}
                        onChange={(e) => setPlatformSettings({
                          ...platformSettings,
                          tier_limits: {
                            ...platformSettings.tier_limits,
                            premium: { ...platformSettings.tier_limits.premium, ai_notes: Number(e.target.value) }
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Request Review Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Payment Request</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="font-medium">{selectedRequest.full_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <p className="font-medium">{selectedRequest.phone_number}</p>
                  </div>
                  <div>
                    <Label>UPI Transaction ID</Label>
                    <p className="font-medium font-mono">{selectedRequest.upi_transaction_id}</p>
                  </div>
                  <div>
                    <Label>Amount Paid</Label>
                    <p className="font-medium text-success">₹{selectedRequest.amount_paid}</p>
                  </div>
                  <div>
                    <Label>Payment Date</Label>
                    <p className="font-medium">{format(new Date(selectedRequest.payment_date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                <div>
                  <Label>Payment Screenshot</Label>
                  <img 
                    src={selectedRequest.payment_screenshot_url} 
                    alt="Payment proof" 
                    className="w-full rounded-lg border mt-2"
                  />
                </div>

                <div>
                  <Label>Admin Notes (Optional)</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this verification..."
                  />
                </div>

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(selectedRequest.id, selectedRequest.user_id, selectedRequest.plan_id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Activate
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedRequest.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

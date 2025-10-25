import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Users, ArrowLeft, Settings as SettingsIcon, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
  });
  const [users, setUsers] = useState<any[]>([]);

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
      loadUsers(),
    ]);
    setIsLoading(false);
  };

  const loadStats = async () => {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    setStats({ totalUsers: totalUsers || 0 });
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .order('created_at', { ascending: false });

    setUsers(data || []);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-muted-foreground">Checking admin access...</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-muted-foreground">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-xl">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your platform</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-1 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Platform Statistics</CardTitle>
                  <CardDescription>Overview of your platform</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user accounts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
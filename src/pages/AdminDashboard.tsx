import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, TrendingUp, Target, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SalesRepStats {
  id: string;
  full_name: string;
  base_salary: number;
  total_deals: number;
  total_deposit: number;
  monthly_target?: number;
  achievement_percentage?: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const [salesReps, setSalesReps] = useState<SalesRepStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalReps: 0,
    totalDeals: 0,
    totalDeposit: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("אין לך הרשאות גישה לדף זה");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllSalesRepsData();
    }
  }, [user, isAdmin]);

  const fetchAllSalesRepsData = async () => {
    try {
      setLoading(true);

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Get all deals
      const { data: deals, error: dealsError } = await supabase
        .from("deals")
        .select("*");

      if (dealsError) throw dealsError;

      // Get current month targets
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const { data: targets, error: targetsError } = await supabase
        .from("monthly_targets")
        .select("*")
        .eq("month", currentMonth)
        .eq("year", currentYear);

      if (targetsError) throw targetsError;

      // Calculate stats for each sales rep
      const repsStats: SalesRepStats[] = profiles.map((profile) => {
        const repDeals = deals?.filter((d) => d.sales_rep_id === profile.id) || [];
        const totalDeposit = repDeals.reduce((sum, deal) => sum + Number(deal.initial_deposit || 0), 0);
        const target = targets?.find((t) => t.sales_rep_id === profile.id);
        const achievementPercentage = target
          ? (totalDeposit / Number(target.general_target_amount)) * 100
          : 0;

        return {
          id: profile.id,
          full_name: profile.full_name,
          base_salary: Number(profile.base_salary),
          total_deals: repDeals.length,
          total_deposit: totalDeposit,
          monthly_target: target ? Number(target.general_target_amount) : undefined,
          achievement_percentage: achievementPercentage,
        };
      });

      setSalesReps(repsStats);

      // Calculate total stats
      setTotalStats({
        totalReps: profiles.length,
        totalDeals: deals?.length || 0,
        totalDeposit: deals?.reduce((sum, deal) => sum + Number(deal.initial_deposit || 0), 0) || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading || roleLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">דשבורד מנהל</h1>
            <p className="text-muted-foreground">סקירה כללית של כל נציגי המכירות</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              חזרה לדף הראשי
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="ml-2 h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ נציגים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalReps}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ עסקאות</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalDeals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ הפקדות</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalStats.totalDeposit.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ממוצע לנציג</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalStats.totalReps > 0 
                  ? Math.round(totalStats.totalDeposit / totalStats.totalReps).toLocaleString()
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Reps Table */}
        <Card>
          <CardHeader>
            <CardTitle>פירוט נציגי מכירות</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">טוען נתונים...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">משכורת בסיס</TableHead>
                    <TableHead className="text-right">עסקאות</TableHead>
                    <TableHead className="text-right">סה"כ הפקדות</TableHead>
                    <TableHead className="text-right">יעד חודשי</TableHead>
                    <TableHead className="text-right">אחוז השגה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReps.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-medium">{rep.full_name}</TableCell>
                      <TableCell>${rep.base_salary.toLocaleString()}</TableCell>
                      <TableCell>{rep.total_deals}</TableCell>
                      <TableCell>${rep.total_deposit.toLocaleString()}</TableCell>
                      <TableCell>
                        {rep.monthly_target 
                          ? `$${rep.monthly_target.toLocaleString()}`
                          : "לא הוגדר"}
                      </TableCell>
                      <TableCell>
                        {rep.monthly_target ? (
                          <span
                            className={
                              rep.achievement_percentage >= 100
                                ? "text-green-600 font-bold"
                                : rep.achievement_percentage >= 75
                                ? "text-yellow-600"
                                : "text-red-600"
                            }
                          >
                            {rep.achievement_percentage.toFixed(1)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

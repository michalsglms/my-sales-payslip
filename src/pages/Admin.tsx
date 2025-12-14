import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, LogOut, TrendingUp, Users, DollarSign } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  base_salary: number;
}

interface Deal {
  id: string;
  sales_rep_id: string;
  initial_deposit: number;
  client_type: string;
  traffic_source: string;
  created_at: string;
}

interface SalesRepSummary {
  id: string;
  name: string;
  totalDeals: number;
  totalDeposits: number;
  cfdDeals: number;
  eqDeals: number;
}

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonthYear, setSelectedMonthYear] = useState(`${currentYear}-${currentMonth}`);
  const [selectedYear, selectedMonth] = selectedMonthYear.split('-').map(Number);

  const availableMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthNames = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
      ];
      months.push({
        value: `${year}-${month}`,
        label: `${monthNames[month - 1]} ${year}`,
        year,
        month,
      });
    }
    return months;
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin && user) {
      navigate("/");
    }
  }, [isAdmin, roleLoading, user, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin, selectedYear, selectedMonth]);

  const fetchData = async () => {
    setIsLoadingData(true);
    
    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, base_salary");

    if (profilesError) {
      console.error("Admin: error loading profiles", profilesError);
      toast({ title: "שגיאה בטעינת פרופילים", description: profilesError.message, variant: "destructive" });
    } else {
      setProfiles(profilesData ?? []);
    }

    // Fetch deals for selected month
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    
    const { data: dealsData, error: dealsError } = await supabase
      .from("deals")
      .select("id, sales_rep_id, initial_deposit, client_type, traffic_source, created_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (dealsError) {
      console.error("Admin: error loading deals", dealsError);
      toast({ title: "שגיאה בטעינת עסקאות", description: dealsError.message, variant: "destructive" });
    } else {
      setDeals(dealsData ?? []);
    }

    setIsLoadingData(false);
  };

  const salesRepSummaries = useMemo((): SalesRepSummary[] => {
    return profiles.map(profile => {
      const repDeals = deals.filter(d => d.sales_rep_id === profile.id);
      return {
        id: profile.id,
        name: profile.full_name,
        totalDeals: repDeals.length,
        totalDeposits: repDeals.reduce((sum, d) => sum + Number(d.initial_deposit), 0),
        cfdDeals: repDeals.filter(d => d.client_type === "CFD").length,
        eqDeals: repDeals.filter(d => d.client_type === "EQ").length,
      };
    }).sort((a, b) => b.totalDeposits - a.totalDeposits);
  }, [profiles, deals]);

  const totals = useMemo(() => {
    return {
      totalDeals: salesRepSummaries.reduce((sum, s) => sum + s.totalDeals, 0),
      totalDeposits: salesRepSummaries.reduce((sum, s) => sum + s.totalDeposits, 0),
      totalReps: salesRepSummaries.filter(s => s.totalDeals > 0).length,
    };
  }, [salesRepSummaries]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>טוען...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-card shadow-card sticky top-0 z-40 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-gradient-success">פאנל ניהול</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground">סיכום מכירות לפי נציג</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="hover:shadow-card transition-all">
              <ArrowRight className="ml-2 h-4 w-4" />
              חזרה לדף הבית
            </Button>
            <Button variant="outline" onClick={signOut} className="hover:shadow-card transition-all">
              <LogOut className="ml-2 h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Month Selector */}
        <div className="flex justify-between items-center bg-card p-4 rounded-xl shadow-card border animate-fade-in">
          <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
            <SelectTrigger className="w-[200px] font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              {availableMonths.map((month) => (
                <SelectItem key={month.value} value={month.value} className="font-medium">
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <Card className="shadow-card border bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סה״כ עסקאות</p>
                  <p className="text-3xl font-bold text-primary">{totals.totalDeals}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סה״כ הפקדות</p>
                  <p className="text-3xl font-bold text-green-600">₪{totals.totalDeposits.toLocaleString()}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500/40" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">נציגים פעילים</p>
                  <p className="text-3xl font-bold text-blue-600">{totals.totalReps}</p>
                </div>
                <Users className="h-10 w-10 text-blue-500/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Rep Table */}
        <Card className="shadow-card border animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">מכירות לפי נציג - {availableMonths.find(m => m.value === selectedMonthYear)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>טוען נתונים...</p>
              </div>
            ) : salesRepSummaries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>אין נציגים במערכת</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right font-bold">שם הנציג</TableHead>
                      <TableHead className="text-center font-bold">מספר עסקאות</TableHead>
                      <TableHead className="text-center font-bold">עסקאות CFD</TableHead>
                      <TableHead className="text-center font-bold">עסקאות EQ</TableHead>
                      <TableHead className="text-center font-bold">סה״כ הפקדות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesRepSummaries.map((rep) => (
                      <TableRow key={rep.id} className={rep.totalDeals === 0 ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{rep.name}</TableCell>
                        <TableCell className="text-center font-semibold">{rep.totalDeals}</TableCell>
                        <TableCell className="text-center">{rep.cfdDeals}</TableCell>
                        <TableCell className="text-center">{rep.eqDeals}</TableCell>
                        <TableCell className="text-center font-bold text-lg text-green-600">
                          ₪{rep.totalDeposits.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;

import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SalaryCalculator from "@/components/SalaryCalculator";
import DealsList from "@/components/DealsList";
import TargetForm from "@/components/TargetForm";
import TargetProgress from "@/components/TargetProgress";
import ExportToExcel from "@/components/ExportToExcel";
import ImportFromExcel from "@/components/ImportFromExcel";
import ImportKpisFromExcel from "@/components/ImportKpisFromExcel";
import DeleteAllDeals from "@/components/DeleteAllDeals";
import { LogOut, Settings } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [monthlyTargets, setMonthlyTargets] = useState<any[]>([]);
  const [quarterlyTargets, setQuarterlyTargets] = useState<any[]>([]);
  const [kpisBonus, setKpisBonus] = useState(0);
  const [kpisData, setKpisData] = useState<any>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // State for selected month/year
  const [selectedMonthYear, setSelectedMonthYear] = useState(`${currentYear}-${currentMonth}`);
  const [selectedYear, selectedMonth] = selectedMonthYear.split('-').map(Number);

  // Generate list of available months (last 12 months)
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
    if (user) {
      fetchProfile();
      fetchDeals();
      fetchTargets();
      fetchKpis();
    }
  }, [user, selectedYear, selectedMonth]);

  const fetchKpis = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("monthly_kpis")
      .select("*")
      .eq("sales_rep_id", user.id)
      .eq("month", selectedMonth)
      .eq("year", selectedYear)
      .maybeSingle();

    if (data) {
      // Calculate KPIS bonus based on achieved metrics
      let bonus = 0;
      if (data.avg_call_time_minutes) bonus += 600;
      if (data.avg_calls_count) bonus += 600;
      if (data.ppc_conversion_rate) bonus += 600;
      if (data.aff_conversion_rate) bonus += 600;
      // work_excellence is now a percentage (0-100)
      if (data.work_excellence) bonus += Math.round(1600 * (data.work_excellence / 100));
      setKpisBonus(bonus);
      setKpisData(data);
    } else {
      setKpisBonus(0);
      setKpisData(null);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const fetchDeals = async () => {
    if (!user) return;

    setDealsLoading(true);
    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
    const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("sales_rep_id", user.id)
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth)
      .order("created_at", { ascending: false });

    if (data) {
      setDeals(data);
    }
    setDealsLoading(false);
  };

  const fetchTargets = async () => {
    if (!user) return;

    // Fetch monthly targets
    const { data: monthlyData } = await supabase
      .from("monthly_targets")
      .select("*")
      .eq("sales_rep_id", user.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (monthlyData) {
      setMonthlyTargets(monthlyData);
    }

    // Fetch quarterly targets
    const { data: quarterlyData } = await supabase
      .from("quarterly_targets")
      .select("*")
      .eq("sales_rep_id", user.id)
      .order("year", { ascending: false })
      .order("quarter", { ascending: false });

    if (quarterlyData) {
      setQuarterlyTargets(quarterlyData);
    }
  };

  // Calculate bonuses for the selected month
  const { monthlyGeneralBonus, monthlyCfdBonus, quarterlyGeneralBonus, quarterlyCfdBonus } = useMemo(() => {
    const selectedQuarter = Math.ceil(selectedMonth / 3);
    
    // Get selected month's target
    const monthlyTarget = monthlyTargets.find(
      (t) => t.month === selectedMonth && t.year === selectedYear
    );

    // Get selected quarter's target
    const quarterlyTarget = quarterlyTargets.find(
      (t) => t.quarter === selectedQuarter && t.year === selectedYear
    );

    // Count deals for selected month
    const monthlyDeals = deals.filter((deal: any) => deal.is_new_client);
    const monthlyTotalCount = monthlyDeals.length;
    const monthlyCFDCount = monthlyDeals.filter((d: any) => d.client_type === "CFD").length;

    // Count deals for selected quarter
    const quarterlyDeals = deals.filter((deal: any) => {
      const dealDate = new Date(deal.created_at);
      const dealMonth = dealDate.getMonth() + 1;
      const quarterDealStartMonth = (selectedQuarter - 1) * 3 + 1;
      return (
        dealMonth >= quarterDealStartMonth &&
        dealMonth < quarterDealStartMonth + 3 &&
        dealDate.getFullYear() === selectedYear &&
        deal.is_new_client
      );
    });

    const quarterlyTotalCount = quarterlyDeals.length;
    const quarterlyCFDCount = quarterlyDeals.filter((d: any) => d.client_type === "CFD").length;

    // Calculate percentages
    const monthlyPercentage = monthlyTarget
      ? (monthlyTotalCount / monthlyTarget.general_target_amount) * 100
      : 0;
    const monthlyCFDPercentage = monthlyTarget
      ? (monthlyCFDCount / monthlyTarget.cfd_target_amount) * 100
      : 0;

    const quarterlyPercentage = quarterlyTarget
      ? (quarterlyTotalCount / quarterlyTarget.general_target_amount) * 100
      : 0;
    const quarterlyCFDPercentage = quarterlyTarget
      ? (quarterlyCFDCount / quarterlyTarget.cfd_target_amount) * 100
      : 0;

    // Calculate monthly bonuses - separated by general and CFD
    let calculatedMonthlyGeneralBonus = 0;
    let calculatedMonthlyCfdBonus = 0;
    if (monthlyTarget) {
      // General target bonus
      if (monthlyPercentage >= 100) {
        calculatedMonthlyGeneralBonus += 2000;
      } else if (monthlyPercentage >= 90) {
        calculatedMonthlyGeneralBonus += 1000;
      }

      // CFD specific bonus
      if (monthlyCFDPercentage >= 100) {
        calculatedMonthlyCfdBonus += 1000;
      } else if (monthlyCFDPercentage >= 90) {
        calculatedMonthlyCfdBonus += 500;
      }

      // 70% bonus (valid until 30.9.25) - goes to general
      const now = new Date();
      const validUntil = new Date(2025, 8, 30);
      if (now <= validUntil && monthlyPercentage >= 70) {
        calculatedMonthlyGeneralBonus += 2000;
      }
    }

    // Calculate quarterly bonuses - separated by general and CFD (starts from July 2025)
    let calculatedQuarterlyGeneralBonus = 0;
    let calculatedQuarterlyCfdBonus = 0;
    const now = new Date();
    const quarterlyStartDate = new Date(2025, 6, 1);
    if (quarterlyTarget && now >= quarterlyStartDate) {
      // General target bonus
      if (quarterlyPercentage >= 100) {
        calculatedQuarterlyGeneralBonus += 6000;
      } else if (quarterlyPercentage >= 90) {
        calculatedQuarterlyGeneralBonus += 3000;
      }

      // CFD specific bonus
      if (quarterlyCFDPercentage >= 100) {
        calculatedQuarterlyCfdBonus += 3000;
      } else if (quarterlyCFDPercentage >= 90) {
        calculatedQuarterlyCfdBonus += 1500;
      }
    }

    return {
      monthlyGeneralBonus: calculatedMonthlyGeneralBonus,
      monthlyCfdBonus: calculatedMonthlyCfdBonus,
      quarterlyGeneralBonus: calculatedQuarterlyGeneralBonus,
      quarterlyCfdBonus: calculatedQuarterlyCfdBonus,
    };
  }, [deals, monthlyTargets, quarterlyTargets, selectedYear, selectedMonth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>טוען...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-card shadow-card sticky top-0 z-40 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-gradient-success">המדד להצלחה שלי</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground">שלום, {profile.full_name} 👋</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" asChild className="hover:shadow-card transition-all">
                <Link to="/admin">
                  <Settings className="ml-2 h-4 w-4" />
                  פאנל ניהול
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={signOut} className="hover:shadow-card transition-all">
              <LogOut className="ml-2 h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
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
          <div className="flex gap-2">
            {isAdmin && (
              <ImportKpisFromExcel 
                month={selectedMonth} 
                year={selectedYear} 
                onImportComplete={fetchKpis} 
              />
            )}
            <ImportFromExcel userId={user.id} onImportComplete={fetchDeals} />
            <ExportToExcel deals={deals} userName={profile.full_name} />
            <DeleteAllDeals userId={user.id} onDealsDeleted={fetchDeals} />
          </div>
        </div>

        <TargetProgress
          deals={deals}
          monthlyTargets={monthlyTargets}
          quarterlyTargets={quarterlyTargets}
          onTargetUpdated={fetchTargets}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          userId={user.id}
        />

        <SalaryCalculator
          baseSalary={parseFloat(profile.base_salary)}
          deductionAmount={parseFloat(profile.deduction_amount || "0")}
          deals={deals}
          monthlyGeneralBonus={monthlyGeneralBonus}
          monthlyCfdBonus={monthlyCfdBonus}
          quarterlyGeneralBonus={quarterlyGeneralBonus}
          quarterlyCfdBonus={quarterlyCfdBonus}
          userId={user.id}
          onSalaryUpdated={fetchProfile}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          kpisBonus={kpisBonus}
          kpisData={kpisData}
        />

        {dealsLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p>טוען עסקאות...</p>
            </CardContent>
          </Card>
        ) : (
          <DealsList deals={deals} onDealsChange={fetchDeals} userId={user.id} />
        )}
      </main>
    </div>
  );
};

export default Index;

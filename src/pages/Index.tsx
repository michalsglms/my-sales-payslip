import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
import DealForm from "@/components/DealForm";
import DealsList from "@/components/DealsList";
import TargetForm from "@/components/TargetForm";
import TargetProgress from "@/components/TargetProgress";
import ExportToExcel from "@/components/ExportToExcel";
import EditBaseSalary from "@/components/EditBaseSalary";
import { LogOut } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [monthlyTargets, setMonthlyTargets] = useState<any[]>([]);
  const [quarterlyTargets, setQuarterlyTargets] = useState<any[]>([]);

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
    }
  }, [user, selectedYear, selectedMonth]);

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
  const { monthlyBonus, quarterlyBonus } = useMemo(() => {
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

    // Calculate monthly bonuses
    let calculatedMonthlyBonus = 0;
    if (monthlyTarget) {
      if (monthlyPercentage >= 100) {
        calculatedMonthlyBonus += 2000;
      } else if (monthlyPercentage >= 90) {
        calculatedMonthlyBonus += 1000;
      }

      if (monthlyCFDPercentage >= 100) {
        calculatedMonthlyBonus += 1000;
      } else if (monthlyCFDPercentage >= 90) {
        calculatedMonthlyBonus += 500;
      }

      // 70% bonus (valid until 30.9.25)
      const now = new Date();
      const validUntil = new Date(2025, 8, 30);
      if (now <= validUntil && monthlyPercentage >= 70) {
        calculatedMonthlyBonus += 2000;
      }
    }

    // Calculate quarterly bonuses (starts from July 2025)
    let calculatedQuarterlyBonus = 0;
    const now = new Date();
    const quarterlyStartDate = new Date(2025, 6, 1);
    if (quarterlyTarget && now >= quarterlyStartDate) {
      if (quarterlyPercentage >= 100) {
        calculatedQuarterlyBonus += 6000;
      } else if (quarterlyPercentage >= 90) {
        calculatedQuarterlyBonus += 3000;
      }

      if (quarterlyCFDPercentage >= 100) {
        calculatedQuarterlyBonus += 3000;
      } else if (quarterlyCFDPercentage >= 90) {
        calculatedQuarterlyBonus += 1500;
      }
    }

    return {
      monthlyBonus: calculatedMonthlyBonus,
      quarterlyBonus: calculatedQuarterlyBonus,
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
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">מערכת ניהול שכר</h1>
            <p className="text-sm text-muted-foreground">שלום, {profile.full_name}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="ml-2 h-4 w-4" />
            התנתק
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {availableMonths.find(m => m.value === selectedMonthYear)?.label || 'חודש נוכחי'}
            </h2>
            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <EditBaseSalary 
              userId={user.id} 
              currentBaseSalary={parseFloat(profile.base_salary)}
              onSalaryUpdated={fetchProfile}
            />
            <ExportToExcel deals={deals} userName={profile.full_name} />
            <TargetForm userId={user.id} onTargetAdded={fetchTargets} />
            <DealForm userId={user.id} onDealAdded={fetchDeals} />
          </div>
        </div>

        <TargetProgress
          deals={deals}
          monthlyTargets={monthlyTargets}
          quarterlyTargets={quarterlyTargets}
          onTargetUpdated={fetchTargets}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />

        <SalaryCalculator
          baseSalary={parseFloat(profile.base_salary)}
          deals={deals}
          monthlyBonus={monthlyBonus}
          quarterlyBonus={quarterlyBonus}
        />

        {dealsLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p>טוען עסקאות...</p>
            </CardContent>
          </Card>
        ) : (
          <DealsList deals={deals} onDealsChange={fetchDeals} />
        )}
      </main>
    </div>
  );
};

export default Index;

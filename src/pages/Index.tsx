import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalaryCalculator from "@/components/SalaryCalculator";
import DealForm from "@/components/DealForm";
import DealsList from "@/components/DealsList";
import TargetForm from "@/components/TargetForm";
import TargetProgress from "@/components/TargetProgress";
import { LogOut } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [monthlyTargets, setMonthlyTargets] = useState<any[]>([]);
  const [quarterlyTargets, setQuarterlyTargets] = useState<any[]>([]);

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
  }, [user]);

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
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("sales_rep_id", user.id)
      .gte("created_at", startOfMonth)
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
          <h2 className="text-xl font-semibold">חודש נוכחי</h2>
          <div className="flex gap-2">
            <TargetForm userId={user.id} onTargetAdded={fetchTargets} />
            <DealForm userId={user.id} onDealAdded={fetchDeals} />
          </div>
        </div>

        <TargetProgress
          deals={deals}
          monthlyTargets={monthlyTargets}
          quarterlyTargets={quarterlyTargets}
        />

        <SalaryCalculator
          baseSalary={parseFloat(profile.base_salary)}
          deals={deals}
        />

        {dealsLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p>טוען עסקאות...</p>
            </CardContent>
          </Card>
        ) : (
          <DealsList deals={deals} />
        )}
      </main>
    </div>
  );
};

export default Index;

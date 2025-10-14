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
import { ArrowRight, LogOut } from "lucide-react";
import ImportKpisFromExcel from "@/components/ImportKpisFromExcel";

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [kpisData, setKpisData] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
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
    if (!roleLoading && !isAdmin && user) {
      navigate("/");
    }
  }, [isAdmin, roleLoading, user, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchProfiles();
      fetchAllKpis();
    }
  }, [user, isAdmin, selectedYear, selectedMonth]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) {
      console.error("Admin: error loading profiles", error);
      toast({ title: "שגיאה בטעינת פרופילים", description: error.message, variant: "destructive" });
      setProfiles([]);
      return;
    }

    console.log("Admin: loaded profiles", data?.length ?? 0);
    setProfiles(data ?? []);
  };
  const fetchAllKpis = async () => {
    const { data, error } = await supabase
      .from("monthly_kpis")
      .select("*")
      .eq("month", selectedMonth)
      .eq("year", selectedYear);

    if (error) {
      console.error("Admin: error loading KPIs", error);
      toast({ title: "שגיאה בטעינת KPIs", description: error.message, variant: "destructive" });
      setKpisData([]);
      return;
    }

    console.log("Admin: loaded KPIs", data?.length ?? 0, { selectedMonth, selectedYear });
    setKpisData(data ?? []);
  };
  const getProfileName = (salesRepId: string) => {
    const profile = profiles.find(p => p.id === salesRepId);
    return profile ? profile.full_name : "לא ידוע";
  };

  const calculateKpisBonus = (kpi: any) => {
    let bonus = 0;
    if (kpi.avg_call_time_minutes) bonus += 600;
    if (kpi.avg_calls_count) bonus += 600;
    if (kpi.ppc_conversion_rate) bonus += 600;
    if (kpi.aff_conversion_rate) bonus += 600;
    if (kpi.work_excellence) bonus += Math.round(1600 * (kpi.work_excellence / 100));
    return bonus;
  };

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
              <span className="text-gradient-success">פאנל ניהול - KPIs</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground">צפייה במדדי ביצועים של כל הנציגים</p>
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
          <ImportKpisFromExcel 
            month={selectedMonth} 
            year={selectedYear} 
            onImportComplete={fetchAllKpis} 
          />
        </div>

        <Card className="shadow-card border">
          <CardHeader>
            <CardTitle className="text-2xl">מדדי KPIs - {availableMonths.find(m => m.value === selectedMonthYear)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            {kpisData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>אין מדדי KPIs לחודש זה</p>
                <p className="text-sm mt-2">ניתן לייבא נתונים באמצעות הכפתור "ייבוא KPIs"</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right font-bold">שם הנציג</TableHead>
                      <TableHead className="text-center font-bold">זמן שיחה ממוצע</TableHead>
                      <TableHead className="text-center font-bold">מספר שיחות ממוצע</TableHead>
                      <TableHead className="text-center font-bold">שיעור המרה PPC</TableHead>
                      <TableHead className="text-center font-bold">שיעור המרה AFF</TableHead>
                      <TableHead className="text-center font-bold">מצוינות בעבודה</TableHead>
                      <TableHead className="text-center font-bold">סה"כ בונוס</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpisData.map((kpi) => (
                      <TableRow key={kpi.id}>
                        <TableCell className="font-medium">{getProfileName(kpi.sales_rep_id)}</TableCell>
                        <TableCell className="text-center">
                          {kpi.avg_call_time_minutes ? (
                            <span className="text-green-600 font-semibold">✓ (600₪)</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {kpi.avg_calls_count ? (
                            <span className="text-green-600 font-semibold">✓ (600₪)</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {kpi.ppc_conversion_rate ? (
                            <span className="text-green-600 font-semibold">✓ (600₪)</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {kpi.aff_conversion_rate ? (
                            <span className="text-green-600 font-semibold">✓ (600₪)</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {kpi.work_excellence ? (
                            <span className="text-blue-600 font-semibold">
                              {kpi.work_excellence}% ({Math.round(1600 * (kpi.work_excellence / 100))}₪)
                            </span>
                          ) : (
                            <span className="text-red-600">0%</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-lg text-green-600">
                          {calculateKpisBonus(kpi)}₪
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

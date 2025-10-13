import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, TrendingUp, Target, Award, Briefcase, Pencil } from "lucide-react";
import EditTargetDialog from "@/components/EditTargetDialog";
import TargetForm from "@/components/TargetForm";

interface Deal {
  id: string;
  client_type: "EQ" | "CFD";
  created_at: string;
  is_new_client: boolean;
}

interface MonthlyTarget {
  id: string;
  month: number;
  year: number;
  general_target_amount: number;
  cfd_target_amount: number;
  workdays_in_period?: number;
}

interface QuarterlyTarget {
  id: string;
  quarter: number;
  year: number;
  general_target_amount: number;
  cfd_target_amount: number;
  workdays_in_period?: number;
}

interface TargetProgressProps {
  deals: Deal[];
  monthlyTargets: MonthlyTarget[];
  quarterlyTargets: QuarterlyTarget[];
  onTargetUpdated: () => void;
  selectedYear: number;
  selectedMonth: number;
  userId: string;
}

const TargetProgress = ({ deals, monthlyTargets, quarterlyTargets, onTargetUpdated, selectedYear, selectedMonth, userId }: TargetProgressProps) => {
  const [targetFormOpen, setTargetFormOpen] = useState(false);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Calculate the quarter based on selected month
  const selectedQuarter = Math.ceil(selectedMonth / 3);
  const selectedQuarterYear = `${selectedYear}-${selectedQuarter}`;

  // Generate list of available quarters (last 8 quarters)
  const availableQuarters = useMemo(() => {
    const quarters = [];
    for (let i = 0; i < 8; i++) {
      const quarterIndex = currentQuarter - 1 - i;
      const year = currentYear + Math.floor(quarterIndex / 4);
      const quarter = ((quarterIndex % 4) + 4) % 4 + 1;
      quarters.push({
        value: `${year}-${quarter}`,
        label: `רבעון ${quarter}/${year}`,
        year,
        quarter,
      });
    }
    return quarters;
  }, [currentYear, currentQuarter]);

  const [selectedQuarterYearNum, selectedQuarterNum] = selectedQuarterYear.split('-').map(Number);

  // Calculate workdays in a period (excluding Friday and Saturday)
  const calculateWorkdays = (startDate: Date, endDate: Date): number => {
    let workdays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // 5 = Friday, 6 = Saturday
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        workdays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workdays;
  };

  const calculations = useMemo(() => {
    const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
    const isCurrentQuarter = selectedQuarterYearNum === currentYear && selectedQuarterNum === currentQuarter;

    // Calculate selected month workdays
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 0);
    const selectedMonthWorkdays = calculateWorkdays(monthStart, monthEnd);
    
    // Calculate workdays passed so far (only for current month)
    const today = new Date();
    const monthWorkdaysPassed = isCurrentMonth ? calculateWorkdays(monthStart, today) : selectedMonthWorkdays;
    const monthWorkdaysRemaining = isCurrentMonth ? selectedMonthWorkdays - monthWorkdaysPassed : 0;

    // Calculate selected quarter workdays
    const quarterStartMonth = (selectedQuarterNum - 1) * 3;
    const quarterStart = new Date(selectedQuarterYearNum, quarterStartMonth, 1);
    const quarterEnd = new Date(selectedQuarterYearNum, quarterStartMonth + 3, 0);
    const selectedQuarterWorkdays = calculateWorkdays(quarterStart, quarterEnd);
    
    // Calculate workdays passed so far (only for current quarter)
    const quarterWorkdaysPassed = isCurrentQuarter ? calculateWorkdays(quarterStart, today) : selectedQuarterWorkdays;
    const quarterWorkdaysRemaining = isCurrentQuarter ? selectedQuarterWorkdays - quarterWorkdaysPassed : 0;

    // Get selected month's target
    const monthlyTarget = monthlyTargets.find(
      (t) => t.month === selectedMonth && t.year === selectedYear
    );

    // Get selected quarter's target
    const quarterlyTarget = quarterlyTargets.find(
      (t) => t.quarter === selectedQuarterNum && t.year === selectedQuarterYearNum
    );

    // Count deals for selected month (deals are already filtered by parent)
    const monthlyDeals = deals.filter((deal) => deal.is_new_client);

    // Count deals for selected quarter
    const quarterlyDeals = deals.filter((deal) => {
      const dealDate = new Date(deal.created_at);
      const dealMonth = dealDate.getMonth() + 1;
      const quarterDealStartMonth = (selectedQuarterNum - 1) * 3 + 1;
      return (
        dealMonth >= quarterDealStartMonth &&
        dealMonth < quarterDealStartMonth + 3 &&
        dealDate.getFullYear() === selectedQuarterYearNum &&
        deal.is_new_client
      );
    });

    const monthlyTotalCount = monthlyDeals.length;
    const monthlyCFDCount = monthlyDeals.filter((d) => d.client_type === "CFD").length;
    const monthlyPercentage = monthlyTarget
      ? (monthlyTotalCount / monthlyTarget.general_target_amount) * 100
      : 0;
    const monthlyCFDPercentage = monthlyTarget
      ? (monthlyCFDCount / monthlyTarget.cfd_target_amount) * 100
      : 0;

    // Calculate monthly projection (only for current month)
    const monthlyDailyRate = monthWorkdaysPassed > 0 ? monthlyTotalCount / monthWorkdaysPassed : 0;
    const monthlyCFDDailyRate = monthWorkdaysPassed > 0 ? monthlyCFDCount / monthWorkdaysPassed : 0;
    const monthlyProjectedTotal = isCurrentMonth && monthWorkdaysPassed > 0 
      ? Math.round(monthlyTotalCount + (monthlyDailyRate * monthWorkdaysRemaining))
      : 0;
    const monthlyProjectedCFD = isCurrentMonth && monthWorkdaysPassed > 0
      ? Math.round(monthlyCFDCount + (monthlyCFDDailyRate * monthWorkdaysRemaining))
      : 0;
    const monthlyProjectedPercentage = monthlyTarget
      ? (monthlyProjectedTotal / monthlyTarget.general_target_amount) * 100
      : 0;
    const monthlyProjectedCFDPercentage = monthlyTarget
      ? (monthlyProjectedCFD / monthlyTarget.cfd_target_amount) * 100
      : 0;

    const quarterlyTotalCount = quarterlyDeals.length;
    const quarterlyCFDCount = quarterlyDeals.filter((d) => d.client_type === "CFD").length;
    const quarterlyPercentage = quarterlyTarget
      ? (quarterlyTotalCount / quarterlyTarget.general_target_amount) * 100
      : 0;
    const quarterlyCFDPercentage = quarterlyTarget
      ? (quarterlyCFDCount / quarterlyTarget.cfd_target_amount) * 100
      : 0;

    // Calculate quarterly projection (only for current quarter)
    const quarterlyDailyRate = quarterWorkdaysPassed > 0 ? quarterlyTotalCount / quarterWorkdaysPassed : 0;
    const quarterlyCFDDailyRate = quarterWorkdaysPassed > 0 ? quarterlyCFDCount / quarterWorkdaysPassed : 0;
    const quarterlyProjectedTotal = isCurrentQuarter && quarterWorkdaysPassed > 0
      ? Math.round(quarterlyTotalCount + (quarterlyDailyRate * quarterWorkdaysRemaining))
      : 0;
    const quarterlyProjectedCFD = isCurrentQuarter && quarterWorkdaysPassed > 0
      ? Math.round(quarterlyCFDCount + (quarterlyCFDDailyRate * quarterWorkdaysRemaining))
      : 0;
    const quarterlyProjectedPercentage = quarterlyTarget
      ? (quarterlyProjectedTotal / quarterlyTarget.general_target_amount) * 100
      : 0;
    const quarterlyProjectedCFDPercentage = quarterlyTarget
      ? (quarterlyProjectedCFD / quarterlyTarget.cfd_target_amount) * 100
      : 0;

    // Calculate monthly bonuses
    let monthlyBonus = 0;
    if (monthlyTarget) {
      // General target bonus
      if (monthlyPercentage >= 100) {
        monthlyBonus += 2000;
      } else if (monthlyPercentage >= 90) {
        monthlyBonus += 1000;
      }

      // CFD specific bonus
      if (monthlyCFDPercentage >= 100) {
        monthlyBonus += 1000;
      } else if (monthlyCFDPercentage >= 90) {
        monthlyBonus += 500;
      }

      // 70% bonus (valid until 30.9.25)
      const validUntil = new Date(2025, 8, 30); // September 30, 2025
      if (now <= validUntil && monthlyPercentage >= 70) {
        monthlyBonus += 2000;
      }
    }

    // Calculate projected monthly bonus (based on projected percentages)
    let monthlyProjectedBonus = 0;
    if (monthlyTarget && isCurrentMonth && monthWorkdaysPassed > 0) {
      // General target bonus
      if (monthlyProjectedPercentage >= 100) {
        monthlyProjectedBonus += 2000;
      } else if (monthlyProjectedPercentage >= 90) {
        monthlyProjectedBonus += 1000;
      }

      // CFD specific bonus
      if (monthlyProjectedCFDPercentage >= 100) {
        monthlyProjectedBonus += 1000;
      } else if (monthlyProjectedCFDPercentage >= 90) {
        monthlyProjectedBonus += 500;
      }

      // 70% bonus (valid until 30.9.25)
      const validUntil = new Date(2025, 8, 30); // September 30, 2025
      if (now <= validUntil && monthlyProjectedPercentage >= 70) {
        monthlyProjectedBonus += 2000;
      }
    }

    // Calculate quarterly bonuses (starts from July 2025)
    let quarterlyBonus = 0;
    const quarterlyStartDate = new Date(2025, 6, 1); // July 1, 2025
    if (quarterlyTarget && now >= quarterlyStartDate) {
      // General target bonus
      if (quarterlyPercentage >= 100) {
        quarterlyBonus += 6000;
      } else if (quarterlyPercentage >= 90) {
        quarterlyBonus += 3000;
      }

      // CFD specific bonus
      if (quarterlyCFDPercentage >= 100) {
        quarterlyBonus += 3000;
      } else if (quarterlyCFDPercentage >= 90) {
        quarterlyBonus += 1500;
      }
    }

    // Calculate projected quarterly bonus (based on projected percentages)
    let quarterlyProjectedBonus = 0;
    if (quarterlyTarget && now >= quarterlyStartDate && isCurrentQuarter && quarterWorkdaysPassed > 0) {
      // General target bonus
      if (quarterlyProjectedPercentage >= 100) {
        quarterlyProjectedBonus += 6000;
      } else if (quarterlyProjectedPercentage >= 90) {
        quarterlyProjectedBonus += 3000;
      }

      // CFD specific bonus
      if (quarterlyProjectedCFDPercentage >= 100) {
        quarterlyProjectedBonus += 3000;
      } else if (quarterlyProjectedCFDPercentage >= 90) {
        quarterlyProjectedBonus += 1500;
      }
    }

    return {
      monthly: {
        target: monthlyTarget,
        totalCount: monthlyTotalCount,
        cfdCount: monthlyCFDCount,
        totalPercentage: Math.min(monthlyPercentage, 100),
        cfdPercentage: Math.min(monthlyCFDPercentage, 100),
        bonus: monthlyBonus,
        projectedBonus: monthlyProjectedBonus,
        workdays: monthlyTarget?.workdays_in_period || selectedMonthWorkdays,
        workdaysPassed: monthWorkdaysPassed,
        workdaysRemaining: monthWorkdaysRemaining,
        projectedTotal: monthlyProjectedTotal,
        projectedCFD: monthlyProjectedCFD,
        projectedPercentage: Math.min(monthlyProjectedPercentage, 100),
        projectedCFDPercentage: Math.min(monthlyProjectedCFDPercentage, 100),
        dailyRate: monthlyDailyRate,
        isCurrentPeriod: isCurrentMonth,
      },
      quarterly: {
        target: quarterlyTarget,
        totalCount: quarterlyTotalCount,
        cfdCount: quarterlyCFDCount,
        totalPercentage: Math.min(quarterlyPercentage, 100),
        cfdPercentage: Math.min(quarterlyCFDPercentage, 100),
        bonus: quarterlyBonus,
        projectedBonus: quarterlyProjectedBonus,
        workdays: quarterlyTarget?.workdays_in_period || selectedQuarterWorkdays,
        workdaysPassed: quarterWorkdaysPassed,
        workdaysRemaining: quarterWorkdaysRemaining,
        projectedTotal: quarterlyProjectedTotal,
        projectedCFD: quarterlyProjectedCFD,
        projectedPercentage: Math.min(quarterlyProjectedPercentage, 100),
        projectedCFDPercentage: Math.min(quarterlyProjectedCFDPercentage, 100),
        dailyRate: quarterlyDailyRate,
        isCurrentPeriod: isCurrentQuarter,
      },
    };
  }, [deals, monthlyTargets, quarterlyTargets, selectedYear, selectedMonth, selectedQuarterYearNum, selectedQuarterNum, currentYear, currentMonth, currentQuarter]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className={!calculations.monthly.target ? "cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed" : ""}
          onClick={() => !calculations.monthly.target && setTargetFormOpen(true)}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">יעד חודשי</CardTitle>
              </div>
              {calculations.monthly.target && (
                <EditTargetDialog
                  targetId={calculations.monthly.target.id}
                  targetType="monthly"
                  currentGeneralTarget={calculations.monthly.target.general_target_amount}
                  currentCfdTarget={calculations.monthly.target.cfd_target_amount}
                  currentWorkdays={calculations.monthly.target.workdays_in_period}
                  period="חודשי"
                  onTargetUpdated={onTargetUpdated}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4" dir="rtl">
          {calculations.monthly.target ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">ימי עבודה</p>
                  <p className="text-xl font-bold">{calculations.monthly.workdays}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>עברו {calculations.monthly.workdaysPassed}</span>
                    <span>נותרו {calculations.monthly.workdaysRemaining}</span>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">מענק ליעד</p>
                  <p className="text-xl font-bold text-green-600">₪{calculations.monthly.bonus.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">התקדמות נוכחית</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">יעד כללי (EQ + CFD)</span>
                      <span className="text-sm font-bold">
                        {calculations.monthly.totalCount} / {calculations.monthly.target.general_target_amount}
                      </span>
                    </div>
                    <Progress value={calculations.monthly.totalPercentage} className="h-2 mb-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{calculations.monthly.totalPercentage.toFixed(0)}%</span>
                      {calculations.monthly.totalPercentage >= 100 && (
                        <Badge variant="default" className="text-xs">הושג!</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">יעד CFD</span>
                      <span className="text-sm font-bold">
                        {calculations.monthly.cfdCount} / {calculations.monthly.target.cfd_target_amount}
                      </span>
                    </div>
                    <Progress value={calculations.monthly.cfdPercentage} className="h-2 mb-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{calculations.monthly.cfdPercentage.toFixed(0)}%</span>
                      {calculations.monthly.cfdPercentage >= 100 && (
                        <Badge variant="default" className="text-xs">הושג!</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">תחזית לסוף התקופה (קצב: {calculations.monthly.dailyRate.toFixed(1)}/יום)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">יעד כללי צפוי</p>
                    <p className="text-lg font-bold">{calculations.monthly.projectedTotal}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calculations.monthly.projectedPercentage.toFixed(0)}%</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">יעד CFD צפוי</p>
                    <p className="text-lg font-bold">{calculations.monthly.projectedCFD}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calculations.monthly.projectedCFDPercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">לא הוגדר יעד חודשי</p>
              <p className="text-sm text-muted-foreground">לחץ כאן להוספת יעד</p>
            </div>
          )}
          </CardContent>
        </Card>

      <Card
        className={!calculations.quarterly.target ? "cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed" : ""}
        onClick={() => !calculations.quarterly.target && setTargetFormOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">יעד רבעוני - רבעון {selectedQuarterNum}/{selectedQuarterYearNum}</CardTitle>
            </div>
            {calculations.quarterly.target && (
              <EditTargetDialog
                targetId={calculations.quarterly.target.id}
                targetType="quarterly"
                currentGeneralTarget={calculations.quarterly.target.general_target_amount}
                currentCfdTarget={calculations.quarterly.target.cfd_target_amount}
                currentWorkdays={calculations.quarterly.target.workdays_in_period}
                period="רבעוני"
                onTargetUpdated={onTargetUpdated}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          {calculations.quarterly.target ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">ימי עבודה</p>
                  <p className="text-xl font-bold">{calculations.quarterly.workdays}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>עברו {calculations.quarterly.workdaysPassed}</span>
                    <span>נותרו {calculations.quarterly.workdaysRemaining}</span>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">מענק ליעד</p>
                  <p className="text-xl font-bold text-green-600">₪{calculations.quarterly.bonus.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">התקדמות נוכחית</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">יעד כללי (EQ + CFD)</span>
                      <span className="text-sm font-bold">
                        {calculations.quarterly.totalCount} / {calculations.quarterly.target.general_target_amount}
                      </span>
                    </div>
                    <Progress value={calculations.quarterly.totalPercentage} className="h-2 mb-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{calculations.quarterly.totalPercentage.toFixed(0)}%</span>
                      {calculations.quarterly.totalPercentage >= 100 && (
                        <Badge variant="default" className="text-xs">הושג!</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">יעד CFD</span>
                      <span className="text-sm font-bold">
                        {calculations.quarterly.cfdCount} / {calculations.quarterly.target.cfd_target_amount}
                      </span>
                    </div>
                    <Progress value={calculations.quarterly.cfdPercentage} className="h-2 mb-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{calculations.quarterly.cfdPercentage.toFixed(0)}%</span>
                      {calculations.quarterly.cfdPercentage >= 100 && (
                        <Badge variant="default" className="text-xs">הושג!</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">תחזית לסוף התקופה (קצב: {calculations.quarterly.dailyRate.toFixed(1)}/יום)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">יעד כללי צפוי</p>
                    <p className="text-lg font-bold">{calculations.quarterly.projectedTotal}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calculations.quarterly.projectedPercentage.toFixed(0)}%</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">יעד CFD צפוי</p>
                    <p className="text-lg font-bold">{calculations.quarterly.projectedCFD}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calculations.quarterly.projectedCFDPercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">לא הוגדר יעד רבעוני</p>
              <p className="text-sm text-muted-foreground">לחץ כאן להוספת יעד</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <TargetForm
      userId={userId}
      onTargetAdded={onTargetUpdated}
      open={targetFormOpen}
      onOpenChange={setTargetFormOpen}
    />
  </>
  );
};

export default TargetProgress;
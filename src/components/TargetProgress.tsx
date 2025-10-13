import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
}

interface QuarterlyTarget {
  id: string;
  quarter: number;
  year: number;
  general_target_amount: number;
  cfd_target_amount: number;
}

interface TargetProgressProps {
  deals: Deal[];
  monthlyTargets: MonthlyTarget[];
  quarterlyTargets: QuarterlyTarget[];
}

const TargetProgress = ({ deals, monthlyTargets, quarterlyTargets }: TargetProgressProps) => {
  const calculations = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil(currentMonth / 3);

    // Get current month's target
    const monthlyTarget = monthlyTargets.find(
      (t) => t.month === currentMonth && t.year === currentYear
    );

    // Get current quarter's target
    const quarterlyTarget = quarterlyTargets.find(
      (t) => t.quarter === currentQuarter && t.year === currentYear
    );

    // Count deals for current month
    const monthlyDeals = deals.filter((deal) => {
      const dealDate = new Date(deal.created_at);
      return (
        dealDate.getMonth() + 1 === currentMonth &&
        dealDate.getFullYear() === currentYear &&
        deal.is_new_client
      );
    });

    // Count deals for current quarter
    const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
    const quarterlyDeals = deals.filter((deal) => {
      const dealDate = new Date(deal.created_at);
      const dealMonth = dealDate.getMonth() + 1;
      return (
        dealMonth >= quarterStartMonth &&
        dealMonth < quarterStartMonth + 3 &&
        dealDate.getFullYear() === currentYear &&
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

    const quarterlyTotalCount = quarterlyDeals.length;
    const quarterlyCFDCount = quarterlyDeals.filter((d) => d.client_type === "CFD").length;
    const quarterlyPercentage = quarterlyTarget
      ? (quarterlyTotalCount / quarterlyTarget.general_target_amount) * 100
      : 0;
    const quarterlyCFDPercentage = quarterlyTarget
      ? (quarterlyCFDCount / quarterlyTarget.cfd_target_amount) * 100
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

    return {
      monthly: {
        target: monthlyTarget,
        totalCount: monthlyTotalCount,
        cfdCount: monthlyCFDCount,
        totalPercentage: Math.min(monthlyPercentage, 100),
        cfdPercentage: Math.min(monthlyCFDPercentage, 100),
        bonus: monthlyBonus,
      },
      quarterly: {
        target: quarterlyTarget,
        totalCount: quarterlyTotalCount,
        cfdCount: quarterlyCFDCount,
        totalPercentage: Math.min(quarterlyPercentage, 100),
        cfdPercentage: Math.min(quarterlyCFDPercentage, 100),
        bonus: quarterlyBonus,
      },
    };
  }, [deals, monthlyTargets, quarterlyTargets]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>יעד חודשי</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          {calculations.monthly.target ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>יעד כללי (EQ + CFD)</span>
                  <span className="font-medium">
                    {calculations.monthly.totalCount} / {calculations.monthly.target.general_target_amount}
                  </span>
                </div>
                <Progress value={calculations.monthly.totalPercentage} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{calculations.monthly.totalPercentage.toFixed(0)}%</span>
                  {calculations.monthly.totalPercentage >= 100 && (
                    <Badge variant="default">הושג!</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>יעד CFD</span>
                  <span className="font-medium">
                    {calculations.monthly.cfdCount} / {calculations.monthly.target.cfd_target_amount}
                  </span>
                </div>
                <Progress value={calculations.monthly.cfdPercentage} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{calculations.monthly.cfdPercentage.toFixed(0)}%</span>
                  {calculations.monthly.cfdPercentage >= 100 && (
                    <Badge variant="default">הושג!</Badge>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">מענק חודשי פוטנציאלי</span>
                  <span className="text-2xl font-bold text-primary">
                    ₪{calculations.monthly.bonus.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              לא הוגדר יעד חודשי לחודש הנוכחי
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>יעד רבעוני</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          {calculations.quarterly.target ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>יעד כללי (EQ + CFD)</span>
                  <span className="font-medium">
                    {calculations.quarterly.totalCount} /{" "}
                    {calculations.quarterly.target.general_target_amount}
                  </span>
                </div>
                <Progress value={calculations.quarterly.totalPercentage} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{calculations.quarterly.totalPercentage.toFixed(0)}%</span>
                  {calculations.quarterly.totalPercentage >= 100 && (
                    <Badge variant="default">הושג!</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>יעד CFD</span>
                  <span className="font-medium">
                    {calculations.quarterly.cfdCount} /{" "}
                    {calculations.quarterly.target.cfd_target_amount}
                  </span>
                </div>
                <Progress value={calculations.quarterly.cfdPercentage} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{calculations.quarterly.cfdPercentage.toFixed(0)}%</span>
                  {calculations.quarterly.cfdPercentage >= 100 && (
                    <Badge variant="default">הושג!</Badge>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">מענק רבעוני פוטנציאלי</span>
                  <span className="text-2xl font-bold text-primary">
                    ₪{calculations.quarterly.bonus.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              לא הוגדר יעד רבעוני לרבעון הנוכחי
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TargetProgress;
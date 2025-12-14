import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import EditBaseSalary from "./EditBaseSalary";

interface Deal {
  id: string;
  client_type: "EQ" | "CFD";
  traffic_source: "AFF" | "RFF" | "PPC" | "ORG";
  initial_deposit: number;
  is_new_client: boolean;
  completed_within_4_days: boolean;
}

interface KpisData {
  avg_call_time_minutes: boolean;
  avg_calls_count: boolean;
  ppc_conversion_rate: boolean;
  aff_conversion_rate: boolean;
  work_excellence: number | null;
}

interface SalaryCalculatorProps {
  baseSalary: number;
  deductionAmount: number;
  deals: Deal[];
  monthlyGeneralBonus?: number;
  monthlyCfdBonus?: number;
  quarterlyGeneralBonus?: number;
  quarterlyCfdBonus?: number;
  userId: string;
  onSalaryUpdated: () => void;
  selectedMonth: number;
  selectedYear: number;
  kpisBonus?: number;
  kpisData?: KpisData | null;
}

const SalaryCalculator = ({ baseSalary, deductionAmount, deals, monthlyGeneralBonus = 0, monthlyCfdBonus = 0, quarterlyGeneralBonus = 0, quarterlyCfdBonus = 0, userId, onSalaryUpdated, selectedMonth, selectedYear, kpisBonus = 0, kpisData }: SalaryCalculatorProps) => {
  const [isKpisOpen, setIsKpisOpen] = useState(false);
  
  const calculations = useMemo(() => {
    let eqBonus = 0;
    let cfdBonus = 0;
    let eqCount = 0;
    let cfdCount = 0;

    deals.forEach((deal) => {
      if (!deal.is_new_client) return;

      // No commission for EQ deposits under $2,950 (CFD has no minimum)
      if (deal.client_type === "EQ" && deal.initial_deposit < 2950) {
        return;
      }

      let dealBonus = 0;

      // Traffic source bonus
      if (deal.traffic_source === "RFF" || deal.traffic_source === "PPC") {
        dealBonus += 700;
      } else if (deal.traffic_source === "ORG") {
        dealBonus += 400;
      } else if (deal.traffic_source === "AFF") {
        // For AFF: EQ clients with 10K+ get 900, all others get 400
        if (deal.client_type === "EQ" && deal.initial_deposit >= 10000) {
          dealBonus += 900;
        } else {
          dealBonus += 400;
        }
      }

      // Additional 500 ILS bonus ONLY for EQ clients with $10,000+ (not CFD, not AFF)
      if (deal.client_type === "EQ" && deal.initial_deposit >= 10000 && deal.traffic_source !== "AFF") {
        dealBonus += 500;
      }

      // Add to appropriate category
      if (deal.client_type === "EQ") {
        eqBonus += dealBonus;
        eqCount++;
      } else {
        cfdBonus += dealBonus;
        cfdCount++;
      }
    });

    // Check if current month is end of quarter (March=3, June=6, September=9, December=12)
    const isQuarterEnd = selectedMonth === 3 || selectedMonth === 6 || selectedMonth === 9 || selectedMonth === 12;
    const appliedQuarterlyGeneralBonus = isQuarterEnd ? quarterlyGeneralBonus : 0;
    const appliedQuarterlyCfdBonus = isQuarterEnd ? quarterlyCfdBonus : 0;

    const eqBonusAfterDeduction = Math.max(0, eqBonus - deductionAmount);
    const totalBonus = eqBonusAfterDeduction + cfdBonus;
    const targetBonuses = monthlyGeneralBonus + monthlyCfdBonus + appliedQuarterlyGeneralBonus + appliedQuarterlyCfdBonus;
    const totalSalary = baseSalary + totalBonus + targetBonuses + kpisBonus;

    return {
      baseSalary,
      deductionAmount,
      eqBonus,
      eqBonusAfterDeduction,
      cfdBonus,
      eqCount,
      cfdCount,
      totalBonus,
      monthlyGeneralBonus,
      monthlyCfdBonus,
      quarterlyGeneralBonus: appliedQuarterlyGeneralBonus,
      quarterlyCfdBonus: appliedQuarterlyCfdBonus,
      targetBonuses,
      totalSalary,
      newClientsCount: deals.filter(d => d.is_new_client).length,
      isQuarterEnd,
      kpisBonus,
    };
  }, [baseSalary, deductionAmount, deals, monthlyGeneralBonus, monthlyCfdBonus, quarterlyGeneralBonus, quarterlyCfdBonus, selectedMonth, kpisBonus]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>חישוב השכר</CardTitle>
          <EditBaseSalary 
            userId={userId} 
            currentBaseSalary={baseSalary}
            currentDeduction={deductionAmount}
            onSalaryUpdated={onSalaryUpdated}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4" dir="rtl">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">שכר בסיס</p>
            <p className="text-2xl font-bold">₪{calculations.baseSalary.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">לקוחות חדשים</p>
            <p className="text-2xl font-bold">{calculations.newClientsCount}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">סכום הקיזוז</p>
            <p className="text-lg font-bold">₪{calculations.deductionAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground w-[140px]">סך הכל בונוס EQ</span>
            <span className="w-12 text-center font-medium">{calculations.eqCount}</span>
            <span className="font-medium">₪{calculations.eqBonus.toLocaleString()}</span>
          </div>
          {calculations.deductionAmount > 0 && (
            <div className="flex items-center justify-between text-sm mr-4">
              <span className="text-muted-foreground">סכום הקיזוז</span>
              <span className="font-medium text-destructive">-₪{calculations.deductionAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground w-[140px]">סך הכל בונוס CFD</span>
            <span className="w-12 text-center font-medium">{calculations.cfdCount}</span>
            <span className="font-medium">₪{calculations.cfdBonus.toLocaleString()}</span>
          </div>
        </div>

        {(calculations.targetBonuses > 0 || calculations.isQuarterEnd) && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">מענק הגעה ליעד חודשי טוטאל</span>
              <span className="font-medium">₪{calculations.monthlyGeneralBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">מענק הגעה ליעד חודשי CFD</span>
              <span className="font-medium">₪{calculations.monthlyCfdBonus.toLocaleString()}</span>
            </div>
            {calculations.isQuarterEnd && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">מענק הגעה ליעד רבעוני טוטאל</span>
                  <span className="font-medium">₪{calculations.quarterlyGeneralBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">מענק הגעה ליעד רבעוני CFD</span>
                  <span className="font-medium">₪{calculations.quarterlyCfdBonus.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        )}

        {calculations.kpisBonus > 0 && (
          <div className="border-t pt-4">
            <Collapsible open={isKpisOpen} onOpenChange={setIsKpisOpen}>
              <CollapsibleTrigger className="flex justify-between items-center w-full hover:opacity-80 transition-opacity">
                <span className="text-muted-foreground">בונוס KPIS</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₪{calculations.kpisBonus.toLocaleString()}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${isKpisOpen ? 'rotate-180' : ''}`} 
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-1 mr-4">
                {kpisData && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ממוצע זמן שיחה</span>
                      <span>₪{kpisData.avg_call_time_minutes ? '600' : '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ממוצע כמות שיחות</span>
                      <span>₪{kpisData.avg_calls_count ? '600' : '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">יחס המרה PPC</span>
                      <span>₪{kpisData.ppc_conversion_rate ? '600' : '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">יחס המרה AFF</span>
                      <span>₪{kpisData.aff_conversion_rate ? '600' : '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">הערכת מנהל ({kpisData.work_excellence || 0}%)</span>
                      <span>₪{kpisData.work_excellence ? Math.round(1600 * (kpisData.work_excellence / 100)).toLocaleString() : '0'}</span>
                    </div>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">סה"כ שכר צפוי</span>
            <span className="text-3xl font-bold text-primary">
              ₪{calculations.totalSalary.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryCalculator;

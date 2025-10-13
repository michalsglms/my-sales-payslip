import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Deal {
  id: string;
  client_type: "EQ" | "CFD";
  traffic_source: "AFF" | "RFF" | "PPC" | "ORG";
  initial_deposit: number;
  is_new_client: boolean;
  completed_within_4_days: boolean;
}

interface SalaryCalculatorProps {
  baseSalary: number;
  deals: Deal[];
  monthlyGeneralBonus?: number;
  monthlyCfdBonus?: number;
  quarterlyGeneralBonus?: number;
  quarterlyCfdBonus?: number;
}

const SalaryCalculator = ({ baseSalary, deals, monthlyGeneralBonus = 0, monthlyCfdBonus = 0, quarterlyGeneralBonus = 0, quarterlyCfdBonus = 0 }: SalaryCalculatorProps) => {
  const calculations = useMemo(() => {
    let eqBonus = 0;
    let cfdBonus = 0;

    deals.forEach((deal) => {
      if (!deal.is_new_client) return;

      // No commission for EQ deposits under $2,950 (CFD has no minimum)
      if (deal.client_type === "EQ" && deal.initial_deposit < 2950) {
        return;
      }

      let dealBonus = 0;

      // Traffic source bonus (includes 60 ILS base per new client)
      // For deposits $10,000+, bonus is 700 ILS regardless of traffic source
      if (deal.initial_deposit >= 10000) {
        dealBonus += 700;
      } else {
        // For deposits under $10,000
        if (deal.traffic_source === "RFF" || deal.traffic_source === "PPC") {
          dealBonus += 700;
        } else if (deal.traffic_source === "ORG" || deal.traffic_source === "AFF") {
          dealBonus += 400;
        }
      }

      // Additional 500 ILS bonus ONLY for EQ clients with $10,000+ (not CFD)
      if (deal.client_type === "EQ" && deal.initial_deposit >= 10000) {
        dealBonus += 500;
      }

      // Add to appropriate category
      if (deal.client_type === "EQ") {
        eqBonus += dealBonus;
      } else {
        cfdBonus += dealBonus;
      }
    });

    const totalBonus = eqBonus + cfdBonus;
    const targetBonuses = monthlyGeneralBonus + monthlyCfdBonus + quarterlyGeneralBonus + quarterlyCfdBonus;
    const totalSalary = baseSalary + totalBonus + targetBonuses;

    return {
      baseSalary,
      eqBonus,
      cfdBonus,
      totalBonus,
      monthlyGeneralBonus,
      monthlyCfdBonus,
      quarterlyGeneralBonus,
      quarterlyCfdBonus,
      targetBonuses,
      totalSalary,
      newClientsCount: deals.filter(d => d.is_new_client).length,
    };
  }, [baseSalary, deals, monthlyGeneralBonus, monthlyCfdBonus, quarterlyGeneralBonus, quarterlyCfdBonus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>חישוב שכר נוכחי</CardTitle>
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

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">סך הכל בונוס EQ</span>
            <span className="font-medium">₪{calculations.eqBonus.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">סך הכל בונוס CFD</span>
            <span className="font-medium">₪{calculations.cfdBonus.toLocaleString()}</span>
          </div>
        </div>

        {calculations.targetBonuses > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">בונוס יעד חודשי טוטאל</span>
              <span className="font-medium">₪{calculations.monthlyGeneralBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">בונוס יעד חודשי CFD</span>
              <span className="font-medium">₪{calculations.monthlyCfdBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">בונוס יעד רבעוני טוטאל</span>
              <span className="font-medium">₪{calculations.quarterlyGeneralBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">בונוס יעד רבעוני CFD</span>
              <span className="font-medium">₪{calculations.quarterlyCfdBonus.toLocaleString()}</span>
            </div>
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

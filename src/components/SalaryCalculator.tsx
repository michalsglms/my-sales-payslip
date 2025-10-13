import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditBaseSalary from "./EditBaseSalary";

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
  userId: string;
  onSalaryUpdated: () => void;
}

const SalaryCalculator = ({ baseSalary, deals, monthlyGeneralBonus = 0, monthlyCfdBonus = 0, quarterlyGeneralBonus = 0, quarterlyCfdBonus = 0, userId, onSalaryUpdated }: SalaryCalculatorProps) => {
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
        eqCount++;
      } else {
        cfdBonus += dealBonus;
        cfdCount++;
      }
    });

    const totalBonus = eqBonus + cfdBonus;
    const targetBonuses = monthlyGeneralBonus + monthlyCfdBonus + quarterlyGeneralBonus + quarterlyCfdBonus;
    const totalSalary = baseSalary + totalBonus + targetBonuses;

    return {
      baseSalary,
      eqBonus,
      cfdBonus,
      eqCount,
      cfdCount,
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
    <Card className="overflow-hidden border-border shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
      <CardHeader className="bg-muted/30 border-b border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            חישוב השכר 💰
          </CardTitle>
          <EditBaseSalary 
            userId={userId} 
            currentBaseSalary={baseSalary} 
            onSalaryUpdated={onSalaryUpdated}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6" dir="rtl">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 p-4 rounded-lg bg-muted/30 border border-border hover:shadow-md transition-all duration-300">
            <p className="text-sm text-muted-foreground font-medium">שכר בסיס</p>
            <p className="text-3xl font-bold text-foreground">
              ₪{calculations.baseSalary.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1 p-4 rounded-lg bg-muted/30 border border-border hover:shadow-md transition-all duration-300">
            <p className="text-sm text-muted-foreground font-medium">לקוחות חדשים</p>
            <p className="text-3xl font-bold text-foreground">
              {calculations.newClientsCount}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all duration-300">
            <span className="text-muted-foreground font-medium">סך הכל בונוס EQ</span>
            <span className="w-16 text-center font-bold text-primary">{calculations.eqCount}</span>
            <span className="font-bold text-lg text-foreground">₪{calculations.eqBonus.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all duration-300">
            <span className="text-muted-foreground font-medium">סך הכל בונוס CFD</span>
            <span className="w-16 text-center font-bold text-primary">{calculations.cfdCount}</span>
            <span className="font-bold text-lg text-foreground">₪{calculations.cfdBonus.toLocaleString()}</span>
          </div>
        </div>

        {calculations.targetBonuses > 0 && (
          <div className="border-t border-accent/10 pt-4 space-y-3">
            <div className="flex justify-between p-3 rounded-lg bg-gradient-to-r from-accent/5 to-transparent hover:from-accent/10 transition-all duration-300">
              <span className="text-muted-foreground font-medium">מענק הגעה ליעד חודשי טוטאל</span>
              <span className="font-bold text-lg text-accent">₪{calculations.monthlyGeneralBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-gradient-to-r from-accent/5 to-transparent hover:from-accent/10 transition-all duration-300">
              <span className="text-muted-foreground font-medium">מענק הגעה ליעד חודשי CFD</span>
              <span className="font-bold text-lg text-accent">₪{calculations.monthlyCfdBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300">
              <span className="text-muted-foreground font-medium">מענק הגעה ליעד רבעוני טוטאל</span>
              <span className="font-bold text-lg text-primary">₪{calculations.quarterlyGeneralBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300">
              <span className="text-muted-foreground font-medium">מענק הגעה ליעד רבעוני CFD</span>
              <span className="font-bold text-lg text-primary">₪{calculations.quarterlyCfdBonus.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="border-t-2 border-border pt-6 mt-6">
          <div className="flex justify-between items-center p-6 rounded-xl bg-primary/5 border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce-in">
            <span className="text-xl font-bold text-foreground">
              סה"כ שכר צפוי 💎
            </span>
            <span className="text-4xl font-black text-primary">
              ₪{calculations.totalSalary.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryCalculator;

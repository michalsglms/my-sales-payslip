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
}

const SalaryCalculator = ({ baseSalary, deals }: SalaryCalculatorProps) => {
  const calculations = useMemo(() => {
    let specialBonus = 0;
    let trafficSourceBonus = 0;
    let depositBonus = 0;
    let totalEQBonus = 0;
    let deduction = 0;

    deals.forEach((deal) => {
      if (!deal.is_new_client) return;

      // Special bonus: 60 ILS per new client
      specialBonus += 60;

      // Traffic source bonus
      if (deal.traffic_source === "RFF" || deal.traffic_source === "PPC") {
        trafficSourceBonus += 640;
      } else if (deal.traffic_source === "ORG" || deal.traffic_source === "AFF") {
        trafficSourceBonus += 340;
      }

      // Deposit bonus for EQ clients with $10,000+
      if (deal.client_type === "EQ" && deal.initial_deposit >= 10000 && deal.completed_within_4_days) {
        depositBonus += 500;
      }

      // Calculate total EQ bonus for deduction
      if (deal.client_type === "EQ") {
        let eqBonus = 60; // special bonus
        if (deal.traffic_source === "RFF" || deal.traffic_source === "PPC") {
          eqBonus += 640;
        } else if (deal.traffic_source === "ORG" || deal.traffic_source === "AFF") {
          eqBonus += 340;
        }
        if (deal.initial_deposit >= 10000 && deal.completed_within_4_days) {
          eqBonus += 500;
        }
        totalEQBonus += eqBonus;
      }
    });

    // Apply deduction (max 15,840 ILS and not more than total EQ bonus)
    deduction = Math.min(totalEQBonus, 15840);

    const totalBonus = specialBonus + trafficSourceBonus + depositBonus - deduction;
    const totalSalary = baseSalary + totalBonus;

    return {
      baseSalary,
      specialBonus,
      trafficSourceBonus,
      depositBonus,
      deduction,
      totalBonus,
      totalSalary,
      newClientsCount: deals.filter(d => d.is_new_client).length,
    };
  }, [baseSalary, deals]);

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
            <span className="text-muted-foreground">תמריץ מיוחד (60₪ × {calculations.newClientsCount})</span>
            <span className="font-medium">₪{calculations.specialBonus.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">תוספת מקור הגעה</span>
            <span className="font-medium">₪{calculations.trafficSourceBonus.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">תוספת הפקדה $10K+</span>
            <span className="font-medium">₪{calculations.depositBonus.toLocaleString()}</span>
          </div>
          {calculations.deduction > 0 && (
            <div className="flex justify-between text-destructive">
              <span>קיזוז EQ</span>
              <span className="font-medium">-₪{calculations.deduction.toLocaleString()}</span>
            </div>
          )}
        </div>

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

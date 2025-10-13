import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface Deal {
  id: string;
  client_type: "EQ" | "CFD";
  traffic_source: "AFF" | "RFF" | "PPC" | "ORG";
  initial_deposit: number;
  is_new_client: boolean;
  created_at: string;
  client_link?: string;
  notes?: string;
}

interface ExportToExcelProps {
  deals: Deal[];
  userName: string;
}

const ExportToExcel = ({ deals, userName }: ExportToExcelProps) => {
  const getTrafficSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      RFF: "הפניה",
      PPC: "פרסום ממומן",
      ORG: "אורגני",
      AFF: "שיווק שותפים",
    };
    return labels[source] || source;
  };

  const calculateBonus = (deal: Deal) => {
    let bonus = 0;
    
    // Traffic source bonus
    if (deal.initial_deposit >= 10000) {
      bonus += 700;
    } else {
      if (deal.traffic_source === "RFF" || deal.traffic_source === "PPC") {
        bonus += 700;
      } else if (deal.traffic_source === "ORG" || deal.traffic_source === "AFF") {
        bonus += 400;
      }
    }
    
    // Additional bonus for EQ clients with $10,000+
    if (deal.client_type === "EQ" && deal.initial_deposit >= 10000) {
      bonus += 500;
    }
    
    return bonus;
  };

  const handleExport = () => {
    // Prepare data for Excel
    const excelData = deals.map((deal) => ({
      "תאריך": new Date(deal.created_at).toLocaleDateString("he-IL"),
      "סוג לקוח": deal.client_type,
      "מקור הגעה": getTrafficSourceLabel(deal.traffic_source),
      "הפקדה ($)": deal.initial_deposit,
      "בונוס (₪)": calculateBonus(deal),
      "קישור": deal.client_link || "",
      "הערות": deal.notes || "",
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "עסקאות");

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // תאריך
      { wch: 10 }, // סוג לקוח
      { wch: 15 }, // מקור הגעה
      { wch: 12 }, // הפקדה
      { wch: 12 }, // בונוס
      { wch: 40 }, // קישור
      { wch: 30 }, // הערות
    ];
    ws["!cols"] = columnWidths;

    // Generate file name with date
    const date = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");
    const fileName = `עסקאות_${userName}_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName, { bookType: "xlsx" });
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="ml-2 h-4 w-4" />
      ייצא לאקסל
    </Button>
  );
};

export default ExportToExcel;
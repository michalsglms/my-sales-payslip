import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ImportFromExcelProps {
  userId: string;
  onImportComplete: () => void;
}

const ImportFromExcel = ({ userId, onImportComplete }: ImportFromExcelProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  const getTrafficSourceCode = (label: string): "AFF" | "RFF" | "PPC" | "ORG" => {
    const mapping: Record<string, "AFF" | "RFF" | "PPC" | "ORG"> = {
      "הפניה": "RFF",
      "פרסום ממומן": "PPC",
      "אורגני": "ORG",
      "שיווק שותפים": "AFF",
    };
    return mapping[label] || "RFF";
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const deals = jsonData.map((row: any) => {
        // Get client type - if it's "AQ" or "EQ", use "EQ", otherwise "CFD"
        const clientTypeValue = row["סוג הלקוח"] || row["סוג לקוח"] || "";
        const clientType = (clientTypeValue === "AQ" || clientTypeValue === "EQ") ? "EQ" : "CFD";
        
        // Get traffic source from the Hebrew column
        const trafficSourceLabel = row["מקור הגעה"] || "";
        const trafficSource = getTrafficSourceCode(trafficSourceLabel);
        
        // Get deposit amount
        const depositValue = row["הפקדה ראשונית"] || row["הפקדה ($)"] || row["Deposits"] || 0;
        const initialDeposit = parseFloat(depositValue.toString().replace(/[^\d.-]/g, '')) || 0;
        
        return {
          sales_rep_id: userId,
          client_type: clientType,
          traffic_source: trafficSource,
          initial_deposit: initialDeposit,
          is_new_client: true,
          completed_within_4_days: false,
          client_link: row["קישור ללקוח"] || row["קישור"] || null,
          client_name: row["שם הלקוח"] || null,
          client_phone: row["טלפון הלקוח"] || null,
          notes: row["הערות"] || null,
          created_at: row["תאריך"] ? new Date(row["תאריך"]).toISOString() : new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from("deals")
        .insert(deals);

      if (error) throw error;

      toast({
        title: "הייבוא הושלם בהצלחה",
        description: `${deals.length} עסקאות יובאו למערכת`,
      });

      onImportComplete();
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        title: "שגיאה בייבוא",
        description: "אירעה שגיאה בייבוא הנתונים. אנא בדוק את הקובץ ונסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        style={{ display: "none" }}
        id="excel-upload"
        disabled={isImporting}
      />
      <label htmlFor="excel-upload">
        <Button variant="outline" disabled={isImporting} asChild>
          <span>
            <Upload className="ml-2 h-4 w-4" />
            {isImporting ? "מייבא..." : "ייבא מאקסל"}
          </span>
        </Button>
      </label>
    </div>
  );
};

export default ImportFromExcel;

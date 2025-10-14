import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { z } from "zod";

interface ImportFromExcelProps {
  userId: string;
  onImportComplete: () => void;
}

const dealImportSchema = z.object({
  client_name: z.string().max(100).optional().nullable(),
  client_phone: z.string().max(20).optional().nullable(),
  client_link: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  initial_deposit: z.number().positive().max(10000000),
  traffic_source: z.enum(["AFF", "RFF", "PPC", "ORG"]),
  client_type: z.enum(["EQ", "CFD"]),
});

const ImportFromExcel = ({ userId, onImportComplete }: ImportFromExcelProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  const getTrafficSourceCode = (label: string): "AFF" | "RFF" | "PPC" | "ORG" => {
    // הקוד כבר מגיע באנגלית מהאקסל (ORG, AFF, RFF, PPC)
    const upperLabel = label.trim().toUpperCase();
    
    // אם זה כבר אחד מהקודים התקינים, החזר אותו
    if (upperLabel === "ORG" || upperLabel === "AFF" || upperLabel === "RFF" || upperLabel === "PPC") {
      return upperLabel as "AFF" | "RFF" | "PPC" | "ORG";
    }
    
    // אם זה טקסט בעברית, המר לקוד
    const mapping: Record<string, "AFF" | "RFF" | "PPC" | "ORG"> = {
      "הפניה": "RFF",
      "פרסום ממומן": "PPC",
      "אורגני": "ORG",
      "שיווק שותפים": "AFF",
    };
    
    return mapping[label] || "RFF";
  };

  // Helper: robustly find a value by header candidates (handles RTL invisible chars)
  const getHeaderValue = (row: any, candidates: string[]): string => {
    const keys = Object.keys(row);
    const normalize = (s: any) =>
      s?.toString()
        .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
    const map = new Map(keys.map((k) => [normalize(k), row[k]]));
    for (const c of candidates) {
      const n = normalize(c);
      if (map.has(n)) return String(map.get(n) ?? "");
      for (const [nk, val] of map) {
        if (nk.includes(n)) return String(val ?? "");
      }
    }
    return "";
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
        
        // Get traffic source (supporting variations/invisible RTL chars)
        const trafficSourceLabel = getHeaderValue(row, ["מקור הגעה", "מקור", "traffic source", "source"]);
        const trafficSource = getTrafficSourceCode(trafficSourceLabel);
        
        // Get deposit amount
        const depositValue = row["הפקדה ראשונית"] || row["הפקדה ($)"] || row["Deposits"] || 0;
        const initialDeposit = parseFloat(depositValue.toString().replace(/[^\d.-]/g, '')) || 0;
        
        const dealData = {
          client_name: row["שם הלקוח"] || null,
          client_phone: row["טלפון הלקוח"] || null,
          client_link: row["קישור ללקוח"] || row["קישור"] || null,
          notes: row["הערות"] || null,
          initial_deposit: initialDeposit,
          traffic_source: trafficSource,
          client_type: clientType,
        };

        // Validate data
        const validated = dealImportSchema.parse(dealData);
        
        return {
          sales_rep_id: userId,
          client_type: validated.client_type,
          traffic_source: validated.traffic_source,
          initial_deposit: validated.initial_deposit,
          is_new_client: true,
          completed_within_4_days: false,
          client_link: validated.client_link,
          client_name: validated.client_name,
          client_phone: validated.client_phone,
          notes: validated.notes,
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
      let errorMessage = "אירעה שגיאה בייבוא הנתונים. אנא בדוק את הקובץ ונסה שוב.";
      
      if (error instanceof z.ZodError) {
        errorMessage = "נתונים לא תקינים בקובץ: " + error.errors[0].message;
      }
      
      toast({
        title: "שגיאה בייבוא",
        description: errorMessage,
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

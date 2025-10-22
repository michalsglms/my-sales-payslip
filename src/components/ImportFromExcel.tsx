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
    const cleaned = (label ?? "")
      .toString()
      .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
      .trim();
    const upper = cleaned.toUpperCase();
    const lower = cleaned.toLowerCase();

    // Already a valid code
    if (upper === "ORG" || upper === "AFF" || upper === "RFF" || upper === "PPC") {
      return upper as "AFF" | "RFF" | "PPC" | "ORG";
    }

    // Heuristics in Hebrew/English
    if (/הפנ|הפנייה|הפניה|ref|referral/.test(lower)) return "RFF";
    if (/ppc|ads|google|campaign|קמפיין|ממומן/.test(lower)) return "PPC";
    if (/אורג|organic/.test(lower)) return "ORG";
    if (/שותפ|affiliate|aff/.test(lower)) return "AFF";

    // Fallback when unknown/empty
    return "ORG";
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
      // Read as array-of-arrays for maximum robustness (handles truncated headers like "Amou")
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" }) as any[][];

      const norm = (s: any) =>
        s?.toString()
          .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();

      // Find header row (first non-empty row)
      const headerRowIndex = rows.findIndex((r) => r.some((c) => String(c).trim() !== ""));
      const headers = headerRowIndex >= 0 ? rows[headerRowIndex] : [];
      const headersNorm = headers.map(norm);
      const dataRows = headerRowIndex >= 0 ? rows.slice(headerRowIndex + 1) : rows;

      console.log("Headers (array):", headers);
      console.log("First data row sample:", dataRows[0]);

      const getBy = (rowArr: any[], candidates: string[]): string => {
        for (const c of candidates) {
          const n = norm(c);
          const idx = headersNorm.findIndex((h) => h === n || h.includes(n) || n.includes(h));
          if (idx !== -1) return String(rowArr[idx] ?? "");
        }
        return "";
      };

      const deals = dataRows
        .map((row: any[]) => {
          try {
            // Skip completely empty rows
            if (!row || row.every((v) => String(v ?? "").trim() === "")) return null;

            // Get client type from "Handling Bran" column
            // CIL or זירה = CFD
            // פרו or IL = EQ
            const clientTypeValue = getBy(row, [
              "handling bran", "handling brand", "סוג הלקוח", "סוג לקוח", "client type", "type", "platform account numb"
            ]);
            const clientTypeUpper = clientTypeValue.toUpperCase();
            const clientTypeLower = clientTypeValue.toLowerCase();
            
            let clientType: "EQ" | "CFD" = "CFD"; // Default to CFD
            if (clientTypeUpper.includes("CIL") || clientTypeLower.includes("זירה") || clientTypeLower.includes("ישראל")) {
              clientType = "CFD";
            } else if (clientTypeLower.includes("פרו") || clientTypeUpper.includes("IL")) {
              clientType = "EQ";
            }
            
            // Get traffic source from affiliate/name columns
            const trafficSourceLabel = getBy(row, [
              "affiliate name", "affiliate", "type", "מקור הגעה", "מקור", "traffic source", "source", "affiliate type", "affiliate ty"
            ]);
            const trafficSource = getTrafficSourceCode(trafficSourceLabel);
            
            // Get deposit amount (supports Amou/Amount/Total Depo variants)
            const depositValue = getBy(row, [
              "amou", "amoun", "amount", "initial deposit",
              "total depo", "total deposit", "total real net depo", "total net depo",
              "הפקדה", "הפקדה ראשונית", "סכום הפקדה", "הפקדה ($)", "deposits", "deposit", "deposits owl"
            ]);
            const initialDeposit = parseFloat(depositValue.toString().replace(/[^\d.-]/g, "")) || 0;
            if (initialDeposit <= 0) {
              console.warn("Skipping row due to non-positive deposit", { depositValue, initialDeposit, row });
              return null;
            }
            
            // Get client name
            const clientNameRaw = getBy(row, ["client name", "name", "שם לקוח", "שם הלקוח", "שם", "full name"]);
            const clientName = clientNameRaw && clientNameRaw.trim() ? clientNameRaw.trim() : null;
            
            // Get phone
            const clientPhoneRaw = getBy(row, [
              "phone", "phone number", "mobile", "cell",
              "טלפון לקוח", "טלפון הלקוח", "טלפון", "מספר טלפון", "מס' טלפון", "נייד"
            ]);
            const clientPhoneClean = clientPhoneRaw ? clientPhoneRaw.toString().replace(/[^0-9]/g, "") : "";
            const clientPhone = clientPhoneClean ? clientPhoneClean : null;
            
            // Optional fields
            const clientLink = getBy(row, ["client link", "link", "קישור ללקוח", "קישור"]) || null;
            const notes = getBy(row, ["notes", "note", "הערות"]) || null;
            const dateValue = getBy(row, ["approval date", "approval dt", "approval", "date", "תאריך", "created"]);

            const dealData = {
              client_name: clientName,
              client_phone: clientPhone,
              client_link: clientLink,
              notes: notes,
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
              created_at: dateValue ? new Date(dateValue).toISOString() : new Date().toISOString(),
            };
          } catch (error) {
            // Skip invalid rows
            return null;
          }
        })
        .filter((deal): deal is NonNullable<typeof deal> => deal !== null);
            

      if (deals.length === 0) {
        toast({
          title: "לא נמצאו רשומות תקינות",
          description: "לא זוהו סכומי הפקדה חיוביים בקובץ. ודא שהעמודה נקראת 'סכום הפקדה' / 'הפקדה' או כוללת Total Depo / Total Real Net Depo / Amount.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("deals").insert(deals);

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

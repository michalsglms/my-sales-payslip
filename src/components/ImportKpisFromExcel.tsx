import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileUp, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface KpisRow {
  email: string;
  avg_call_time_minutes: boolean;
  avg_calls_count: boolean;
  ppc_conversion_rate: boolean;
  aff_conversion_rate: boolean;
  work_excellence: boolean;
}

interface ImportKpisFromExcelProps {
  month: number;
  year: number;
  onImportComplete: () => void;
}

const ImportKpisFromExcel = ({ month, year, onImportComplete }: ImportKpisFromExcelProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast({
          title: "קובץ ריק",
          description: "הקובץ לא מכיל נתונים",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Get all users from auth
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id");

      if (profilesError) throw profilesError;

      const kpisData: KpisRow[] = jsonData.map((row) => ({
        email: row["אימייל"] || row["email"] || "",
        avg_call_time_minutes: row["ממוצע זמן שיחה"] === "כן" || row["avg_call_time_minutes"] === true,
        avg_calls_count: row["ממוצע כמות שיחות"] === "כן" || row["avg_calls_count"] === true,
        ppc_conversion_rate: row["יחס המרה PPC"] === "כן" || row["ppc_conversion_rate"] === true,
        aff_conversion_rate: row["יחס המרה AFF"] === "כן" || row["aff_conversion_rate"] === true,
        work_excellence: row["הערכת מנהל"] === "כן" || row["work_excellence"] === true,
      }));

      // Get user IDs from emails
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        throw new Error("No active session");
      }

      // Use profiles table to map emails to IDs
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from("profiles")
        .select("id");

      if (allProfilesError) throw allProfilesError;

      // We need to fetch users differently - let's query profiles and match by email
      const profileIds = allProfiles?.map(p => p.id) || [];
      
      // For now, we'll create a simplified version that requires user_id in Excel
      // This is a limitation we'll address

      // For now, use a simpler approach - require sales_rep_id in the Excel file
      const kpisRecords = jsonData
        .filter(row => row["user_id"] || row["מזהה נציג"])
        .map(row => ({
          sales_rep_id: (row["user_id"] || row["מזהה נציג"]) as string,
          month,
          year,
          avg_call_time_minutes: row["ממוצע זמן שיחה"] === "כן" || row["avg_call_time_minutes"] === true,
          avg_calls_count: row["ממוצע כמות שיחות"] === "כן" || row["avg_calls_count"] === true,
          ppc_conversion_rate: row["יחס המרה PPC"] === "כן" || row["ppc_conversion_rate"] === true,
          aff_conversion_rate: row["יחס המרה AFF"] === "כן" || row["aff_conversion_rate"] === true,
          work_excellence: row["הערכת מנהל"] === "כן" || row["work_excellence"] === true,
        }));

      if (kpisRecords.length === 0) {
        toast({
          title: "לא נמצאו רשומות תקינות",
          description: "וודא שהקובץ מכיל עמודה 'מזהה נציג' או 'user_id'",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Upsert KPIS data
      const { error: insertError } = await supabase
        .from("monthly_kpis")
        .upsert(kpisRecords, {
          onConflict: "sales_rep_id,month,year",
        });

      if (insertError) throw insertError;

      toast({
        title: "ייבוא הצליח!",
        description: `${kpisRecords.length} רשומות KPIS עודכנו בהצלחה`,
      });

      setOpen(false);
      onImportComplete();
    } catch (error: any) {
      console.error("Error importing KPIS:", error);
      toast({
        title: "שגיאה בייבוא",
        description: error.message || "אירעה שגיאה בעת ייבוא הנתונים",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        "מזהה נציג": "user-id-here",
        "ממוצע זמן שיחה": "כן",
        "ממוצע כמות שיחות": "לא",
        "יחס המרה PPC": "כן",
        "יחס המרה AFF": "כן",
        "הערכת מנהל": "לא",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPIS");
    XLSX.writeFile(wb, `kpis_template_${month}_${year}.xlsx`);

    toast({
      title: "תבנית הורדה",
      description: "קובץ התבנית הורד בהצלחה",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="h-4 w-4" />
          ייבוא KPIS מאקסל
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>ייבוא KPIS מאקסל</DialogTitle>
          <DialogDescription>
            העלה קובץ Excel עם מדדי KPIS לחודש {month}/{year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            הורד תבנית Excel
          </Button>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
              id="kpis-file-upload"
            />
            <label
              htmlFor="kpis-file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <FileUp className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {isImporting ? "מייבא..." : "לחץ לבחירת קובץ"}
              </span>
            </label>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>העמודות הנדרשות בקובץ Excel:</p>
            <ul className="list-disc list-inside mr-4">
              <li>מזהה נציג - ID של הנציג מהמערכת</li>
              <li>ממוצע זמן שיחה - "כן" או "לא"</li>
              <li>ממוצע כמות שיחות - "כן" או "לא"</li>
              <li>יחס המרה PPC - "כן" או "לא"</li>
              <li>יחס המרה AFF - "כן" או "לא"</li>
              <li>הערכת מנהל - "כן" או "לא"</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportKpisFromExcel;

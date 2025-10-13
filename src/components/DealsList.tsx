import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EditDealDialog from "./EditDealDialog";

interface Deal {
  id: string;
  client_name?: string;
  client_phone?: string;
  client_type: "EQ" | "CFD";
  traffic_source: "AFF" | "RFF" | "PPC" | "ORG";
  initial_deposit: number;
  is_new_client: boolean;
  completed_within_4_days: boolean;
  created_at: string;
  client_link?: string;
  notes?: string;
}

interface DealsListProps {
  deals: Deal[];
  onDealsChange: () => void;
}

const DealsList = ({ deals, onDealsChange }: DealsListProps) => {
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDealId, setDeletingDealId] = useState<string | null>(null);
  const { toast } = useToast();
  const handleDelete = async (dealId: string) => {
    try {
      const { error } = await supabase.from("deals").delete().eq("id", dealId);

      if (error) throw error;

      toast({
        title: "עסקה נמחקה בהצלחה",
        description: "העסקה הוסרה מהמערכת",
      });

      setDeletingDealId(null);
      onDealsChange();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה במחיקת העסקה",
        variant: "destructive",
      });
    }
  };

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
    // No commission for deposits under $2,950
    if (deal.initial_deposit < 2950) {
      return 0;
    }

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

  const eqDeals = deals.filter(d => d.client_type === "EQ");
  const cfdDeals = deals.filter(d => d.client_type === "CFD");

  const calculateTotals = (dealsArray: Deal[]) => {
    const totalDeposit = dealsArray.reduce((sum, deal) => sum + deal.initial_deposit, 0);
    const totalBonus = dealsArray.reduce((sum, deal) => sum + calculateBonus(deal), 0);
    return { totalDeposit, totalBonus };
  };

  const allTotals = calculateTotals(deals);
  const eqTotals = calculateTotals(eqDeals);
  const cfdTotals = calculateTotals(cfdDeals);

  const renderTable = (dealsArray: Deal[], totals: { totalDeposit: number; totalBonus: number }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">תאריך</TableHead>
            <TableHead className="text-right">שם הלקוח</TableHead>
            <TableHead className="text-right">טלפון הלקוח</TableHead>
            <TableHead className="text-right">סוג לקוח</TableHead>
            <TableHead className="text-right">מקור הגעה</TableHead>
            <TableHead className="text-right">הפקדה ($)</TableHead>
            <TableHead className="text-right">בונוס (₪)</TableHead>
            <TableHead className="text-right">קישור</TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dealsArray.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell>
                {format(new Date(deal.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
              </TableCell>
              <TableCell>
                {deal.client_name || <span className="text-muted-foreground">-</span>}
              </TableCell>
              <TableCell>
                {deal.client_phone || <span className="text-muted-foreground">-</span>}
              </TableCell>
              <TableCell>
                <Badge variant={deal.client_type === "EQ" ? "default" : "secondary"}>
                  {deal.client_type}
                </Badge>
              </TableCell>
              <TableCell>{getTrafficSourceLabel(deal.traffic_source)}</TableCell>
              <TableCell className="font-medium">
                ${deal.initial_deposit.toLocaleString()}
              </TableCell>
              <TableCell className="font-bold text-primary">
                ₪{calculateBonus(deal).toLocaleString()}
              </TableCell>
              <TableCell>
                {deal.client_link ? (
                  <a 
                    href={deal.client_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    פתח
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingDeal(deal)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingDealId(deal.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 font-bold">
            <TableCell className="text-right">סה"כ</TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell>
              <Badge variant="outline">{dealsArray.length}</Badge>
            </TableCell>
            <TableCell></TableCell>
            <TableCell className="font-bold">
              ${totals.totalDeposit.toLocaleString()}
            </TableCell>
            <TableCell className="font-bold text-primary">
              ₪{totals.totalBonus.toLocaleString()}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle>עסקאות אחרונות</CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        {deals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            אין עסקאות להצגה. הוסף עסקה ראשונה!
          </p>
        ) : (
          <Tabs defaultValue="all" dir="rtl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">כללי</TabsTrigger>
              <TabsTrigger value="eq">EQ</TabsTrigger>
              <TabsTrigger value="cfd">CFD</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {renderTable(deals, allTotals)}
            </TabsContent>
            <TabsContent value="eq" className="mt-4">
              {eqDeals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  אין עסקאות EQ להצגה
                </p>
              ) : (
                renderTable(eqDeals, eqTotals)
              )}
            </TabsContent>
            <TabsContent value="cfd" className="mt-4">
              {cfdDeals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  אין עסקאות CFD להצגה
                </p>
              ) : (
                renderTable(cfdDeals, cfdTotals)
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>

    {editingDeal && (
      <EditDealDialog
        deal={editingDeal}
        open={!!editingDeal}
        onOpenChange={(open) => !open && setEditingDeal(null)}
        onDealUpdated={onDealsChange}
      />
    )}

    <AlertDialog open={!!deletingDealId} onOpenChange={(open) => !open && setDeletingDealId(null)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תמחק את העסקה לצמיתות ולא ניתן יהיה לשחזר אותה.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletingDealId && handleDelete(deletingDealId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            מחק
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default DealsList;

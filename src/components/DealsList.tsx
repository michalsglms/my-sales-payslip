import { useState, useMemo } from "react";
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
import { Pencil, Trash2, ArrowUpDown, Calendar, Plus, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DealForm from "./DealForm";
import AffiliateNameSelect from "./AffiliateNameSelect";

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
  campaign?: string;
}

interface DealsListProps {
  deals: Deal[];
  onDealsChange: () => void;
  userId: string;
}

const DealsList = ({ deals, onDealsChange, userId }: DealsListProps) => {
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [deletingDealId, setDeletingDealId] = useState<string | null>(null);
  const [sortByName, setSortByName] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    client_name: "",
    client_phone: "",
    client_type: "" as "EQ" | "CFD" | "",
    traffic_source: "" as "AFF" | "RFF" | "PPC" | "ORG" | "",
    initial_deposit: "",
    client_link: "",
    campaign: "",
  });
  const [editDeal, setEditDeal] = useState<{
    client_name: string;
    client_phone: string;
    client_type: "EQ" | "CFD";
    traffic_source: "AFF" | "RFF" | "PPC" | "ORG";
    initial_deposit: string;
    client_link: string;
    campaign: string;
  } | null>(null);
  const { toast } = useToast();
  
  const handleAddDeal = async () => {
    try {
      // Validate required fields
      if (!newDeal.client_name || !newDeal.client_type || 
          !newDeal.traffic_source || !newDeal.initial_deposit) {
        toast({
          title: "שגיאה",
          description: "יש למלא את כל השדות החובה",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("deals").insert({
        sales_rep_id: userId,
        client_name: newDeal.client_name,
        client_phone: newDeal.client_phone,
        client_type: newDeal.client_type as "EQ" | "CFD",
        traffic_source: newDeal.traffic_source as "AFF" | "RFF" | "PPC" | "ORG",
        initial_deposit: parseFloat(newDeal.initial_deposit),
        is_new_client: true,
        client_link: newDeal.client_link || null,
        completed_within_4_days: false,
        campaign: newDeal.campaign || null,
      });

      if (error) throw error;

      toast({
        title: "עסקה נוספה בהצלחה!",
        description: "העסקה החדשה נוספה למערכת",
      });

      // Reset form
      setNewDeal({
        client_name: "",
        client_phone: "",
        client_type: "",
        traffic_source: "",
        initial_deposit: "",
        client_link: "",
        campaign: "",
      });
      setIsAddingDeal(false);
      onDealsChange();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהוספת העסקה",
        variant: "destructive",
      });
    }
  };

  const handleStartEdit = (deal: Deal) => {
    setEditingDealId(deal.id);
    setEditDeal({
      client_name: deal.client_name || "",
      client_phone: deal.client_phone || "",
      client_type: deal.client_type,
      traffic_source: deal.traffic_source,
      initial_deposit: deal.initial_deposit.toString(),
      client_link: deal.client_link || "",
      campaign: deal.campaign || "",
    });
  };

  const handleSaveEdit = async (dealId: string) => {
    if (!editDeal) return;

    try {
      // Validate required fields
      if (!editDeal.client_name || !editDeal.client_type || 
          !editDeal.traffic_source || !editDeal.initial_deposit) {
        toast({
          title: "שגיאה",
          description: "יש למלא את כל השדות החובה",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("deals")
        .update({
          client_name: editDeal.client_name,
          client_phone: editDeal.client_phone,
          client_type: editDeal.client_type,
          traffic_source: editDeal.traffic_source,
          initial_deposit: parseFloat(editDeal.initial_deposit),
          client_link: editDeal.client_link || null,
          campaign: editDeal.campaign || null,
        })
        .eq("id", dealId);

      if (error) throw error;

      toast({
        title: "עסקה עודכנה בהצלחה!",
        description: "השינויים נשמרו במערכת",
      });

      setEditingDealId(null);
      setEditDeal(null);
      onDealsChange();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון העסקה",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingDealId(null);
    setEditDeal(null);
  };

  const handleCancelAdd = () => {
    setNewDeal({
      client_name: "",
      client_phone: "",
      client_type: "",
      traffic_source: "",
      initial_deposit: "",
      client_link: "",
      campaign: "",
    });
    setIsAddingDeal(false);
  };

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
    return source;
  };

  const calculateBonus = (deal: Deal) => {
    // No commission for EQ deposits under $2,950 (CFD has no minimum)
    if (deal.client_type === "EQ" && deal.initial_deposit < 2950) {
      return 0;
    }

    let bonus = 0;
    
    // Traffic source bonus
    if (deal.traffic_source === "RFF" || deal.traffic_source === "PPC") {
      bonus += 700;
    } else if (deal.traffic_source === "ORG") {
      bonus += 400;
    } else if (deal.traffic_source === "AFF") {
      // For AFF: 400 regular, 900 if deposit >= 10K
      bonus += deal.initial_deposit >= 10000 ? 900 : 400;
    }
    
    // Additional bonus for EQ clients with $10,000+
    if (deal.client_type === "EQ" && deal.initial_deposit >= 10000) {
      bonus += 500;
    }
    
    return bonus;
  };

  const sortedDeals = useMemo(() => {
    let result = [...deals];
    
    if (sortByName) {
      result.sort((a, b) => {
        const nameA = (a.client_name || "").toLowerCase();
        const nameB = (b.client_name || "").toLowerCase();
        return nameA.localeCompare(nameB, 'he');
      });
    }
    
    if (sortByDate) {
      result.sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }
    
    return result;
  }, [deals, sortByName, sortByDate]);

  const eqDeals = sortedDeals.filter(d => d.client_type === "EQ");
  const cfdDeals = sortedDeals.filter(d => d.client_type === "CFD");

  const calculateTotals = (dealsArray: Deal[]) => {
    const totalDeposit = dealsArray.reduce((sum, deal) => sum + deal.initial_deposit, 0);
    const totalBonus = dealsArray.reduce((sum, deal) => sum + calculateBonus(deal), 0);
    return { totalDeposit, totalBonus };
  };

  const allTotals = calculateTotals(sortedDeals);
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
            <TableHead className="text-right">שם אפילייאט</TableHead>
            <TableHead className="text-right">הפקדה ($)</TableHead>
            <TableHead className="text-right">בונוס (₪)</TableHead>
            <TableHead className="text-right">קישור</TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isAddingDeal && (
            <TableRow className="bg-primary/5">
              <TableCell className="p-2">
                <span className="text-sm text-muted-foreground">עכשיו</span>
              </TableCell>
              <TableCell className="p-2">
                <Input
                  placeholder="שם הלקוח"
                  value={newDeal.client_name}
                  onChange={(e) => setNewDeal({ ...newDeal, client_name: e.target.value })}
                  className="h-9"
                />
              </TableCell>
              <TableCell className="p-2">
                <Input
                  placeholder="טלפון"
                  value={newDeal.client_phone}
                  onChange={(e) => setNewDeal({ ...newDeal, client_phone: e.target.value })}
                  className="h-9"
                />
              </TableCell>
              <TableCell className="p-2">
                <Select value={newDeal.client_type} onValueChange={(value: "EQ" | "CFD") => setNewDeal({ ...newDeal, client_type: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="בחר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EQ">EQ</SelectItem>
                    <SelectItem value="CFD">CFD</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="p-2">
                <Select value={newDeal.traffic_source} onValueChange={(value: "AFF" | "RFF" | "PPC" | "ORG") => setNewDeal({ ...newDeal, traffic_source: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="בחר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RFF">RFF</SelectItem>
                    <SelectItem value="PPC">PPC</SelectItem>
                    <SelectItem value="ORG">ORG</SelectItem>
                    <SelectItem value="AFF">AFF</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="p-2">
                {newDeal.traffic_source === "AFF" ? (
                  <AffiliateNameSelect
                    value={newDeal.campaign}
                    onChange={(value) => setNewDeal({ ...newDeal, campaign: value })}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="p-2">
                <Input
                  type="number"
                  placeholder="סכום"
                  value={newDeal.initial_deposit}
                  onChange={(e) => setNewDeal({ ...newDeal, initial_deposit: e.target.value })}
                  className="h-9"
                />
              </TableCell>
              <TableCell className="p-2">-</TableCell>
              <TableCell className="p-2">
                <Input
                  placeholder="קישור"
                  value={newDeal.client_link}
                  onChange={(e) => setNewDeal({ ...newDeal, client_link: e.target.value })}
                  className="h-9"
                />
              </TableCell>
              <TableCell className="p-2">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddDeal}
                    className="h-9 w-9 p-0"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelAdd}
                    className="h-9 w-9 p-0"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          {dealsArray.map((deal) => (
            <TableRow key={deal.id} className={editingDealId === deal.id ? "bg-primary/5" : ""}>
              {editingDealId === deal.id && editDeal ? (
                <>
                  <TableCell className="p-2">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(deal.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                    </span>
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      placeholder="שם הלקוח"
                      value={editDeal.client_name}
                      onChange={(e) => setEditDeal({ ...editDeal, client_name: e.target.value })}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      placeholder="טלפון"
                      value={editDeal.client_phone}
                      onChange={(e) => setEditDeal({ ...editDeal, client_phone: e.target.value })}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Select value={editDeal.client_type} onValueChange={(value: "EQ" | "CFD") => setEditDeal({ ...editDeal, client_type: value })}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="בחר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EQ">EQ</SelectItem>
                        <SelectItem value="CFD">CFD</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <Select value={editDeal.traffic_source} onValueChange={(value: "AFF" | "RFF" | "PPC" | "ORG") => setEditDeal({ ...editDeal, traffic_source: value })}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="בחר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RFF">RFF</SelectItem>
                        <SelectItem value="PPC">PPC</SelectItem>
                        <SelectItem value="ORG">ORG</SelectItem>
                        <SelectItem value="AFF">AFF</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    {editDeal.traffic_source === "AFF" ? (
                      <AffiliateNameSelect
                        value={editDeal.campaign}
                        onChange={(value) => setEditDeal({ ...editDeal, campaign: value })}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      type="number"
                      placeholder="סכום"
                      value={editDeal.initial_deposit}
                      onChange={(e) => setEditDeal({ ...editDeal, initial_deposit: e.target.value })}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="p-2">-</TableCell>
                  <TableCell className="p-2">
                    <Input
                      placeholder="קישור"
                      value={editDeal.client_link}
                      onChange={(e) => setEditDeal({ ...editDeal, client_link: e.target.value })}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveEdit(deal.id)}
                        className="h-9 w-9 p-0"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
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
                  <TableCell>
                    {deal.traffic_source === "AFF" && deal.campaign ? (
                      <span className="text-sm">{deal.campaign}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
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
                        onClick={() => handleStartEdit(deal)}
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
                </>
              )}
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 font-bold">
            <TableCell className="text-right" colSpan={3}>סה"כ</TableCell>
            <TableCell>
              <Badge variant="outline">{dealsArray.length}</Badge>
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell className="font-bold">
              ${totals.totalDeposit.toLocaleString()}
            </TableCell>
            <TableCell className="font-bold text-primary">
              ₪{totals.totalBonus.toLocaleString()}
            </TableCell>
            <TableCell colSpan={2}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>לקוחות חדשים</CardTitle>
          <div className="flex gap-2">
            {!isAddingDeal && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAddingDeal(true)}
              >
                <Plus className="ml-2 h-4 w-4" />
                הוסף לקוח חדש
              </Button>
            )}
            <Button
              variant={sortByDate ? "default" : "outline"}
              size="sm"
              onClick={() => setSortByDate(!sortByDate)}
            >
              <Calendar className="ml-2 h-4 w-4" />
              מיון לפי תאריך
            </Button>
            <Button
              variant={sortByName ? "default" : "outline"}
              size="sm"
              onClick={() => setSortByName(!sortByName)}
            >
              <ArrowUpDown className="ml-2 h-4 w-4" />
              מיון לפי שם
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent dir="rtl">
        {deals.length === 0 && !isAddingDeal ? (
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
              {renderTable(sortedDeals, allTotals)}
            </TabsContent>
            <TabsContent value="eq" className="mt-4">
              {eqDeals.length === 0 && !isAddingDeal ? (
                <p className="text-center text-muted-foreground py-8">
                  אין עסקאות EQ להצגה
                </p>
              ) : (
                renderTable(eqDeals, eqTotals)
              )}
            </TabsContent>
            <TabsContent value="cfd" className="mt-4">
              {cfdDeals.length === 0 && !isAddingDeal ? (
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

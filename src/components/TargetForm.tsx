import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const monthlyTargetSchema = z.object({
  month: z.string().min(1, "יש לבחור חודש"),
  year: z.string().min(1, "יש לבחור שנה"),
  general_target_amount: z.string().min(1, "יש להזין יעד כללי"),
  cfd_target_amount: z.string().min(1, "יש להזין יעד CFD"),
  workdays_in_period: z.string().optional(),
});

const quarterlyTargetSchema = z.object({
  quarter: z.string().min(1, "יש לבחור רבעון"),
  year: z.string().min(1, "יש לבחור שנה"),
  general_target_amount: z.string().min(1, "יש להזין יעד כללי"),
  cfd_target_amount: z.string().min(1, "יש להזין יעד CFD"),
  workdays_in_period: z.string().optional(),
});

type MonthlyTargetValues = z.infer<typeof monthlyTargetSchema>;
type QuarterlyTargetValues = z.infer<typeof quarterlyTargetSchema>;

interface TargetFormProps {
  userId: string;
  onTargetAdded: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'monthly' | 'quarterly';
}

const TargetForm = ({ userId, onTargetAdded, open, onOpenChange, defaultTab = 'monthly' }: TargetFormProps) => {
  const { toast } = useToast();

  const monthlyForm = useForm<MonthlyTargetValues>({
    resolver: zodResolver(monthlyTargetSchema),
  });

  const quarterlyForm = useForm<QuarterlyTargetValues>({
    resolver: zodResolver(quarterlyTargetSchema),
  });

  const onMonthlySubmit = async (data: MonthlyTargetValues) => {
    try {
      const insertData: any = {
        sales_rep_id: userId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        general_target_amount: parseFloat(data.general_target_amount),
        cfd_target_amount: parseFloat(data.cfd_target_amount),
      };

      if (data.workdays_in_period) {
        insertData.workdays_in_period = parseInt(data.workdays_in_period);
      }

      const { error } = await supabase.from("monthly_targets").insert(insertData);

      if (error) throw error;

      toast({
        title: "יעד חודשי נוסף בהצלחה!",
        description: "היעד החדש נוסף למערכת",
      });

      monthlyForm.reset();
      onOpenChange(false);
      onTargetAdded();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהוספת היעד",
        variant: "destructive",
      });
    }
  };

  const onQuarterlySubmit = async (data: QuarterlyTargetValues) => {
    try {
      const insertData: any = {
        sales_rep_id: userId,
        quarter: parseInt(data.quarter),
        year: parseInt(data.year),
        general_target_amount: parseFloat(data.general_target_amount),
        cfd_target_amount: parseFloat(data.cfd_target_amount),
      };

      if (data.workdays_in_period) {
        insertData.workdays_in_period = parseInt(data.workdays_in_period);
      }

      const { error } = await supabase.from("quarterly_targets").insert(insertData);

      if (error) throw error;

      toast({
        title: "יעד רבעוני נוסף בהצלחה!",
        description: "היעד החדש נוסף למערכת",
      });

      quarterlyForm.reset();
      onOpenChange(false);
      onTargetAdded();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהוספת היעד",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הגדרת יעדים</DialogTitle>
          <DialogDescription>הגדר יעדים חודשיים ורבעוניים</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">חודשי</TabsTrigger>
            <TabsTrigger value="quarterly">רבעוני</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <Form {...monthlyForm}>
              <form onSubmit={monthlyForm.handleSubmit(onMonthlySubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={monthlyForm.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>חודש</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר חודש" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">ינואר (1)</SelectItem>
                            <SelectItem value="2">פברואר (2)</SelectItem>
                            <SelectItem value="3">מרץ (3)</SelectItem>
                            <SelectItem value="4">אפריל (4)</SelectItem>
                            <SelectItem value="5">מאי (5)</SelectItem>
                            <SelectItem value="6">יוני (6)</SelectItem>
                            <SelectItem value="7">יולי (7)</SelectItem>
                            <SelectItem value="8">אוגוסט (8)</SelectItem>
                            <SelectItem value="9">ספטמבר (9)</SelectItem>
                            <SelectItem value="10">אוקטובר (10)</SelectItem>
                            <SelectItem value="11">נובמבר (11)</SelectItem>
                            <SelectItem value="12">דצמבר (12)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={monthlyForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שנה</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר שנה" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2027">2027</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={monthlyForm.control}
                  name="general_target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>יעד כללי כמותי (מספר לקוחות EQ+CFD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                      </FormControl>
                      <FormDescription>מספר סך כל הלקוחות החדשים ליעד</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={monthlyForm.control}
                  name="cfd_target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>יעד CFD כמותי (מספר לקוחות CFD בלבד)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5" {...field} />
                      </FormControl>
                      <FormDescription>מספר לקוחות CFD בלבד ליעד</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={monthlyForm.control}
                  name="workdays_in_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ימי עבודה בחודש (אופציונלי)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="22" {...field} />
                      </FormControl>
                      <FormDescription>לא כולל שישי-שבת. ישמש לחישובים עתידיים</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  שמור יעד חודשי
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="quarterly">
            <Form {...quarterlyForm}>
              <form onSubmit={quarterlyForm.handleSubmit(onQuarterlySubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={quarterlyForm.control}
                    name="quarter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>רבעון</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר רבעון" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">רבעון 1 (ינואר-מרץ)</SelectItem>
                            <SelectItem value="2">רבעון 2 (אפריל-יוני)</SelectItem>
                            <SelectItem value="3">רבעון 3 (יולי-ספטמבר)</SelectItem>
                            <SelectItem value="4">רבעון 4 (אוקטובר-דצמבר)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={quarterlyForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שנה</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר שנה" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2027">2027</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={quarterlyForm.control}
                  name="general_target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>יעד כללי כמותי (מספר לקוחות EQ+CFD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="30" {...field} />
                      </FormControl>
                      <FormDescription>מספר סך כל הלקוחות החדשים ליעד</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={quarterlyForm.control}
                  name="cfd_target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>יעד CFD כמותי (מספר לקוחות CFD בלבד)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15" {...field} />
                      </FormControl>
                      <FormDescription>מספר לקוחות CFD בלבד ליעד</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={quarterlyForm.control}
                  name="workdays_in_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ימי עבודה ברבעון (אופציונלי)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="65" {...field} />
                      </FormControl>
                      <FormDescription>לא כולל שישי-שבת. ישמש לחישובים עתידיים</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  שמור יעד רבעוני
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TargetForm;
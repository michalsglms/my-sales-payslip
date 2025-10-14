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
                        <FormControl>
                          <Input type="number" min="1" max="12" placeholder="1-12" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input type="number" min="2024" placeholder="2025" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input type="number" min="1" max="4" placeholder="1-4" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input type="number" min="2024" placeholder="2025" {...field} />
                        </FormControl>
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
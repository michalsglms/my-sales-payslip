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
  target_amount: z.string().min(1, "יש להזין יעד"),
});

const quarterlyTargetSchema = z.object({
  quarter: z.string().min(1, "יש לבחור רבעון"),
  year: z.string().min(1, "יש לבחור שנה"),
  target_amount: z.string().min(1, "יש להזין יעד"),
});

type MonthlyTargetValues = z.infer<typeof monthlyTargetSchema>;
type QuarterlyTargetValues = z.infer<typeof quarterlyTargetSchema>;

interface TargetFormProps {
  userId: string;
  onTargetAdded: () => void;
}

const TargetForm = ({ userId, onTargetAdded }: TargetFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const monthlyForm = useForm<MonthlyTargetValues>({
    resolver: zodResolver(monthlyTargetSchema),
  });

  const quarterlyForm = useForm<QuarterlyTargetValues>({
    resolver: zodResolver(quarterlyTargetSchema),
  });

  const onMonthlySubmit = async (data: MonthlyTargetValues) => {
    try {
      const { error } = await supabase.from("monthly_targets").insert({
        sales_rep_id: userId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        target_amount: parseFloat(data.target_amount),
      });

      if (error) throw error;

      toast({
        title: "יעד חודשי נוסף בהצלחה!",
        description: "היעד החדש נוסף למערכת",
      });

      monthlyForm.reset();
      setOpen(false);
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
      const { error } = await supabase.from("quarterly_targets").insert({
        sales_rep_id: userId,
        quarter: parseInt(data.quarter),
        year: parseInt(data.year),
        target_amount: parseFloat(data.target_amount),
      });

      if (error) throw error;

      toast({
        title: "יעד רבעוני נוסף בהצלחה!",
        description: "היעד החדש נוסף למערכת",
      });

      quarterlyForm.reset();
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Target className="ml-2 h-4 w-4" />
          הגדר יעדים
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הגדרת יעדים</DialogTitle>
          <DialogDescription>הגדר יעדים חודשיים ורבעוניים</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="monthly" dir="rtl">
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
                  name="target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>יעד כמותי (מספר לקוחות)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                      </FormControl>
                      <FormDescription>מספר הלקוחות החדשים ליעד</FormDescription>
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
                  name="target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>יעד כמותי (מספר לקוחות)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="30" {...field} />
                      </FormControl>
                      <FormDescription>מספר הלקוחות החדשים ליעד</FormDescription>
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
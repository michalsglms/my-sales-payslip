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
import { Pencil } from "lucide-react";

const salarySchema = z.object({
  base_salary: z.string().min(1, "יש להזין שכר בסיס"),
  deduction_amount: z.string().min(0, "סכום קיזוז לא תקין"),
});

type SalaryValues = z.infer<typeof salarySchema>;

interface EditBaseSalaryProps {
  userId: string;
  currentBaseSalary: number;
  currentDeduction: number;
  onSalaryUpdated: () => void;
}

const EditBaseSalary = ({ userId, currentBaseSalary, currentDeduction, onSalaryUpdated }: EditBaseSalaryProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SalaryValues>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      base_salary: currentBaseSalary.toString(),
      deduction_amount: currentDeduction.toString(),
    },
  });

  const onSubmit = async (data: SalaryValues) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          base_salary: parseFloat(data.base_salary),
          deduction_amount: parseFloat(data.deduction_amount),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "הנתונים עודכנו בהצלחה!",
        description: "שכר הבסיס וסכום הקיזוז עודכנו במערכת",
      });

      setOpen(false);
      onSalaryUpdated();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון הנתונים",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת שכר בסיס</DialogTitle>
          <DialogDescription>עדכן את שכר הבסיס החודשי ואת סכום הקיזוז</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="base_salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שכר בסיס חודשי (₪)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="9000" {...field} />
                  </FormControl>
                  <FormDescription>שכר הבסיס החודשי בשקלים</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deduction_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סכום קיזוז חודשי (₪)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>סכום שיקוזז מבונוס EQ</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                שמור שינויים
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                ביטול
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBaseSalary;
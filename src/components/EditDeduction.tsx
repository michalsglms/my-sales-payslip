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

const deductionSchema = z.object({
  deduction_amount: z.string().min(1, "יש להזין סכום קיזוז"),
});

type DeductionValues = z.infer<typeof deductionSchema>;

interface EditDeductionProps {
  userId: string;
  currentDeduction: number;
  onDeductionUpdated: () => void;
}

const EditDeduction = ({ userId, currentDeduction, onDeductionUpdated }: EditDeductionProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<DeductionValues>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      deduction_amount: currentDeduction.toString(),
    },
  });

  const onSubmit = async (data: DeductionValues) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          deduction_amount: parseFloat(data.deduction_amount),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "סכום הקיזוז עודכן בהצלחה!",
        description: "סכום הקיזוז עודכן במערכת",
      });

      setOpen(false);
      onDeductionUpdated();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון סכום הקיזוז",
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
          <DialogTitle>עריכת סכום קיזוז</DialogTitle>
          <DialogDescription>עדכן את סכום הקיזוז החודשי</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

export default EditDeduction;

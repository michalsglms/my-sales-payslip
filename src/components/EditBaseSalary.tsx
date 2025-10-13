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

const baseSalarySchema = z.object({
  base_salary: z.string().min(1, "יש להזין שכר בסיס"),
});

type BaseSalaryValues = z.infer<typeof baseSalarySchema>;

interface EditBaseSalaryProps {
  userId: string;
  currentBaseSalary: number;
  onSalaryUpdated: () => void;
}

const EditBaseSalary = ({ userId, currentBaseSalary, onSalaryUpdated }: EditBaseSalaryProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<BaseSalaryValues>({
    resolver: zodResolver(baseSalarySchema),
    defaultValues: {
      base_salary: currentBaseSalary.toString(),
    },
  });

  const onSubmit = async (data: BaseSalaryValues) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          base_salary: parseFloat(data.base_salary),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "שכר בסיס עודכן בהצלחה!",
        description: "שכר הבסיס עודכן במערכת",
      });

      setOpen(false);
      onSalaryUpdated();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון שכר הבסיס",
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
          <DialogDescription>עדכן את שכר הבסיס החודשי</DialogDescription>
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
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

const targetSchema = z.object({
  general_target_amount: z.string().min(1, "יש להזין יעד כללי"),
  cfd_target_amount: z.string().min(1, "יש להזין יעד CFD"),
});

type TargetValues = z.infer<typeof targetSchema>;

interface EditTargetDialogProps {
  targetId: string;
  targetType: "monthly" | "quarterly";
  currentGeneralTarget: number;
  currentCfdTarget: number;
  period: string;
  onTargetUpdated: () => void;
}

const EditTargetDialog = ({
  targetId,
  targetType,
  currentGeneralTarget,
  currentCfdTarget,
  period,
  onTargetUpdated,
}: EditTargetDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TargetValues>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      general_target_amount: currentGeneralTarget.toString(),
      cfd_target_amount: currentCfdTarget.toString(),
    },
  });

  const onSubmit = async (data: TargetValues) => {
    try {
      const tableName = targetType === "monthly" ? "monthly_targets" : "quarterly_targets";
      
      const { error } = await supabase
        .from(tableName)
        .update({
          general_target_amount: parseFloat(data.general_target_amount),
          cfd_target_amount: parseFloat(data.cfd_target_amount),
        })
        .eq("id", targetId);

      if (error) throw error;

      toast({
        title: "יעד עודכן בהצלחה!",
        description: "היעד עודכן במערכת",
      });

      setOpen(false);
      onTargetUpdated();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון היעד",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת יעד {period}</DialogTitle>
          <DialogDescription>עדכן את היעדים הכמותיים</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
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

export default EditTargetDialog;
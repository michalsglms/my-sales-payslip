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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

const dealSchema = z.object({
  client_type: z.enum(["EQ", "CFD"], { required_error: "יש לבחור סוג לקוח" }),
  traffic_source: z.enum(["AFF", "RFF", "PPC", "ORG"], { required_error: "יש לבחור מקור הגעה" }),
  initial_deposit: z.string().min(1, "יש להזין סכום הפקדה"),
  is_new_client: z.boolean().default(true),
  completed_within_4_days: z.boolean().default(false),
  notes: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  userId: string;
  onDealAdded: () => void;
}

const DealForm = ({ userId, onDealAdded }: DealFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      is_new_client: true,
      completed_within_4_days: false,
    },
  });

  const onSubmit = async (data: DealFormValues) => {
    try {
      const { error } = await supabase.from("deals").insert({
        sales_rep_id: userId,
        client_type: data.client_type,
        traffic_source: data.traffic_source,
        initial_deposit: parseFloat(data.initial_deposit),
        is_new_client: data.is_new_client,
        completed_within_4_days: data.completed_within_4_days,
        notes: data.notes,
      });

      if (error) throw error;

      toast({
        title: "עסקה נוספה בהצלחה!",
        description: "העסקה החדשה נוספה למערכת",
      });

      form.reset();
      setOpen(false);
      onDealAdded();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהוספת העסקה",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          הוסף עסקה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת עסקה חדשה</DialogTitle>
          <DialogDescription>הזן את פרטי העסקה</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג לקוח</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סוג לקוח" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EQ">EQ - אקוויטי</SelectItem>
                      <SelectItem value="CFD">CFD - חוזה הפרשים</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="traffic_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מקור הגעה</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר מקור הגעה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RFF">RFF - הפניה</SelectItem>
                      <SelectItem value="PPC">PPC - פרסום ממומן</SelectItem>
                      <SelectItem value="ORG">ORG - אורגני</SelectItem>
                      <SelectItem value="AFF">AFF - שיווק שותפים</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initial_deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הפקדה ראשונית ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="3000" {...field} />
                  </FormControl>
                  <FormDescription>הזן סכום בדולרים</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_new_client"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none mr-3">
                    <FormLabel>לקוח חדש</FormLabel>
                    <FormDescription>האם זה לקוח חדש לחברה?</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completed_within_4_days"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none mr-3">
                    <FormLabel>הושלם תוך 4 ימים</FormLabel>
                    <FormDescription>האם ההפקדה הושלמה תוך 4 ימים?</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea placeholder="הערות נוספות..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              שמור עסקה
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DealForm;

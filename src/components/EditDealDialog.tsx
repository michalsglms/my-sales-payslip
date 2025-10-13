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
import { Textarea } from "@/components/ui/textarea";

const dealSchema = z.object({
  client_name: z.string().min(1, "יש להזין שם לקוח"),
  client_phone: z.string().min(1, "יש להזין טלפון לקוח"),
  client_type: z.enum(["EQ", "CFD"], { required_error: "יש לבחור סוג לקוח" }),
  traffic_source: z.enum(["AFF", "RFF", "PPC", "ORG"], { required_error: "יש לבחור מקור הגעה" }),
  initial_deposit: z.string().min(1, "יש להזין סכום הפקדה"),
  client_link: z.string().optional(),
  notes: z.string().optional(),
  campaign: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface Deal {
  id: string;
  client_name?: string;
  client_phone?: string;
  client_type: "EQ" | "CFD";
  traffic_source: "AFF" | "RFF" | "PPC" | "ORG";
  initial_deposit: number;
  client_link?: string;
  notes?: string;
  campaign?: string;
}

interface EditDealDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated: () => void;
}

const EditDealDialog = ({ deal, open, onOpenChange, onDealUpdated }: EditDealDialogProps) => {
  const { toast } = useToast();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      client_name: deal.client_name || "",
      client_phone: deal.client_phone || "",
      client_type: deal.client_type,
      traffic_source: deal.traffic_source,
      initial_deposit: deal.initial_deposit.toString(),
      client_link: deal.client_link || "",
      notes: deal.notes || "",
      campaign: deal.campaign || "",
    },
  });

  const onSubmit = async (data: DealFormValues) => {
    try {
      const { error } = await supabase
        .from("deals")
        .update({
          client_name: data.client_name,
          client_phone: data.client_phone,
          client_type: data.client_type,
          traffic_source: data.traffic_source,
          initial_deposit: parseFloat(data.initial_deposit),
          client_link: data.client_link,
          notes: data.notes,
          campaign: data.campaign,
        })
        .eq("id", deal.id);

      if (error) throw error;

      toast({
        title: "עסקה עודכנה בהצלחה!",
        description: "השינויים נשמרו במערכת",
      });

      onOpenChange(false);
      onDealUpdated();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון העסקה",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת עסקה</DialogTitle>
          <DialogDescription>ערוך את פרטי העסקה</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הלקוח</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן שם לקוח" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>טלפון הלקוח</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="הזן מספר טלפון" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <SelectItem value="RFF">RFF</SelectItem>
                      <SelectItem value="PPC">PPC</SelectItem>
                      <SelectItem value="ORG">ORG</SelectItem>
                      <SelectItem value="AFF">AFF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("traffic_source") === "AFF" && (
              <FormField
                control={form.control}
                name="campaign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם אפילייאט</FormLabel>
                    <FormControl>
                      <Input placeholder="הזן שם אפילייאט" {...field} />
                    </FormControl>
                    <FormDescription>שם האפילייאט שהפנה את הלקוח</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              name="client_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>קישור ללקוח</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>קישור לפרופיל הלקוח במערכת</FormDescription>
                  <FormMessage />
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
              שמור שינויים
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDealDialog;

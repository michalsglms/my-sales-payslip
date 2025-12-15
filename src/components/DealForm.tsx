import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const dealSchema = z.object({
  client_name: z.string().min(1, "יש להזין שם לקוח"),
  client_phone: z.string().optional(),
  client_type: z.enum(["EQ", "CFD"], { required_error: "יש לבחור סוג לקוח" }),
  traffic_source: z.enum(["AFF", "RFF", "PPC", "ORG"], { required_error: "יש לבחור מקור הגעה" }),
  initial_deposit: z.string().min(1, "יש להזין סכום הפקדה"),
  affiliate_name: z.string().optional(),
  client_link: z.string().optional(),
  notes: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  userId: string;
  onDealAdded: () => void;
}

const DealForm = ({ userId, onDealAdded }: DealFormProps) => {
  const [open, setOpen] = useState(false);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  const [affiliateNames, setAffiliateNames] = useState<string[]>([]);
  const [newAffiliateName, setNewAffiliateName] = useState("");
  const { toast } = useToast();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
  });

  const trafficSource = form.watch("traffic_source");

  useEffect(() => {
    fetchAffiliateNames();
  }, []);

  const fetchAffiliateNames = async () => {
    const { data, error } = await (supabase as any)
      .from("affiliate_names")
      .select("name")
      .order("name");

    if (error) {
      console.error("Error fetching affiliate names:", error);
      return;
    }

    if (data) {
      setAffiliateNames(data.map((item: any) => item.name));
    }
  };

  const handleAddAffiliateName = async () => {
    if (!newAffiliateName.trim()) return;

    const { error } = await (supabase as any)
      .from("affiliate_names")
      .insert({ name: newAffiliateName.trim() });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "שם זה כבר קיים",
          description: "השם שהזנת כבר קיים במערכת",
          variant: "destructive",
        });
      } else {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בהוספת השם",
          variant: "destructive",
        });
      }
      return;
    }

    await fetchAffiliateNames();
    form.setValue("affiliate_name", newAffiliateName.trim());
    setNewAffiliateName("");
    setAffiliateOpen(false);

    toast({
      title: "השם נוסף בהצלחה!",
      description: "השם החדש זמין כעת לשימוש",
    });
  };

  const onSubmit = async (data: DealFormValues) => {
    try {
      const { error } = await supabase.from("deals").insert({
        sales_rep_id: userId,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_type: data.client_type,
        traffic_source: data.traffic_source,
        initial_deposit: parseFloat(data.initial_deposit),
        is_new_client: true,
        affiliate_name: data.affiliate_name,
        client_link: data.client_link,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת עסקה חדשה</DialogTitle>
          <DialogDescription>הזן את פרטי העסקה</DialogDescription>
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
                    <Input 
                      placeholder="שם פרטי ושם משפחה" 
                      autoComplete="off"
                      {...field} 
                    />
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

            {trafficSource === "AFF" && (
              <FormField
                control={form.control}
                name="affiliate_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>שם אפילייט</FormLabel>
                    <Popover open={affiliateOpen} onOpenChange={setAffiliateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "בחר או הוסף שם אפילייט"}
                            <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="חפש או הוסף שם אפילייט..."
                            value={newAffiliateName}
                            onValueChange={setNewAffiliateName}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full justify-start"
                                  onClick={handleAddAffiliateName}
                                >
                                  <Plus className="ml-2 h-4 w-4" />
                                  הוסף "{newAffiliateName}"
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {affiliateNames.map((name) => (
                                <CommandItem
                                  key={name}
                                  value={name}
                                  onSelect={() => {
                                    form.setValue("affiliate_name", name);
                                    setAffiliateOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "ml-2 h-4 w-4",
                                      field.value === name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>בחר מהרשימה או הוסף שם חדש</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              שמור עסקה
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DealForm;

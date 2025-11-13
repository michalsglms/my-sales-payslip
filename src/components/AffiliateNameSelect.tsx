import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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

interface AffiliateNameSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const AffiliateNameSelect = ({ value, onChange, className }: AffiliateNameSelectProps) => {
  const [open, setOpen] = useState(false);
  const [affiliateNames, setAffiliateNames] = useState<string[]>([]);
  const [newAffiliateName, setNewAffiliateName] = useState("");
  const { toast } = useToast();

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
    onChange(newAffiliateName.trim());
    setNewAffiliateName("");
    setOpen(false);

    toast({
      title: "השם נוסף בהצלחה!",
      description: "השם החדש זמין כעת לשימוש",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between h-9",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value || "בחר או הוסף שם אפילייט"}
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
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
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === name ? "opacity-100" : "opacity-0"
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
  );
};

export default AffiliateNameSelect;

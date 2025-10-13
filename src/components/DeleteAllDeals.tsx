import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteAllDealsProps {
  userId: string;
  onDealsDeleted: () => void;
}

const DeleteAllDeals = ({ userId, onDealsDeleted }: DeleteAllDealsProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("sales_rep_id", userId);

      if (error) throw error;

      toast({
        title: "העסקאות נמחקו בהצלחה",
        description: "כל העסקאות נמחקו מהמערכת",
      });

      onDealsDeleted();
    } catch (error) {
      console.error("Error deleting deals:", error);
      toast({
        title: "שגיאה במחיקה",
        description: "אירעה שגיאה במחיקת העסקאות",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeleting}>
          <Trash2 className="ml-2 h-4 w-4" />
          מחק הכל
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תמחק את כל העסקאות שלך ולא ניתן לבטל אותה.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteAll} disabled={isDeleting}>
            {isDeleting ? "מוחק..." : "מחק הכל"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAllDeals;

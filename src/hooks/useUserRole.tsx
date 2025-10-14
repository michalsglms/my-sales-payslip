import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = (userId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!userId) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });

        if (error) throw error;
        setIsAdmin(Boolean(data));
      } catch (error) {
        console.error("Error checking user role:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();
  }, [userId]);

  return { isAdmin, isLoading };
};

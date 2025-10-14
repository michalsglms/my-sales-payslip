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
        console.log("useUserRole: checking role for user", userId);
        const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
        if (error) {
          console.error("useUserRole: is_admin RPC error", error);
          // Fallback to direct table check
          const { data: directData, error: directError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();
          if (directError) throw directError;
          setIsAdmin(!!directData);
        } else {
          console.log("useUserRole: is_admin result", data);
          setIsAdmin(Boolean(data));
        }
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


import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/auth";

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log("Profile fetched successfully:", data);
        setProfile(data as Profile);
      } else {
        console.log("No profile found for user:", userId);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  return {
    profile,
    setProfile,
    fetchProfile
  };
};


import { supabase } from "@/integrations/supabase/client";

export const authService = {
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  signUp: async (email: string, password: string, userData: Record<string, any>) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
  },
  
  signIn: async (email: string, password: string) => {
    // First ensure no existing session
    await supabase.auth.signOut();
    
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

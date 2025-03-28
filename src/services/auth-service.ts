
import { supabase } from "@/integrations/supabase/client";

export const authService = {
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  signUp: async (email: string, password: string, userData: Record<string, any>) => {
    console.log("Auth service: Signing up with user data:", userData);
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
    try {
      console.log("Auth service: Signing out");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }
      console.log("Auth service: Successfully signed out");
      return { error: null };
    } catch (error) {
      console.error("Unexpected signOut error:", error);
      return { error };
    }
  },
  
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

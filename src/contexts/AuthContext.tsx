
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'admin' | 'client' | 'mechanic';
}

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isMechanic: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            role: 'client', // Default role for new users
          },
        },
      });

      if (error) {
        toast({
          title: "Ошибка при регистрации",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Регистрация прошла успешно",
        description: "Вы успешно зарегистрировались в системе",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при регистрации",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Ошибка при входе",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в систему!",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при входе",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Ошибка при выходе",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при выходе из системы",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isMechanic = profile?.role === 'mechanic';
  const isClient = profile?.role === 'client';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        signUp,
        signIn,
        signOut,
        loading,
        isAdmin,
        isMechanic,
        isClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

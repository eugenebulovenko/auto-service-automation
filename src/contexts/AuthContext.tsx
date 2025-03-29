
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/use-profile";
import { authService } from "@/services/auth-service";
import { AuthContextProps, Profile } from "@/types/auth";

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, setProfile, fetchProfile } = useProfile();

  useEffect(() => {
    console.log("AuthProvider: Initializing");
    
    // Set up listener for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, currentSession) => {
        console.log("AuthProvider: Auth state changed", { event, session: currentSession?.user?.id });
        
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
    const getInitialSession = async () => {
      try {
        setLoading(true);
        console.log("AuthProvider: Getting initial session");
        
        const { data, error } = await authService.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        console.log("AuthProvider: Initial session fetched", { session: data?.session?.user?.id });
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          await fetchProfile(data.session.user.id);
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
    try {
      setLoading(true);
      console.log("AuthProvider: Signing up", { email, firstName, lastName });
      
      const userData = {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: 'client', // Default role for new users
      };
      
      const { data, error } = await authService.signUp(email, password, userData);

      if (error) {
        console.error("Signup error:", error);
        toast({
          title: "Ошибка при регистрации",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        console.log("User signed up successfully:", data.user.id);
        toast({
          title: "Регистрация прошла успешно",
          description: "Вы успешно зарегистрировались в системе",
        });
        
        navigate("/dashboard");
      } else {
        toast({
          title: "Требуется подтверждение",
          description: "Пожалуйста, проверьте свою электронную почту для подтверждения регистрации",
        });
      }
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
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
      console.log("AuthProvider: Signing in", { email });
      
      const { data, error } = await authService.signIn(email, password);

      if (error) {
        console.error("Login error:", error);
        toast({
          title: "Ошибка при входе",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log("User signed in successfully:", data.user?.id);
      console.log("Session data:", data.session);
      
      // Manually update state
      setUser(data.user);
      setSession(data.session);
      
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в систему!",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Unexpected login error:", error);
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
      console.log("AuthProvider: Signing out");
      
      const { error } = await authService.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        toast({
          title: "Ошибка при выходе",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Принудительно очищаем состояние
      setUser(null);
      setSession(null);
      setProfile(null);
      
      console.log("User signed out successfully");
      
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
      
      // Редирект на главную страницу
      navigate("/");
    } catch (error: any) {
      console.error("Unexpected logout error:", error);
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


import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthFormProps {
  type: "login" | "register";
}

const AuthForm = ({ type }: AuthFormProps) => {
  const { toast } = useToast();
  const { signIn, signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      console.log("Form submitted", { type, email: formData.email });
      
      // Basic validation
      if (type === "register") {
        if (!formData.firstName.trim()) {
          toast({
            title: "Ошибка",
            description: "Пожалуйста, введите ваше имя",
            variant: "destructive",
          });
          return;
        }
        
        if (!formData.lastName.trim()) {
          toast({
            title: "Ошибка",
            description: "Пожалуйста, введите вашу фамилию",
            variant: "destructive",
          });
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Ошибка",
            description: "Пароли не совпадают",
            variant: "destructive",
          });
          return;
        }
        
        if (!formData.acceptTerms) {
          toast({
            title: "Ошибка",
            description: "Необходимо принять условия использования",
            variant: "destructive",
          });
          return;
        }
      }
      
      if (!formData.email.trim()) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите email",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.password.trim()) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите пароль",
          variant: "destructive",
        });
        return;
      }

      if (type === "login") {
        console.log("Attempting to sign in with:", formData.email, "password length:", formData.password.length);
        await signIn(formData.email, formData.password);
      } else {
        console.log("Attempting to sign up");
        await signUp(
          formData.email, 
          formData.password, 
          formData.firstName, 
          formData.lastName,
          formData.phone
        );
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // For testing purposes, provide defaults for the login form
  const populateTestCredentials = (userType: 'admin' | 'mechanic' | 'client') => {
    const credentials = {
      admin: { email: 'admin@test.com', password: 'admin123' },
      mechanic: { email: 'mechanic@test.com', password: 'mechanic123' },
      client: { email: 'client@test.com', password: 'client123' }
    };
    
    setFormData(prev => ({
      ...prev,
      email: credentials[userType].email,
      password: credentials[userType].password
    }));
  };

  return (
    <div className="glass w-full max-w-md mx-auto rounded-lg p-6 sm:p-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {type === "login" ? "Вход в систему" : "Регистрация"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "register" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Иван"
                  className="pl-10"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Иванов"
                  className="pl-10"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  className="pl-10"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              className="pl-10"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className="pl-10 pr-10"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        {type === "register" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="acceptTerms" 
                name="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({...prev, acceptTerms: !!checked}))
                }
              />
              <Label htmlFor="acceptTerms" className="text-sm text-muted-foreground">
                Я согласен с <Link to="/terms" className="text-primary underline">условиями использования</Link> и <Link to="/privacy" className="text-primary underline">политикой конфиденциальности</Link>.
              </Label>
            </div>
          </>
        )}
        
        {type === "login" && (
          <>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Забыли пароль?
              </Link>
            </div>
            
            {/* Quick login buttons for testing */}
            <div className="flex flex-col gap-2 my-2 pt-2 border-t">
              <p className="text-sm text-muted-foreground">Тестовые аккаунты:</p>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => populateTestCredentials('admin')}
                >
                  Админ
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => populateTestCredentials('mechanic')}
                >
                  Механик
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => populateTestCredentials('client')}
                >
                  Клиент
                </Button>
              </div>
            </div>
          </>
        )}
        
        <Button type="submit" className="w-full mt-6" disabled={loading || submitting}>
          {loading || submitting ? "Загрузка..." : type === "login" ? "Войти" : "Зарегистрироваться"}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {type === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}
          <Link
            to={type === "login" ? "/register" : "/login"}
            className="ml-1 text-primary hover:underline"
          >
            {type === "login" ? "Зарегистрироваться" : "Войти"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;

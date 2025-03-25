
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (data: any) => void;
}

const AuthForm = ({ type, onSubmit }: AuthFormProps) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (type === "register") {
      if (!formData.name.trim()) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите ваше имя",
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

    onSubmit(formData);
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
              <Label htmlFor="name">Имя</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Иван Иванов"
                  className="pl-10"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+7 (XXX) XXX-XX-XX"
                value={formData.phone}
                onChange={handleChange}
              />
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
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
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
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Забыли пароль?
            </Link>
          </div>
        )}
        
        <Button type="submit" className="w-full mt-6">
          {type === "login" ? "Войти" : "Зарегистрироваться"}
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

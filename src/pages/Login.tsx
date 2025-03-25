
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AuthForm from "@/components/AuthForm";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (data: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Success login simulation (would be replaced with actual API call)
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в систему!",
      });
      
      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <AuthForm type="login" onSubmit={handleLogin} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;

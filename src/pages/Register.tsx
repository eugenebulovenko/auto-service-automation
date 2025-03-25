
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AuthForm from "@/components/AuthForm";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (data: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Success registration simulation (would be replaced with actual API call)
      toast({
        title: "Успешная регистрация",
        description: "Ваш аккаунт успешно создан!",
      });
      
      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <AuthForm type="register" onSubmit={handleRegister} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;

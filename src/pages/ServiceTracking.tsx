
import { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import ServiceTracker from "@/components/ServiceTracker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ServiceTracking = () => {
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          appointments(
            *,
            vehicles(*),
            profiles(first_name, last_name)
          ),
          profiles(first_name, last_name),
          order_status_updates(
            *,
            profiles(first_name, last_name)
          )
        `)
        .eq('order_number', orderNumber.trim())
        .single();
      
      if (error) throw error;
      
      if (data) {
        setWorkOrder(data);
        setIsTracking(true);
      } else {
        toast({
          title: "Заказ не найден",
          description: "Проверьте номер заказ-наряда и попробуйте снова",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching work order:", error);
      toast({
        title: "Ошибка поиска",
        description: "Не удалось найти информацию по указанному номеру заказа",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-3">Отслеживание статуса ремонта</h1>
            <p className="text-foreground/70 max-w-xl mx-auto">
              Введите номер заказа для получения актуальной информации о ходе выполнения работ
            </p>
          </div>
          
          {!isTracking ? (
            <div className="glass rounded-xl p-8 text-center">
              <form onSubmit={handleSearch} className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Введите номер заказа (например: R-2023-0542)"
                    className="pl-10"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !orderNumber.trim()}
                >
                  {loading ? "Поиск..." : "Отследить"}
                </Button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsTracking(false)}
                  className="text-sm"
                >
                  ← Назад к поиску
                </Button>
                <span className="text-sm text-muted-foreground">
                  Заказ: <span className="font-medium">{orderNumber}</span>
                </span>
              </div>
              <ServiceTracker workOrder={workOrder} />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ServiceTracking;

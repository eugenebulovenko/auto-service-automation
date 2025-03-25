
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Calendar, Car, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const ServiceTracker = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState<any[]>([]);

  // Получаем данные о заказе по его номеру или ID
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        let query;
        
        // Если передан orderId через URL параметры
        if (orderId) {
          query = supabase
            .from('work_orders')
            .select(`
              *,
              appointments(
                *,
                vehicles(*),
                profiles(first_name, last_name, phone)
              ),
              profiles:mechanic_id(first_name, last_name)
            `)
            .eq('id', orderId)
            .single();
        } else {
          // Для демонстрации - загружаем первый заказ
          query = supabase
            .from('work_orders')
            .select(`
              *,
              appointments(
                *,
                vehicles(*),
                profiles(first_name, last_name, phone)
              ),
              profiles:mechanic_id(first_name, last_name)
            `)
            .limit(1)
            .single();
        }
        
        const { data, error } = await query;
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Записи не найдены - используем заглушку
            setOrder({
              id: "demo-id",
              order_number: "R-2023-0542",
              status: "in_progress",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              appointments: {
                appointment_date: "2023-10-15",
                vehicles: {
                  make: "Toyota",
                  model: "Camry",
                  year: 2019
                },
                profiles: {
                  first_name: "Иван",
                  last_name: "Иванов"
                }
              },
              profiles: {
                first_name: "Петр",
                last_name: "Петров"
              }
            });
            
            setStatusUpdates([
              {
                id: "1",
                status: "created",
                comment: "Заказ-наряд создан",
                created_at: "2023-10-15T08:00:00"
              },
              {
                id: "2",
                status: "in_progress",
                comment: "Автомобиль принят в работу",
                created_at: "2023-10-15T09:30:00"
              },
              {
                id: "3",
                status: "in_progress",
                comment: "Диагностика выполнена. Обнаружены проблемы с тормозной системой.",
                created_at: "2023-10-15T10:15:00"
              },
              {
                id: "4",
                status: "in_progress",
                comment: "Заменены тормозные колодки и диски",
                created_at: "2023-10-15T11:45:00"
              }
            ]);
          } else {
            console.error('Error fetching order details:', error);
          }
        } else {
          setOrder(data);
          
          // Загружаем обновления статуса
          const { data: updatesData, error: updatesError } = await supabase
            .from('order_status_updates')
            .select(`
              *,
              profiles:created_by(first_name, last_name)
            `)
            .eq('work_order_id', data.id)
            .order('created_at', { ascending: true });
          
          if (updatesError) {
            console.error('Error fetching status updates:', updatesError);
          } else {
            setStatusUpdates(updatesData);
          }
        }
      } catch (error) {
        console.error('Error in tracker component:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);

  const formatDateTime = (dateTimeStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeStr).toLocaleDateString('ru-RU', options);
  };

  const calculateProgress = () => {
    switch (order?.status) {
      case 'created':
        return 20;
      case 'in_progress':
        return 60;
      case 'completed':
        return 90;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return 'Создан';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Работы завершены';
      case 'delivered':
        return 'Выполнен';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <Wrench className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Загрузка информации о заказе...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Заказ-наряд #{order?.order_number}</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {getStatusText(order?.status)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="space-y-2">
              <div className="flex items-center text-muted-foreground">
                <Car className="h-4 w-4 mr-2" />
                <span>Автомобиль:</span>
              </div>
              <p className="font-medium">
                {order?.appointments?.vehicles?.make} {order?.appointments?.vehicles?.model} ({order?.appointments?.vehicles?.year})
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Дата приема:</span>
              </div>
              <p className="font-medium">
                {order?.appointments?.appointment_date && new Date(order.appointments.appointment_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>Время приема:</span>
              </div>
              <p className="font-medium">
                {order?.appointments?.start_time}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-muted-foreground">
                <Wrench className="h-4 w-4 mr-2" />
                <span>Ответственный механик:</span>
              </div>
              <p className="font-medium">
                {order?.profiles ? `${order.profiles.first_name} ${order.profiles.last_name}` : "Не назначен"}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Прогресс выполнения:</h3>
            <div className="w-full bg-secondary rounded-full h-2.5 mb-2">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Создан</span>
              <span>В работе</span>
              <span>Выполнен</span>
              <span>Выдан</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ход выполнения работ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {statusUpdates.length > 0 ? (
              <ol className="relative border-l border-border ml-3">
                {statusUpdates.map((update, index) => (
                  <li key={update.id} className="mb-10 ml-6">
                    <span className="absolute flex items-center justify-center w-8 h-8 bg-background rounded-full -left-4 ring-4 ring-background">
                      {getStatusIcon(update.status)}
                    </span>
                    <div className="p-4 bg-secondary/40 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="flex items-center text-lg font-semibold">
                          {getStatusText(update.status)}
                        </h3>
                        <time className="text-xs text-muted-foreground">
                          {formatDateTime(update.created_at)}
                        </time>
                      </div>
                      <p className="mb-2 text-foreground">
                        {update.comment}
                      </p>
                      {update.profiles && (
                        <p className="text-sm text-muted-foreground">
                          От: {update.profiles.first_name} {update.profiles.last_name}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Нет обновлений о ходе работ</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceTracker;

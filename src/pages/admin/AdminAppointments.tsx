
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AdminAppointments = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          vehicles(make, model, year),
          profiles(first_name, last_name)
        `)
        .order('appointment_date', { ascending: true });

      if (error) {
        throw error;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить записи",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Статус обновлен",
        description: `Статус записи успешно изменен на "${newStatus}"`,
      });

      // Обновляем данные
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус записи",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Управление записями</h1>
        <p className="text-muted-foreground">
          Просмотр и управление записями клиентов на сервис
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Записи клиентов</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка данных...</div>
          ) : appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Дата</th>
                    <th className="text-left py-3 px-4">Время</th>
                    <th className="text-left py-3 px-4">Клиент</th>
                    <th className="text-left py-3 px-4">Автомобиль</th>
                    <th className="text-left py-3 px-4">Статус</th>
                    <th className="text-left py-3 px-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b">
                      <td className="py-3 px-4">{formatDate(appointment.appointment_date)}</td>
                      <td className="py-3 px-4">{appointment.start_time}</td>
                      <td className="py-3 px-4">
                        {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                      </td>
                      <td className="py-3 px-4">
                        {appointment.vehicles?.make} {appointment.vehicles?.model} ({appointment.vehicles?.year})
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          appointment.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status === 'pending' && 'Ожидает подтверждения'}
                          {appointment.status === 'confirmed' && 'Подтверждена'}
                          {appointment.status === 'completed' && 'Завершена'}
                          {appointment.status === 'cancelled' && 'Отменена'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {appointment.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="default" 
                                onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                              >
                                Подтвердить
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                              >
                                Отменить
                              </Button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(appointment.id, 'completed')}
                            >
                              Завершить
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет записей для отображения</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAppointments;


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, Search } from "lucide-react";

interface MechanicTasksProps {
  completed?: boolean;
}

const MechanicTasks = ({ completed = false }: MechanicTasksProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select(`
            *,
            appointments(
              appointment_date,
              start_time,
              vehicles(make, model, year)
            )
          `)
          .eq('mechanic_id', user.id)
          .in('status', completed ? ['completed', 'cancelled'] : ['created', 'in_progress'])
          .order('appointments.appointment_date', { ascending: !completed });
        
        if (error) throw error;
        
        setTasks(data || []);
        setFilteredTasks(data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список заданий",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [user, completed, toast]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTasks(tasks);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = tasks.filter(task => 
      task.order_number.toLowerCase().includes(lowercasedSearch) ||
      (task.appointments?.vehicles?.make + ' ' + task.appointments?.vehicles?.model).toLowerCase().includes(lowercasedSearch)
    );
    
    setFilteredTasks(filtered);
  }, [searchTerm, tasks]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Ожидает начала';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {completed ? "Выполненные задания" : "Текущие задания"}
        </h1>
        <p className="text-muted-foreground">
          {completed 
            ? "История выполненных работ" 
            : "Список назначенных вам заданий"
          }
        </p>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по номеру заказа или автомобилю..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка заданий...</p>
          </div>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="sm:flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold">Заказ #{task.order_number}</h3>
                        <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">
                        {task.appointments?.vehicles?.make} {task.appointments?.vehicles?.model} ({task.appointments?.vehicles?.year})
                      </p>
                      
                      <div className="space-y-1 text-sm mb-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-primary mr-2" />
                          <span>
                            {task.appointments?.appointment_date && formatDate(task.appointments.appointment_date)}, {task.appointments?.start_time}
                          </span>
                        </div>
                        
                        {task.start_date && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-primary mr-2" />
                            <span>Начато: {formatDate(task.start_date)}</span>
                          </div>
                        )}
                        
                        {task.completion_date && (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-primary mr-2" />
                            <span>Завершено: {formatDate(task.completion_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button className="mt-4 sm:mt-0" asChild>
                      <Link to={`/mechanic/tasks/${task.id}`}>
                        {completed ? "Просмотреть детали" : "Перейти к заданию"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mb-4 text-muted-foreground">
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg">
                {searchTerm ? "Ничего не найдено" : completed ? "У вас нет выполненных заданий" : "У вас нет активных заданий"}
              </p>
              <p className="mt-2">
                {searchTerm 
                  ? "Попробуйте изменить параметры поиска" 
                  : completed 
                    ? "История выполненных работ будет отображаться здесь" 
                    : "Новые задания будут отображаться здесь"
                }
              </p>
            </div>
            
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Сбросить поиск
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MechanicTasks;

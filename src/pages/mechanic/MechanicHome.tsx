
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, CheckSquare, ClipboardList, Clock } from "lucide-react";

const MechanicHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
  });
  const [nextTask, setNextTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Получаем количество заданий в ожидании
        const { count: pendingCount, error: pendingError } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('mechanic_id', user.id)
          .eq('status', 'created');

        // Получаем количество заданий в работе
        const { count: inProgressCount, error: inProgressError } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('mechanic_id', user.id)
          .eq('status', 'in_progress');

        // Получаем количество выполненных заданий
        const { count: completedCount, error: completedError } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('mechanic_id', user.id)
          .eq('status', 'completed');

        // Получаем следующее задание
        const { data: nextTaskData, error: nextTaskError } = await supabase
          .from('work_orders')
          .select(`
            *,
            appointments(appointment_date, start_time, vehicle_id),
            appointments.vehicles(make, model, year)
          `)
          .eq('mechanic_id', user.id)
          .or('status.eq.created,status.eq.in_progress')
          .order('appointments.appointment_date', { ascending: true })
          .order('appointments.start_time', { ascending: true })
          .limit(1)
          .single();

        setStats({
          pendingTasks: pendingCount || 0,
          inProgressTasks: inProgressCount || 0,
          completedTasks: completedCount || 0,
        });

        setNextTask(nextTaskData);
      } catch (error) {
        console.error("Error fetching mechanic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Панель механика</h1>
        <p className="text-muted-foreground">
          Обзор ваших текущих и предстоящих заданий
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ClipboardList className="mr-2 h-4 w-4 text-primary" />
              Ожидают выполнения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.pendingTasks}</div>
            <p className="text-muted-foreground text-sm">
              Назначенных заданий
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/mechanic/tasks">Просмотреть</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              В работе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.inProgressTasks}</div>
            <p className="text-muted-foreground text-sm">
              Заданий в процессе
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/mechanic/tasks">Просмотреть</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckSquare className="mr-2 h-4 w-4 text-primary" />
              Выполнено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.completedTasks}</div>
            <p className="text-muted-foreground text-sm">
              Завершенных заданий
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/mechanic/completed">История</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Следующее задание</h2>
        {nextTask ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-2">Заказ #{nextTask.order_number}</h3>
                  <p className="text-muted-foreground mb-4">
                    {nextTask.appointments?.vehicles?.make} {nextTask.appointments?.vehicles?.model} ({nextTask.appointments?.vehicles?.year})
                  </p>
                  <div className="flex items-center mb-4">
                    <Calendar className="h-4 w-4 text-primary mr-2" />
                    <span>{nextTask.appointments?.appointment_date && formatDate(nextTask.appointments.appointment_date)}</span>
                    <span className="mx-2">•</span>
                    <span>{nextTask.appointments?.start_time}</span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    nextTask.status === 'created' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {nextTask.status === 'created' ? 'Ожидает начала' : 'В работе'}
                  </span>
                </div>
                <div className="mt-4 md:mt-0">
                  <Button asChild>
                    <Link to={`/mechanic/tasks/${nextTask.id}`}>
                      {nextTask.status === 'created' ? 'Начать работу' : 'Продолжить работу'}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <div className="mb-4 text-muted-foreground">
                <CheckSquare className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg">У вас нет назначенных заданий</p>
                <p className="mt-2">Новые задания будут отображаться здесь</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MechanicHome;

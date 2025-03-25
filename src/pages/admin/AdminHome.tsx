import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, ClipboardList, Wrench, BarChart3 } from "lucide-react";

const AdminHome = () => {
  const [stats, setStats] = useState({
    clients: 0,
    appointments: 0,
    workOrders: 0,
    mechanics: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Получаем количество клиентов
        const { count: clientsCount, error: clientsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'client');

        // Получаем количество записей
        const { count: appointmentsCount, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true });

        // Получаем количество заказ-нарядов
        const { count: workOrdersCount, error: workOrdersError } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true });

        // Получаем количество механиков
        const { count: mechanicsCount, error: mechanicsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'mechanic');

        setStats({
          clients: clientsCount || 0,
          appointments: appointmentsCount || 0,
          workOrders: workOrdersCount || 0,
          mechanics: mechanicsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Панель администратора</h1>
        <p className="text-muted-foreground">
          Обзор работы автосервиса и ключевые показатели
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4 text-primary" />
              Клиенты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.clients}</div>
            <p className="text-muted-foreground text-sm">
              Зарегистрированных клиентов
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/admin/clients">Подробнее</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              Записи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.appointments}</div>
            <p className="text-muted-foreground text-sm">
              Всего записей на сервис
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/admin/appointments">Подробнее</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ClipboardList className="mr-2 h-4 w-4 text-primary" />
              Заказ-наряды
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.workOrders}</div>
            <p className="text-muted-foreground text-sm">
              Оформленных заказ-нарядов
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/admin/work-orders">Подробнее</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wrench className="mr-2 h-4 w-4 text-primary" />
              Механики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.mechanics}</div>
            <p className="text-muted-foreground text-sm">
              Механиков в системе
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/admin/mechanics">Подробнее</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Записи</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Управление записями клиентов, подтверждение и отмена записей
                </p>
                <Button asChild>
                  <Link to="/admin/appointments">Управлять записями</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Заказ-наряды</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Создание и редактирование заказ-нарядов, назначение механиков
                </p>
                <Button asChild>
                  <Link to="/admin/work-orders">Управлять заказ-нарядами</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Статистика</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Отчеты и статистика по работе автосервиса, аналитика
                </p>
                <Button asChild>
                  <Link to="/admin/reports">Просмотреть отчеты</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;

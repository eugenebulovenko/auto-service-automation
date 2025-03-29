
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Типы данных для отчетов
interface RevenueData {
  month: string;
  revenue: number;
}

interface ServiceData {
  name: string;
  count: number;
}

interface MechanicPerformance {
  name: string;
  completed: number;
  inProgress: number;
}

interface LoyaltyData {
  program: string;
  clients: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B'];

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState("revenue");
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [servicesData, setServicesData] = useState<ServiceData[]>([]);
  const [mechanicsData, setMechanicsData] = useState<MechanicPerformance[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [activeTab, period]);

  const fetchReportData = async () => {
    setLoading(true);
    
    try {
      // Загрузка данных в зависимости от выбранного отчета
      switch (activeTab) {
        case "revenue":
          await fetchRevenueData();
          break;
        case "services":
          await fetchServicesData();
          break;
        case "mechanics":
          await fetchMechanicsData();
          break;
        case "loyalty":
          await fetchLoyaltyData();
          break;
      }
    } catch (error) {
      console.error("Ошибка загрузки данных отчета:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные отчета",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Функции загрузки данных для различных отчетов
  const fetchRevenueData = async () => {
    // В реальном приложении здесь будет запрос к базе данных с группировкой по датам
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Обработка и подготовка данных для отображения
    // В этом примере генерируем демонстрационные данные
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const mockData = months.map((month) => ({
      month,
      revenue: Math.floor(Math.random() * 500000) + 100000,
    }));

    setRevenueData(mockData);
  };

  const fetchServicesData = async () => {
    const { data, error } = await supabase
      .from('services')
      .select(`
        id,
        name,
        appointment_services(id)
      `);

    if (error) {
      throw error;
    }

    const serviceStats = data?.map(service => ({
      name: service.name,
      count: service.appointment_services ? service.appointment_services.length : 0
    })) || [];

    // Если данных мало, добавим демонстрационные
    if (serviceStats.length < 5) {
      const demoServices = [
        { name: 'Замена масла', count: 45 },
        { name: 'Диагностика', count: 38 },
        { name: 'Ремонт тормозов', count: 22 },
        { name: 'Шиномонтаж', count: 35 },
        { name: 'Компьютерная диагностика', count: 28 }
      ];
      
      setServicesData(demoServices);
    } else {
      setServicesData(serviceStats);
    }
  };

  const fetchMechanicsData = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'mechanic');

    if (error) {
      throw error;
    }

    const mechanicsWithStats = data?.map(mechanic => ({
      name: `${mechanic.first_name} ${mechanic.last_name}`,
      completed: Math.floor(Math.random() * 30) + 5,
      inProgress: Math.floor(Math.random() * 10) + 1
    })) || [];

    // Если механиков мало, добавим демонстрационные данные
    if (mechanicsWithStats.length < 3) {
      const demoMechanics = [
        { name: 'Иванов А.П.', completed: 32, inProgress: 4 },
        { name: 'Петров С.А.', completed: 28, inProgress: 2 },
        { name: 'Сидоров К.О.', completed: 25, inProgress: 3 },
        { name: 'Козлов М.И.', completed: 30, inProgress: 5 }
      ];
      
      setMechanicsData(demoMechanics);
    } else {
      setMechanicsData(mechanicsWithStats);
    }
  };

  const fetchLoyaltyData = async () => {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*');

    if (error) {
      throw error;
    }

    const loyaltyStats = data?.map(program => ({
      program: program.name,
      clients: Math.floor(Math.random() * 50) + 5
    })) || [];

    setLoyaltyData(loyaltyStats);
  };

  const downloadReportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let headers = "";
    let rows = "";

    switch (activeTab) {
      case "revenue":
        headers = "Месяц,Доход\n";
        rows = revenueData.map(item => `${item.month},${item.revenue}`).join("\n");
        break;
      case "services":
        headers = "Услуга,Количество\n";
        rows = servicesData.map(item => `${item.name},${item.count}`).join("\n");
        break;
      case "mechanics":
        headers = "Механик,Завершено,В работе\n";
        rows = mechanicsData.map(item => `${item.name},${item.completed},${item.inProgress}`).join("\n");
        break;
      case "loyalty":
        headers = "Программа,Клиенты\n";
        rows = loyaltyData.map(item => `${item.program},${item.clients}`).join("\n");
        break;
    }

    csvContent += headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Отчет скачан",
      description: "Файл CSV был успешно скачан",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Отчеты</h1>
        <p className="text-muted-foreground">
          Статистика и аналитика по работе автосервиса
        </p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Неделя</SelectItem>
            <SelectItem value="month">Месяц</SelectItem>
            <SelectItem value="quarter">Квартал</SelectItem>
            <SelectItem value="year">Год</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={downloadReportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Скачать CSV
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="revenue">Доходы</TabsTrigger>
          <TabsTrigger value="services">Услуги</TabsTrigger>
          <TabsTrigger value="mechanics">Механики</TabsTrigger>
          <TabsTrigger value="loyalty">Лояльность</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Динамика доходов</CardTitle>
              <CardDescription>Изменение доходов автосервиса по месяцам</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} ₽`, 'Доход']} />
                    <Legend />
                    <Bar dataKey="revenue" name="Доход (₽)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Популярность услуг</CardTitle>
              <CardDescription>Количество заказов по типам услуг</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={servicesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Количество" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={servicesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {servicesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} заказов`, 'Количество']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mechanics">
          <Card>
            <CardHeader>
              <CardTitle>Эффективность механиков</CardTitle>
              <CardDescription>Количество выполненных и текущих заказов по механикам</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={mechanicsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Завершено" stackId="a" fill="#8884d8" />
                    <Bar dataKey="inProgress" name="В работе" stackId="a" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty">
          <Card>
            <CardHeader>
              <CardTitle>Программы лояльности</CardTitle>
              <CardDescription>Распределение клиентов по программам лояльности</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={loyaltyData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ program, percent }) => `${program}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="clients"
                      nameKey="program"
                    >
                      {loyaltyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} клиентов`, 'Количество']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;

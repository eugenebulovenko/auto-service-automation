
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Button, 
  Input, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui";
import { 
  Clock, 
  FileEdit, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  User, 
  X 
} from "lucide-react";

const AdminWorkOrders = () => {
  const { toast } = useToast();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Состояние для формы создания заказ-наряда
  const [newOrderData, setNewOrderData] = useState({
    appointment_id: "",
    mechanic_id: "",
    order_number: `R-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "created",
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchWorkOrders();
    fetchMechanics();
    fetchAppointments();
  }, []);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          appointments(
            *,
            vehicles(make, model, year),
            profiles(first_name, last_name)
          ),
          profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setWorkOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказ-наряды",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMechanics = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mechanic');

      if (error) throw error;
      
      setMechanics(data || []);
    } catch (error) {
      console.error("Error fetching mechanics:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          vehicles(make, model, year),
          profiles(first_name, last_name)
        `)
        .eq('status', 'confirmed')
        .is('work_orders', null);

      if (error) throw error;
      
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, workOrders]);

  const applyFilters = () => {
    let filtered = [...workOrders];
    
    // Применяем фильтр по статусу
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Применяем поиск
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(lowercasedSearch) ||
        (order.appointments?.vehicles?.make + ' ' + order.appointments?.vehicles?.model).toLowerCase().includes(lowercasedSearch) ||
        (order.appointments?.profiles?.first_name + ' ' + order.appointments?.profiles?.last_name).toLowerCase().includes(lowercasedSearch) ||
        (order.profiles?.first_name + ' ' + order.profiles?.last_name).toLowerCase().includes(lowercasedSearch)
      );
    }
    
    setFilteredOrders(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateWorkOrder = async () => {
    try {
      if (!newOrderData.appointment_id) {
        toast({
          title: "Ошибка",
          description: "Выберите запись на сервис",
          variant: "destructive",
        });
        return;
      }
      
      if (!newOrderData.mechanic_id) {
        toast({
          title: "Ошибка",
          description: "Назначьте механика",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('work_orders')
        .insert([
          {
            appointment_id: newOrderData.appointment_id,
            mechanic_id: newOrderData.mechanic_id,
            order_number: newOrderData.order_number,
            status: newOrderData.status,
          }
        ])
        .select();

      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Заказ-наряд успешно создан",
      });
      
      setDialogOpen(false);
      
      // Сбрасываем форму
      setNewOrderData({
        appointment_id: "",
        mechanic_id: "",
        order_number: `R-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "created",
      });
      
      // Обновляем списки
      fetchWorkOrders();
      fetchAppointments();
    } catch (error) {
      console.error("Error creating work order:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ-наряд",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Создан';
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
        <h1 className="text-3xl font-bold mb-2">Заказ-наряды</h1>
        <p className="text-muted-foreground">
          Управление заказ-нарядами и распределение работ
        </p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру, автомобилю или клиенту..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-secondary" : ""}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Создать заказ-наряд
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Создать заказ-наряд</DialogTitle>
              <DialogDescription>
                Выберите запись на сервис и назначьте механика
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Запись на сервис</label>
                <Select 
                  value={newOrderData.appointment_id} 
                  onValueChange={(value) => handleSelectChange("appointment_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите запись на сервис" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {appointment.vehicles?.make} {appointment.vehicles?.model} - 
                        {formatDate(appointment.appointment_date)} - 
                        {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Механик</label>
                <Select 
                  value={newOrderData.mechanic_id} 
                  onValueChange={(value) => handleSelectChange("mechanic_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Назначьте механика" />
                  </SelectTrigger>
                  <SelectContent>
                    {mechanics.map((mechanic) => (
                      <SelectItem key={mechanic.id} value={mechanic.id}>
                        {mechanic.first_name} {mechanic.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Номер заказа</label>
                <Input
                  name="order_number"
                  value={newOrderData.order_number}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateWorkOrder}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Фильтры</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
              >
                Сбросить
              </Button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium block mb-2">Статус</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="created">Создан</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="completed">Завершен</SelectItem>
                    <SelectItem value="cancelled">Отменен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
          <TabsTrigger value="all">Все</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          <WorkOrdersList 
            orders={filteredOrders.filter(order => ['created', 'in_progress'].includes(order.status))} 
            loading={loading} 
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            formatDate={formatDate}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <WorkOrdersList 
            orders={filteredOrders.filter(order => ['completed', 'cancelled'].includes(order.status))} 
            loading={loading}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            formatDate={formatDate}
          />
        </TabsContent>
        
        <TabsContent value="all" className="mt-0">
          <WorkOrdersList 
            orders={filteredOrders} 
            loading={loading}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface WorkOrdersListProps {
  orders: any[];
  loading: boolean;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatDate: (date: string) => string;
}

const WorkOrdersList = ({ 
  orders, 
  loading, 
  getStatusColor, 
  getStatusText,
  formatDate
}: WorkOrdersListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка заказ-нарядов...</p>
        </div>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <X className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-lg font-medium">Заказ-наряды не найдены</p>
          </div>
          <p className="text-muted-foreground">
            Попробуйте изменить параметры поиска или создайте новый заказ-наряд
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold">Заказ #{order.order_number}</h3>
                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    {order.appointments?.vehicles?.make} {order.appointments?.vehicles?.model} ({order.appointments?.vehicles?.year})
                  </p>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-primary mr-2" />
                      <span>Клиент: {order.appointments?.profiles?.first_name} {order.appointments?.profiles?.last_name}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-primary mr-2" />
                      <span>Механик: {order.profiles?.first_name} {order.profiles?.last_name}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-primary mr-2" />
                      <span>Дата: {order.appointments?.appointment_date && formatDate(order.appointments.appointment_date)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button variant="outline" size="sm">
                    <FileEdit className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                  <Button size="sm">
                    Подробнее
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminWorkOrders;

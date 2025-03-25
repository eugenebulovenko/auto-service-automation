import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Car, Wrench, Settings, AlertTriangle, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const upcomingAppointments = [
    {
      id: "a1",
      date: "15 октября, 2023",
      time: "10:00",
      service: "Плановое ТО",
      vehicle: "Toyota Camry (2019)",
      status: "Подтверждено",
    },
    {
      id: "a2",
      date: "23 октября, 2023",
      time: "14:30",
      service: "Замена тормозных колодок",
      vehicle: "Toyota Camry (2019)",
      status: "Ожидает подтверждения",
    },
  ];
  
  const vehicleHistory = [
    {
      id: "h1",
      date: "12 июля, 2023",
      service: "Замена масла и фильтров",
      cost: "4,500 ₽",
      status: "Выполнено",
    },
    {
      id: "h2",
      date: "15 апреля, 2023",
      service: "Диагностика ходовой части",
      cost: "2,800 ₽",
      status: "Выполнено",
    },
    {
      id: "h3",
      date: "20 января, 2023",
      service: "Замена аккумулятора",
      cost: "8,500 ₽",
      status: "Выполнено",
    },
  ];
  
  const activeOrders = [
    {
      id: "o1",
      orderNumber: "R-2023-0542",
      date: "15 октября, 2023",
      service: "Плановое ТО",
      status: "В работе",
      progress: 60,
    },
  ];
  
  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Личный кабинет</h1>
              <p className="text-foreground/70">
                Добро пожаловать, Иван! Управляйте своими записями и автомобилями
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button className="w-full md:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                Записаться на сервис
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid grid-cols-4 w-full max-w-xl">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="appointments">Записи</TabsTrigger>
              <TabsTrigger value="vehicles">Автомобили</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="animate-fade-in">
              <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-primary" />
                      Ближайшая запись
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingAppointments.length > 0 ? (
                      <div>
                        <p className="text-2xl font-bold">{upcomingAppointments[0].date}</p>
                        <p className="text-muted-foreground">{upcomingAppointments[0].time}, {upcomingAppointments[0].service}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Нет предстоящих записей</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Car className="mr-2 h-4 w-4 text-primary" />
                      Автомобили
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-muted-foreground">Toyota Camry (2019)</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Wrench className="mr-2 h-4 w-4 text-primary" />
                      Активные заказы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{activeOrders.length}</p>
                    <p className="text-muted-foreground">Заказов в работе</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Предстоящие записи</span>
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        Все записи
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                          <div key={appointment.id} className="flex justify-between border-b pb-3 last:border-0">
                            <div>
                              <p className="font-medium">{appointment.date}, {appointment.time}</p>
                              <p className="text-sm text-muted-foreground">{appointment.service}</p>
                              <p className="text-xs text-muted-foreground mt-1">{appointment.vehicle}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                appointment.status === "Подтверждено" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">У вас пока нет предстоящих записей</p>
                        <Button variant="outline" size="sm" className="mt-4">
                          Записаться
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Активные заказы</span>
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        Все заказы
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeOrders.length > 0 ? (
                      <div className="space-y-4">
                        {activeOrders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-4">
                            <div className="flex justify-between mb-2">
                              <div>
                                <p className="font-medium">{order.orderNumber}</p>
                                <p className="text-sm text-muted-foreground">{order.service}</p>
                              </div>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {order.status}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${order.progress}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Прогресс: {order.progress}%</span>
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                  Подробнее
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">У вас нет активных заказов</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="appointments" className="animate-fade-in">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Управление записями</h3>
                    <p className="text-muted-foreground mb-4">
                      Этот раздел находится в разработке
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="vehicles" className="animate-fade-in">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Управление автомобилями</h3>
                    <p className="text-muted-foreground mb-4">
                      Этот раздел находится в разработке
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>История обслуживания</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {vehicleHistory.map((item) => (
                      <div key={item.id} className="flex items-start border-b last:border-0 pb-4 last:pb-0">
                        <div className="mr-4 mt-1">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <h4 className="font-medium">{item.service}</h4>
                            <span className="font-medium">{item.cost}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.date}</span>
                            <span className="text-green-600">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Рекомендуемые услуги</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Замена масла и фильтров",
                  description: "Рекомендуется каждые 10,000 км",
                  icon: AlertTriangle,
                  priority: "Высокий",
                },
                {
                  title: "Проверка тормозной системы",
                  description: "Последняя проверка: 6 месяцев назад",
                  icon: AlertTriangle,
                  priority: "Средний",
                },
                {
                  title: "Сезонная смена шин",
                  description: "Рекомендуется до наступления холодов",
                  icon: AlertTriangle,
                  priority: "Низкий",
                },
              ].map((recommendation, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className={`h-1 ${
                    recommendation.priority === "Высокий" ? "bg-red-500" :
                    recommendation.priority === "Средний" ? "bg-orange-500" :
                    "bg-blue-500"
                  }`}></div>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 rounded-full p-2 ${
                        recommendation.priority === "Высокий" ? "bg-red-100 text-red-600" :
                        recommendation.priority === "Средний" ? "bg-orange-100 text-orange-600" :
                        "bg-blue-100 text-blue-600"
                      }`}>
                        <recommendation.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">{recommendation.title}</h4>
                        <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                        <Button variant="link" className="text-sm px-0 h-auto mt-2">
                          Записаться
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

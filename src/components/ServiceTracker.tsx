import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Wrench, CarFront, AlertTriangle, Camera } from "lucide-react";

interface RepairStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  time?: string;
  icon: React.ComponentType<any>;
}

interface RepairDetail {
  orderNumber: string;
  vehicle: string;
  startDate: string;
  estimatedCompletion: string;
  currentStatus: string;
  progressPercentage: number;
  steps: RepairStep[];
}

const mockRepairDetails: RepairDetail = {
  orderNumber: "R-2023-0542",
  vehicle: "Toyota Camry (2019)",
  startDate: "15.10.2023",
  estimatedCompletion: "17.10.2023",
  currentStatus: "В работе",
  progressPercentage: 60,
  steps: [
    {
      id: "step1",
      title: "Приемка автомобиля",
      description: "Автомобиль принят на обслуживание, произведен первичный осмотр",
      status: "completed",
      time: "15.10.2023, 10:30",
      icon: CarFront
    },
    {
      id: "step2",
      title: "Диагностика",
      description: "Проведена полная диагностика систем автомобиля, обнаружены неисправности",
      status: "completed",
      time: "15.10.2023, 14:15",
      icon: AlertTriangle
    },
    {
      id: "step3",
      title: "Ремонтные работы",
      description: "Выполняется замена тормозных колодок и ротора, регулировка развал-схождения",
      status: "in-progress",
      time: "16.10.2023, 09:45",
      icon: Wrench
    },
    {
      id: "step4",
      title: "Проверка качества",
      description: "Финальная проверка всех выполненных работ",
      status: "pending",
      icon: CheckCircle2
    },
    {
      id: "step5",
      title: "Выдача автомобиля",
      description: "Автомобиль готов к выдаче клиенту",
      status: "pending",
      icon: Clock
    }
  ]
};

const ServiceTracker = () => {
  const [repairDetails] = useState<RepairDetail>(mockRepairDetails);
  
  return (
    <div className="animate-fade-in">
      <div className="glass rounded-xl p-6 mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Заказ №</p>
            <p className="font-medium">{repairDetails.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Автомобиль</p>
            <p className="font-medium">{repairDetails.vehicle}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Дата приема</p>
            <p className="font-medium">{repairDetails.startDate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ожидаемая дата готовности</p>
            <p className="font-medium">{repairDetails.estimatedCompletion}</p>
          </div>
        </div>
        
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">Статус: {repairDetails.currentStatus}</h3>
          <span className="text-sm text-muted-foreground">{repairDetails.progressPercentage}%</span>
        </div>
        <Progress value={repairDetails.progressPercentage} className="h-2" />
      </div>
      
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-8">
          <TabsTrigger value="timeline">Таймлайн</TabsTrigger>
          <TabsTrigger value="photos">Фотоотчет</TabsTrigger>
          <TabsTrigger value="details">Детали заказа</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-0">
          <div className="space-y-4">
            {repairDetails.steps.map((step, index) => (
              <div 
                key={step.id}
                className={`relative ${
                  index < repairDetails.steps.length - 1 ? "pb-8" : ""
                }`}
              >
                {index < repairDetails.steps.length - 1 && (
                  <div 
                    className={`absolute left-6 top-8 bottom-0 w-0.5 ${
                      step.status === "completed" ? "bg-primary" :
                      step.status === "in-progress" ? "bg-gradient-to-b from-primary to-muted" :
                      "bg-muted"
                    }`}
                  ></div>
                )}
                
                <Card className={`${
                  step.status === "completed" ? "border-primary/30 bg-primary/5" :
                  step.status === "in-progress" ? "border-primary/10 bg-background" :
                  "border-muted bg-background/50"
                }`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 rounded-full p-2 ${
                        step.status === "completed" ? "bg-primary text-white" :
                        step.status === "in-progress" ? "bg-primary/20 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h4 className="font-medium">{step.title}</h4>
                          {step.time && (
                            <span className="text-xs text-muted-foreground">
                              {step.time}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="photos" className="mt-0">
          <div className="glass rounded-lg p-6">
            <div className="flex items-center justify-center py-12 flex-col gap-3">
              <Camera className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="font-medium text-lg">Фотоотчет о работах</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Здесь будут отображаться фотографии, сделанные мастером в процессе работы с вашим автомобилем
              </p>
              <Button variant="outline" size="sm">
                Запросить фотографии
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="mt-0">
          <div className="glass rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Список работ</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span>Диагностика ходовой части</span>
                    <span className="font-medium">1 500 ₽</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span>Замена тормозных колодок (передние)</span>
                    <span className="font-medium">2 800 ₽</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span>Замена тормозных дисков (передние)</span>
                    <span className="font-medium">3 200 ₽</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span>Регулировка развал-схождения</span>
                    <span className="font-medium">3 500 ₽</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Запчасти</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span>Тормозные колодки передние (TRW)</span>
                    <span className="font-medium">4 200 ₽</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span>Тормозные диски передние (Brembo)</span>
                    <span className="font-medium">8 600 ₽</span>
                  </li>
                </ul>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Итого:</span>
                  <span className="font-bold">23 800 ₽</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceTracker;

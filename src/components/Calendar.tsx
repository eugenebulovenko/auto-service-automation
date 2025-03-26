import { useState, useEffect } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  Clock, 
  Calendar as CalendarIcon, 
  CarFront, 
  Wrench 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

const services = [
  { id: "s1", name: "Замена масла", duration: 30, price: 1200 },
  { id: "s2", name: "Диагностика ходовой", duration: 60, price: 1500 },
  { id: "s3", name: "Замена тормозных колодок", duration: 90, price: 2800 },
  { id: "s4", name: "Развал-схождение", duration: 60, price: 3500 },
  { id: "s5", name: "Компьютерная диагностика", duration: 45, price: 1800 },
  { id: "s6", name: "Замена фильтров", duration: 40, price: 1500 },
];

type Step = "date" | "time" | "service" | "info" | "confirm";

const BookingCalendar = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>("date");
  const [carInfo, setCarInfo] = useState({
    make: "",
    model: "",
    year: "",
    vin: ""
  });

  // Get service ID from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get('service');
    if (serviceId) {
      setSelectedServices([serviceId]);
      // If service is pre-selected, start from time selection
      setCurrentStep("date");
    }
  }, []);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCarInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCarInfo(prev => ({ ...prev, [name]: value }));
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((total, id) => {
      const service = services.find(s => s.id === id);
      return total + (service?.duration || 0);
    }, 0);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, id) => {
      const service = services.find(s => s.id === id);
      return total + (service?.price || 0);
    }, 0);
  };

  const handleNextStep = () => {
    if (currentStep === "date" && !date) {
      toast({
        title: "Выберите дату",
        description: "Пожалуйста, выберите дату для записи",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === "time" && !time) {
      toast({
        title: "Выберите время",
        description: "Пожалуйста, выберите удобное время",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === "service" && selectedServices.length === 0) {
      toast({
        title: "Выберите услуги",
        description: "Пожалуйста, выберите хотя бы одну услугу",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === "info") {
      if (!carInfo.make || !carInfo.model || !carInfo.year) {
        toast({
          title: "Заполните информацию",
          description: "Пожалуйста, укажите марку, модель и год выпуска автомобиля",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep === "date") setCurrentStep("time");
    else if (currentStep === "time") setCurrentStep("service");
    else if (currentStep === "service") setCurrentStep("info");
    else if (currentStep === "info") setCurrentStep("confirm");
    else if (currentStep === "confirm") {
      // Submit booking
      toast({
        title: "Запись создана!",
        description: `Вы успешно записаны на ${date?.toLocaleDateString('ru-RU')} в ${time}`,
      });
      
      // Reset form
      setDate(undefined);
      setTime(null);
      setSelectedServices([]);
      setCurrentStep("date");
      setCarInfo({ make: "", model: "", year: "", vin: "" });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "time") setCurrentStep("date");
    else if (currentStep === "service") setCurrentStep("time");
    else if (currentStep === "info") setCurrentStep("service");
    else if (currentStep === "confirm") setCurrentStep("info");
  };

  const isDisabledDate = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable weekends
    const day = date.getDay();
    const isSunday = day === 0;
    
    return date < today || isSunday;
  };

  const handleSubmitBooking = async () => {
    try {
      if (!date || !time || selectedServices.length === 0) {
        toast({
          title: "Недостаточно данных",
          description: "Пожалуйста, заполните все необходимые поля",
          variant: "destructive",
        });
        return;
      }

      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Требуется авторизация",
          description: "Пожалуйста, войдите в систему чтобы записаться на сервис",
          variant: "destructive",
        });
        return;
      }

      // First create or get vehicle for this user
      let vehicleId: string;
      
      // Check if vehicle exists
      const { data: existingVehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('user_id', user.id)
        .eq('make', carInfo.make)
        .eq('model', carInfo.model)
        .eq('year', carInfo.year)
        .maybeSingle();

      if (existingVehicles?.id) {
        vehicleId = existingVehicles.id;
      } else {
        // Create new vehicle
        const { data: newVehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            user_id: user.id,
            make: carInfo.make,
            model: carInfo.model,
            year: parseInt(carInfo.year),
            vin: carInfo.vin || null
          })
          .select('id')
          .single();

        if (vehicleError) throw vehicleError;
        vehicleId = newVehicle.id;
      }

      // Calculate total price
      const totalPrice = getTotalPrice();

      // Create appointment
      const appointmentDate = new Date(date);
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          appointment_date: appointmentDate.toISOString().split('T')[0],
          start_time: time,
          end_time: calculateEndTime(time, getTotalDuration()),
          total_price: totalPrice,
          status: 'pending'
        })
        .select('id')
        .single();

      if (appointmentError) throw appointmentError;

      // Create appointment services
      const appointmentServices = selectedServices.map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        return {
          appointment_id: appointment.id,
          service_id: serviceId,
          price: service?.price || 0
        };
      });

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices);

      if (servicesError) throw servicesError;

      // Show success message
      toast({
        title: "Запись создана!",
        description: `Вы успешно записаны на ${appointmentDate.toLocaleDateString('ru-RU')} в ${time}`,
      });
      
      // Reset form
      setDate(undefined);
      setTime(null);
      setSelectedServices([]);
      setCurrentStep("date");
      setCarInfo({ make: "", model: "", year: "", vin: "" });
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Ошибка при создании записи",
        description: "Не удалось создать запись. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "date":
        return (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Выберите дату</h3>
            <div className="rounded-lg overflow-hidden bg-white shadow">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={isDisabledDate}
                className="rounded-lg border-0"
              />
            </div>
          </div>
        );
        
      case "time":
        return (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">
              Выберите время - {date?.toLocaleDateString('ru-RU')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={time === slot ? "default" : "outline"}
                  onClick={() => setTime(slot)}
                  className="h-12"
                >
                  {slot}
                </Button>
              ))}
            </div>
          </div>
        );
        
      case "service":
        return (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Выберите услуги</h3>
            <div className="space-y-3 mb-4">
              {services.map((service) => (
                <Card 
                  key={service.id} 
                  className={`cursor-pointer transition-all hover:border-primary/60 ${
                    selectedServices.includes(service.id) 
                      ? "border-primary/80 bg-primary/5" 
                      : ""
                  }`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{service.duration} мин.</span>
                      </div>
                    </div>
                    <span className="font-medium">{service.price} ₽</span>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedServices.length > 0 && (
              <div className="glass p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Общая длительность:</span>
                  <span className="text-sm">{getTotalDuration()} мин.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Предварительная стоимость:</span>
                  <span className="font-medium">{getTotalPrice()} ₽</span>
                </div>
              </div>
            )}
          </div>
        );
        
      case "info":
        return (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Информация об автомобиле</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Марка автомобиля</label>
                <input
                  type="text"
                  name="make"
                  value={carInfo.make}
                  onChange={handleCarInfoChange}
                  placeholder="Например: Toyota"
                  className="w-full p-2.5 rounded-md border border-input bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Модель</label>
                <input
                  type="text"
                  name="model"
                  value={carInfo.model}
                  onChange={handleCarInfoChange}
                  placeholder="Например: Camry"
                  className="w-full p-2.5 rounded-md border border-input bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Год выпуска</label>
                <input
                  type="text"
                  name="year"
                  value={carInfo.year}
                  onChange={handleCarInfoChange}
                  placeholder="Например: 2020"
                  className="w-full p-2.5 rounded-md border border-input bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">VIN номер (опционально)</label>
                <input
                  type="text"
                  name="vin"
                  value={carInfo.vin}
                  onChange={handleCarInfoChange}
                  placeholder="VIN номер автомобиля"
                  className="w-full p-2.5 rounded-md border border-input bg-background"
                />
              </div>
            </div>
          </div>
        );
        
      case "confirm":
        return (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Подтверждение записи</h3>
            <div className="glass rounded-lg p-4 mb-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Дата:</span>
                  <span className="font-medium">{date?.toLocaleDateString('ru-RU')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Время:</span>
                  <span className="font-medium">{time}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CarFront className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Автомобиль:</span>
                  <span className="font-medium">{carInfo.make} {carInfo.model} ({carInfo.year})</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Выбранные услуги:
              </h4>
              
              {selectedServices.map((serviceId) => {
                const service = services.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} className="flex justify-between text-sm">
                    <span>{service?.name}</span>
                    <span className="font-medium">{service?.price} ₽</span>
                  </div>
                );
              })}
              
              <div className="pt-3 mt-3 border-t border-border">
                <div className="flex justify-between">
                  <span className="font-medium">Итого:</span>
                  <span className="font-bold">{getTotalPrice()} ₽</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Общая длительность: {getTotalDuration()} мин.</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl glass p-6">
      <div className="mb-8">
        {renderStepContent()}
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === "date"}
        >
          Назад
        </Button>
        
        <Button 
          onClick={currentStep === "confirm" ? handleSubmitBooking : handleNextStep}
          className="flex items-center gap-2"
        >
          {currentStep === "confirm" ? "Записаться" : "Далее"}
          {currentStep !== "confirm" && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default BookingCalendar;

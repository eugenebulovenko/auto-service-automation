
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookingStep, CarInfo } from "@/types/booking";
import { calculateEndTime, getTotalDuration, getTotalPrice } from "@/utils/bookingUtils";
import { services } from "@/data/services";

// Import Step Components
import DateSelection from "@/components/booking/DateSelection";
import TimeSelection from "@/components/booking/TimeSelection";
import ServiceSelection from "@/components/booking/ServiceSelection";
import CarInfoForm from "@/components/booking/CarInfoForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";

const BookingCalendar = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<BookingStep>("date");
  const [carInfo, setCarInfo] = useState<CarInfo>({
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
      handleSubmitBooking();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "time") setCurrentStep("date");
    else if (currentStep === "service") setCurrentStep("time");
    else if (currentStep === "info") setCurrentStep("service");
    else if (currentStep === "confirm") setCurrentStep("info");
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
      const totalPrice = getTotalPrice(selectedServices, services);

      // Create appointment
      const appointmentDate = new Date(date);
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          appointment_date: appointmentDate.toISOString().split('T')[0],
          start_time: time,
          end_time: calculateEndTime(time, getTotalDuration(selectedServices, services)),
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

  const renderStepContent = () => {
    switch (currentStep) {
      case "date":
        return <DateSelection date={date} setDate={setDate} />;
      case "time":
        return <TimeSelection date={date} time={time} setTime={setTime} />;
      case "service":
        return (
          <ServiceSelection 
            services={services} 
            selectedServices={selectedServices} 
            handleServiceToggle={handleServiceToggle} 
          />
        );
      case "info":
        return <CarInfoForm carInfo={carInfo} handleCarInfoChange={handleCarInfoChange} />;
      case "confirm":
        return (
          <BookingConfirmation 
            date={date} 
            time={time} 
            carInfo={carInfo} 
            selectedServices={selectedServices} 
            services={services} 
          />
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
          onClick={handleNextStep}
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

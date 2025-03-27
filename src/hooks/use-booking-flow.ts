
import { useState } from "react";
import { BookingStep, CarInfo } from "@/types/booking";

interface UseBookingFlowProps {
  currentStep: BookingStep;
  setCurrentStep: (step: BookingStep) => void;
  date: Date | undefined;
  time: string | null;
  selectedServices: string[];
  carInfo: CarInfo;
  toast: any;
  handleSubmitBooking: () => void;
}

export function useBookingFlow({
  currentStep,
  setCurrentStep,
  date,
  time,
  selectedServices,
  carInfo,
  toast,
  handleSubmitBooking
}: UseBookingFlowProps) {
  
  const validateCurrentStep = (): boolean => {
    if (currentStep === "date" && !date) {
      toast({
        title: "Выберите дату",
        description: "Пожалуйста, выберите дату для записи",
        variant: "destructive",
      });
      return false;
    }
    
    if (currentStep === "time" && !time) {
      toast({
        title: "Выберите время",
        description: "Пожалуйста, выберите удобное время",
        variant: "destructive",
      });
      return false;
    }
    
    if (currentStep === "service" && selectedServices.length === 0) {
      toast({
        title: "Выберите услуги",
        description: "Пожалуйста, выберите хотя бы одну услугу",
        variant: "destructive",
      });
      return false;
    }
    
    if (currentStep === "info") {
      if (!carInfo.make || !carInfo.model || !carInfo.year) {
        toast({
          title: "Заполните информацию",
          description: "Пожалуйста, укажите марку, модель и год выпуска автомобиля",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      return;
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

  return {
    handleNextStep,
    handlePreviousStep,
    validateCurrentStep
  };
}

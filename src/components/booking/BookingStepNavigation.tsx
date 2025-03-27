
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { BookingStep } from "@/types/booking";

interface BookingStepNavigationProps {
  currentStep: BookingStep;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
}

const BookingStepNavigation = ({
  currentStep,
  handlePreviousStep,
  handleNextStep
}: BookingStepNavigationProps) => {
  return (
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
  );
};

export default BookingStepNavigation;

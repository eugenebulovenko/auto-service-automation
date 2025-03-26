
import { CarInfo } from "@/types/booking";

interface CarInfoFormProps {
  carInfo: CarInfo;
  handleCarInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CarInfoForm = ({ carInfo, handleCarInfoChange }: CarInfoFormProps) => {
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
};

export default CarInfoForm;

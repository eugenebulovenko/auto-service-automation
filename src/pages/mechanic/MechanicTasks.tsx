
import { useState } from "react";

interface MechanicTasksProps {
  completed?: boolean;
}

const MechanicTasks = ({ completed = false }: MechanicTasksProps) => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {completed ? "Выполненные задания" : "Текущие задания"}
        </h1>
        <p className="text-muted-foreground">
          {completed 
            ? "История выполненных работ" 
            : "Список назначенных вам заданий"
          }
        </p>
      </div>
      
      <div className="text-center py-20">
        <p className="text-muted-foreground">Компонент в разработке</p>
      </div>
    </div>
  );
};

export default MechanicTasks;

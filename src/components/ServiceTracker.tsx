import { FC } from "react";

interface ServiceTrackerProps {
  workOrder: any;
}

const ServiceTracker: FC<ServiceTrackerProps> = ({ workOrder }) => {
  if (!workOrder) {
    return <div className="text-center py-6">Информация о заказе не найдена.</div>;
  }
  
  const { 
    order_number,
    created_at,
    description,
    total_cost,
    appointments,
    profiles,
    order_status_updates
  } = workOrder;
  
  const lastStatus = order_status_updates && order_status_updates.length > 0
    ? order_status_updates[order_status_updates.length - 1]
    : null;
  
  return (
    <div className="glass rounded-xl p-8">
      <h2 className="text-xl font-semibold mb-4">Информация о заказе № {order_number}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-muted-foreground">Дата создания: {new Date(created_at).toLocaleDateString()}</p>
          <p className="text-muted-foreground">Описание: {description || "Нет описания"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Общая стоимость: {total_cost} ₽</p>
          {lastStatus && (
            <p className="text-muted-foreground">
              Текущий статус: <span className="font-medium">{lastStatus.status}</span>
            </p>
          )}
        </div>
      </div>
      
      {appointments && appointments.length > 0 ? (
        <>
          <h3 className="text-lg font-semibold mb-3">Запись на обслуживание:</h3>
          {appointments.map((appointment: any) => (
            <div key={appointment.id} className="mb-4 p-4 rounded-md bg-secondary/30">
              <p className="text-sm text-muted-foreground">
                Дата и время: {new Date(appointment.date).toLocaleDateString()} {appointment.time}
              </p>
              {appointment.vehicles && (
                <p className="text-sm text-muted-foreground">
                  Автомобиль: {appointment.vehicles.make} {appointment.vehicles.model} ({appointment.vehicles.year})
                </p>
              )}
              {appointment.profiles && (
                <p className="text-sm text-muted-foreground">
                  Механик: {appointment.profiles.first_name} {appointment.profiles.last_name}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Услуги: {appointment.services}
              </p>
            </div>
          ))}
        </>
      ) : (
        <p className="text-muted-foreground">Нет информации о записи на обслуживание.</p>
      )}
      
      {order_status_updates && order_status_updates.length > 0 ? (
        <>
          <h3 className="text-lg font-semibold mt-6 mb-3">История статусов:</h3>
          <div className="space-y-3">
            {order_status_updates.map((status: any) => (
              <div key={status.id} className="p-3 rounded-md bg-secondary/20">
                <p className="text-sm">
                  Статус: <span className="font-medium">{status.status}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Дата обновления: {new Date(status.created_at).toLocaleTimeString()} {new Date(status.created_at).toLocaleDateString()}
                </p>
                {status.profiles && (
                  <p className="text-xs text-muted-foreground">
                    Обновил: {status.profiles.first_name} {status.profiles.last_name}
                  </p>
                )}
                {status.comment && (
                  <p className="text-xs text-muted-foreground">
                    Комментарий: {status.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground mt-6">Нет истории изменения статусов.</p>
      )}
    </div>
  );
};

export default ServiceTracker;

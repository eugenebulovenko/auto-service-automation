
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, Clock, Car, CheckCircle, ClipboardList, 
  FileText, PlayCircle, Settings, Upload, User 
} from "lucide-react";

const MechanicTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchWorkOrderDetails = async () => {
      setLoading(true);
      try {
        // Получаем информацию о заказ-наряде
        const { data, error } = await supabase
          .from('work_orders')
          .select(`
            *,
            appointments(
              *,
              vehicles(*),
              profiles(first_name, last_name, phone)
            ),
            profiles(first_name, last_name)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setWorkOrder(data);
        
        // Получаем историю обновлений статуса
        const { data: updates, error: updatesError } = await supabase
          .from('order_status_updates')
          .select(`
            *,
            profiles(first_name, last_name)
          `)
          .eq('work_order_id', id)
          .order('created_at', { ascending: false });
        
        if (updatesError) throw updatesError;
        
        setStatusUpdates(updates || []);
      } catch (error) {
        console.error("Error fetching work order details:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить информацию о задании",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrderDetails();
  }, [id, toast]);

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !id) return;
    
    setUpdatingStatus(true);
    try {
      // Обновляем статус заказ-наряда
      const { error: orderError } = await supabase
        .from('work_orders')
        .update({ 
          status: newStatus,
          ...(newStatus === 'in_progress' ? { start_date: new Date().toISOString() } : {}),
          ...(newStatus === 'completed' ? { completion_date: new Date().toISOString() } : {})
        })
        .eq('id', id);
      
      if (orderError) throw orderError;
      
      // Добавляем запись в историю обновлений
      const { error: updateError } = await supabase
        .from('order_status_updates')
        .insert({
          work_order_id: id,
          status: newStatus,
          comment: comment,
          created_by: user.id
        });
      
      if (updateError) throw updateError;
      
      // Обновляем локальное состояние
      setWorkOrder((prev: any) => ({
        ...prev,
        status: newStatus,
        ...(newStatus === 'in_progress' ? { start_date: new Date().toISOString() } : {}),
        ...(newStatus === 'completed' ? { completion_date: new Date().toISOString() } : {})
      }));
      
      // Добавляем новое обновление в историю
      const newUpdate = {
        work_order_id: id,
        status: newStatus,
        comment: comment,
        created_at: new Date().toISOString(),
        created_by: user.id,
        profiles: {
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || ""
        }
      };
      
      setStatusUpdates([newUpdate, ...statusUpdates]);
      setComment("");
      
      toast({
        title: "Статус обновлен",
        description: `Статус заказ-наряда изменен на "${getStatusText(newStatus)}"`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус задания",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !id || !user) return;
    
    setUploading(true);
    try {
      // Получаем расширение файла
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${id}/${Date.now()}.${fileExt}`;
      
      // Загружаем файл в Storage
      const { error: uploadError } = await supabase.storage
        .from('repair_photos')
        .upload(fileName, photoFile);
      
      if (uploadError) throw uploadError;
      
      // Получаем публичную ссылку на файл
      const { data: publicUrl } = supabase.storage
        .from('repair_photos')
        .getPublicUrl(fileName);
      
      if (!publicUrl) throw new Error("Failed to get public URL");
      
      // Добавляем запись в таблицу repair_photos
      const { error: dbError } = await supabase
        .from('repair_photos')
        .insert({
          work_order_id: id,
          photo_url: publicUrl.publicUrl,
          description: photoDescription,
          created_by: user.id
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: "Фото загружено",
        description: "Фотоотчет успешно добавлен к заказ-наряду",
      });
      
      // Сбрасываем значения полей
      setPhotoFile(null);
      setPhotoDescription("");
      
      // Обновляем форму
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фотоотчет",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const fileInputRef = React.createRef<HTMLInputElement>();

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };
    return new Date(dateString).toLocaleString('ru-RU', options);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-[calc(100vh-150px)]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Задание не найдено</h2>
          <p className="text-muted-foreground mb-6">
            Запрашиваемое задание не существует или у вас нет к нему доступа
          </p>
          <Button onClick={() => navigate('/mechanic/tasks')}>
            Вернуться к списку заданий
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Заказ-наряд #{workOrder.order_number}
          </h1>
          <div className="flex items-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(workOrder.status)}`}>
              {getStatusText(workOrder.status)}
            </span>
            {workOrder.status === 'in_progress' && (
              <span className="text-sm text-muted-foreground ml-4">
                Начат: {workOrder.start_date && formatDate(workOrder.start_date)}
              </span>
            )}
            {workOrder.status === 'completed' && (
              <span className="text-sm text-muted-foreground ml-4">
                Завершен: {workOrder.completion_date && formatDate(workOrder.completion_date)}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/mechanic/tasks')}>
          Назад к списку
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              Информация о записи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Дата:</span>
                <span className="font-medium">
                  {workOrder.appointments?.appointment_date && formatDate(workOrder.appointments.appointment_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Время:</span>
                <span className="font-medium">{workOrder.appointments?.start_time}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Клиент:</span>
                <span className="font-medium">
                  {workOrder.appointments?.profiles?.first_name} {workOrder.appointments?.profiles?.last_name}
                </span>
              </div>
              {workOrder.appointments?.profiles?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Телефон:</span>
                  <span className="font-medium">{workOrder.appointments?.profiles?.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Car className="mr-2 h-4 w-4 text-primary" />
              Автомобиль
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Марка:</span>
                <span className="font-medium">{workOrder.appointments?.vehicles?.make}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Модель:</span>
                <span className="font-medium">{workOrder.appointments?.vehicles?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Год:</span>
                <span className="font-medium">{workOrder.appointments?.vehicles?.year}</span>
              </div>
              {workOrder.appointments?.vehicles?.vin && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN:</span>
                  <span className="font-medium">{workOrder.appointments?.vehicles?.vin}</span>
                </div>
              )}
              {workOrder.appointments?.vehicles?.license_plate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Гос. номер:</span>
                  <span className="font-medium">{workOrder.appointments?.vehicles?.license_plate}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Settings className="mr-2 h-4 w-4 text-primary" />
              Работы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип обслуживания:</span>
                <span className="font-medium">Техническое обслуживание</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Статус оплаты:</span>
                <span className="font-medium text-yellow-600">Ожидает оплаты</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Механик:</span>
                <span className="font-medium">
                  {workOrder.profiles?.first_name} {workOrder.profiles?.last_name}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="mr-2 h-5 w-5 text-primary" />
              Список работ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-md">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">Замена масла и фильтров</h4>
                  <span className="text-sm">1,500 ₽</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Замена моторного масла и масляного фильтра
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">Диагностика ходовой части</h4>
                  <span className="text-sm">1,200 ₽</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Проверка состояния подвески, рулевого управления и тормозной системы
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">Замена тормозных колодок</h4>
                  <span className="text-sm">2,800 ₽</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Замена передних тормозных колодок
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center font-medium text-base">
              <span>Итого:</span>
              <span>5,500 ₽</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Запчасти
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-md">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">Масляный фильтр</h4>
                  <span className="text-sm">600 ₽</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Артикул: MF-2023-A</span>
                  <span>1 шт.</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">Моторное масло 5W-30</h4>
                  <span className="text-sm">3,200 ₽</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Артикул: OIL-5W30-4L</span>
                  <span>4 л.</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">Тормозные колодки</h4>
                  <span className="text-sm">2,400 ₽</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Артикул: BP-2023-Toyota</span>
                  <span>1 комплект</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center font-medium text-base">
              <span>Итого за запчасти:</span>
              <span>6,200 ₽</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Upload className="mr-2 h-5 w-5 text-primary" />
              Добавить фотоотчет
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="photo">
                  Фотография
                </label>
                <input
                  ref={fileInputRef}
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm border rounded p-2"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="photoDescription">
                  Описание
                </label>
                <Textarea
                  id="photoDescription"
                  placeholder="Описание фотографии"
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handlePhotoUpload}
                disabled={!photoFile || uploading}
              >
                {uploading ? "Загрузка..." : "Загрузить фото"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-primary" />
              Обновить статус
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="comment">
                  Комментарий
                </label>
                <Textarea
                  id="comment"
                  placeholder="Добавьте комментарий к обновлению статуса"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {workOrder.status === 'created' && (
                  <Button 
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={updatingStatus}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Начать работу
                  </Button>
                )}
                
                {workOrder.status === 'in_progress' && (
                  <Button 
                    onClick={() => handleStatusChange('completed')}
                    disabled={updatingStatus}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Завершить работу
                  </Button>
                )}
                
                {(workOrder.status === 'created' || workOrder.status === 'in_progress') && (
                  <Button 
                    variant="destructive"
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updatingStatus}
                  >
                    Отменить заказ
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            История статусов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusUpdates.length > 0 ? (
            <div className="space-y-4">
              {statusUpdates.map((update, index) => (
                <div key={index} className="border-l-2 border-primary pl-4 ml-2 py-1">
                  <div className="flex items-center mb-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(update.status)}`}>
                      {getStatusText(update.status)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatDateTime(update.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm mb-1">
                    <User className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span>{update.profiles?.first_name} {update.profiles?.last_name}</span>
                  </div>
                  
                  {update.comment && (
                    <p className="text-sm mt-1">{update.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">История обновлений пуста</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MechanicTaskDetails;

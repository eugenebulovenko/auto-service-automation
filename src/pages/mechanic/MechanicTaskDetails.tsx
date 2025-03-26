
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Clock, Car, Wrench, FileText, Upload, UploadCloud, X } from "lucide-react";

interface WorkOrder {
  id: string;
  order_number: string;
  status: string;
  vehicle_id: string;
  mechanic_id: string;
  created_at: string;
  start_date: string | null;
  completion_date: string | null;
  total_cost: number | null;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    vin: string | null;
  };
  services?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[];
  parts?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  status_updates?: {
    id: string;
    status: string;
    comment: string | null;
    created_at: string;
    created_by: string;
  }[];
  photos?: {
    id: string;
    photo_url: string;
    description: string | null;
    created_at: string;
  }[];
}

const statusOptions = [
  { value: "created", label: "Создан" },
  { value: "assigned", label: "Назначен" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting_parts", label: "Ожидание запчастей" },
  { value: "completed", label: "Завершен" },
  { value: "quality_check", label: "Проверка качества" },
  { value: "ready", label: "Готов к выдаче" },
  { value: "delivered", label: "Выдан клиенту" },
];

const MechanicTaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusComment, setStatusComment] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [photoDescription, setPhotoDescription] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [partsNeeded, setPartsNeeded] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    
    const fetchWorkOrder = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("work_orders")
          .select(`
            *,
            vehicle:vehicles(*),
            services:appointment_services(
              services(*)
            ),
            parts:order_parts(
              parts(*),
              quantity,
              price
            ),
            status_updates:order_status_updates(*),
            photos:repair_photos(*)
          `)
          .eq("id", id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Format the data
          const formattedWorkOrder: WorkOrder = {
            ...data,
            services: data.services?.map((item: any) => item.services) || [],
            parts: data.parts?.map((item: any) => ({
              id: item.parts.id,
              name: item.parts.name,
              price: item.price,
              quantity: item.quantity,
            })) || [],
          };
          
          setWorkOrder(formattedWorkOrder);
          setSelectedStatus(formattedWorkOrder.status);
        }
      } catch (error) {
        console.error("Error fetching work order:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные заказ-наряда",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkOrder();
  }, [id, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedFile(file);
  };

  const handleUploadPhoto = async () => {
    if (!uploadedFile || !workOrder || !user) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл для загрузки",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadLoading(true);
      setUploadProgress(0);

      // Create a file path with a unique name
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${workOrder.id}_${Date.now()}.${fileExt}`;
      const filePath = `repair_photos/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('repair_photos')
        .upload(filePath, uploadedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('repair_photos')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) throw new Error("Failed to get public URL");

      // Save the photo record in the database
      const { error: dbError } = await supabase
        .from('repair_photos')
        .insert({
          work_order_id: workOrder.id,
          photo_url: urlData.publicUrl,
          description: photoDescription || null,
          created_by: user.id,
        });

      if (dbError) throw dbError;

      toast({
        title: "Фото загружено",
        description: "Фото успешно добавлено к заказ-наряду",
      });

      // Reset form and refresh data
      setUploadedFile(null);
      setPhotoDescription("");
      
      // Update the local state or refetch the work order
      const { data: newPhotos, error: fetchError } = await supabase
        .from('repair_photos')
        .select('*')
        .eq('work_order_id', workOrder.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      if (newPhotos) {
        setWorkOrder({
          ...workOrder,
          photos: newPhotos,
        });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фото. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !workOrder || !user) return;

    try {
      // Add status update entry
      const { error: statusError } = await supabase
        .from('order_status_updates')
        .insert({
          work_order_id: workOrder.id,
          status: selectedStatus,
          comment: statusComment.trim() || null,
          created_by: user.id,
        });

      if (statusError) throw statusError;

      // Update work order status
      const updateData: any = {
        status: selectedStatus,
      };

      // If status is 'in_progress' and no start date, set start date
      if (selectedStatus === 'in_progress' && !workOrder.start_date) {
        updateData.start_date = new Date().toISOString();
      }

      // If status is 'completed', set completion date
      if (selectedStatus === 'completed' && !workOrder.completion_date) {
        updateData.completion_date = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', workOrder.id);

      if (updateError) throw updateError;

      toast({
        title: "Статус обновлен",
        description: "Статус заказ-наряда успешно обновлен",
      });

      // Update local state
      setWorkOrder({
        ...workOrder,
        status: selectedStatus,
        start_date: updateData.start_date || workOrder.start_date,
        completion_date: updateData.completion_date || workOrder.completion_date,
      });

      // Clear comment
      setStatusComment("");

      // Refresh status updates
      const { data: newUpdates, error: fetchError } = await supabase
        .from('order_status_updates')
        .select('*')
        .eq('work_order_id', workOrder.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      if (newUpdates) {
        setWorkOrder({
          ...workOrder,
          status_updates: newUpdates,
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  const handleRequestParts = async () => {
    if (!partsNeeded.trim() || !workOrder || !user) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, укажите требуемые запчасти",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add status update entry with parts request
      const { error } = await supabase
        .from('order_status_updates')
        .insert({
          work_order_id: workOrder.id,
          status: 'waiting_parts',
          comment: `Требуются запчасти: ${partsNeeded}`,
          created_by: user.id,
        });

      if (error) throw error;

      // Update work order status
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({
          status: 'waiting_parts',
        })
        .eq('id', workOrder.id);

      if (updateError) throw updateError;

      toast({
        title: "Запрос отправлен",
        description: "Запрос на запчасти успешно отправлен",
      });

      // Update local state
      setWorkOrder({
        ...workOrder,
        status: 'waiting_parts',
      });
      setSelectedStatus('waiting_parts');
      setPartsNeeded("");

      // Refresh status updates
      const { data: newUpdates, error: fetchError } = await supabase
        .from('order_status_updates')
        .select('*')
        .eq('work_order_id', workOrder.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      if (newUpdates) {
        setWorkOrder({
          ...workOrder,
          status_updates: newUpdates,
        });
      }
    } catch (error) {
      console.error("Error requesting parts:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить запрос на запчасти. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <h2 className="text-xl font-semibold mb-2">Заказ-наряд не найден</h2>
              <p className="text-muted-foreground mb-4">
                Запрашиваемый заказ-наряд не существует или у вас нет к нему доступа.
              </p>
              <Button onClick={() => navigate('/mechanic/tasks')}>
                Вернуться к списку задач
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Заказ-наряд #{workOrder.order_number}
          </h1>
          <div className="flex items-center mt-2">
            <Badge 
              variant="outline" 
              className={`
                ${workOrder.status === 'completed' || workOrder.status === 'ready' || workOrder.status === 'delivered' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : workOrder.status === 'in_progress' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : workOrder.status === 'waiting_parts'
                      ? 'bg-orange-100 text-orange-800 border-orange-200' 
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                }
              `}
            >
              {statusOptions.find(s => s.value === workOrder.status)?.label || workOrder.status}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/mechanic/tasks')}>
          Назад к списку
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Информация</TabsTrigger>
              <TabsTrigger value="photos" className="flex-1">Фотоотчет</TabsTrigger>
              <TabsTrigger value="status" className="flex-1">Статус работ</TabsTrigger>
              <TabsTrigger value="parts" className="flex-1">Запчасти</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="h-5 w-5 mr-2" /> Информация об автомобиле
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-muted-foreground">Марка:</span>
                      <span className="font-medium">{workOrder.vehicle?.make}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-muted-foreground">Модель:</span>
                      <span className="font-medium">{workOrder.vehicle?.model}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-muted-foreground">Год выпуска:</span>
                      <span className="font-medium">{workOrder.vehicle?.year}</span>
                    </div>
                    {workOrder.vehicle?.vin && (
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-muted-foreground">VIN:</span>
                        <span className="font-medium">{workOrder.vehicle.vin}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="h-5 w-5 mr-2" /> Услуги
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workOrder.services && workOrder.services.length > 0 ? (
                    <div className="space-y-3">
                      {workOrder.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between pb-2 border-b">
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" /> {service.duration} мин.
                            </div>
                          </div>
                          <div className="font-medium">{service.price} ₽</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Нет данных об услугах
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="photos" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="h-5 w-5 mr-2" /> Загрузить фото
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="photoUpload" className="block text-sm font-medium mb-1">
                        Выберите фото
                      </label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('photoUpload')?.click()}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadedFile ? 'Файл выбран' : 'Выбрать файл'}
                        </Button>
                        {uploadedFile && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setUploadedFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <input
                          type="file"
                          id="photoUpload"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                      {uploadedFile && (
                        <p className="text-sm mt-1">
                          {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="photoDescription" className="block text-sm font-medium mb-1">
                        Описание (необязательно)
                      </label>
                      <Textarea
                        id="photoDescription"
                        placeholder="Опишите, что на фото..."
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                      />
                    </div>

                    {uploadLoading && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}

                    <Button
                      onClick={handleUploadPhoto}
                      disabled={!uploadedFile || uploadLoading}
                      className="w-full"
                    >
                      <UploadCloud className="h-4 w-4 mr-2" />
                      {uploadLoading ? `Загрузка... ${uploadProgress}%` : 'Загрузить фото'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Загруженные фото</CardTitle>
                </CardHeader>
                <CardContent>
                  {workOrder.photos && workOrder.photos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {workOrder.photos.map((photo) => (
                        <div key={photo.id} className="border rounded-lg overflow-hidden">
                          <a href={photo.photo_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={photo.photo_url}
                              alt={photo.description || "Фото ремонта"}
                              className="w-full h-48 object-cover"
                            />
                          </a>
                          {photo.description && (
                            <div className="p-3">
                              <p className="text-sm">{photo.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(photo.created_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Пока нет загруженных фото
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="status" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Обновить статус</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium mb-1">
                        Статус
                      </label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="statusComment" className="block text-sm font-medium mb-1">
                        Комментарий (необязательно)
                      </label>
                      <Textarea
                        id="statusComment"
                        placeholder="Введите комментарий..."
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleStatusUpdate}
                      disabled={!selectedStatus || selectedStatus === workOrder.status}
                      className="w-full"
                    >
                      Обновить статус
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>История изменений</CardTitle>
                </CardHeader>
                <CardContent>
                  {workOrder.status_updates && workOrder.status_updates.length > 0 ? (
                    <div className="space-y-4">
                      {workOrder.status_updates.map((update) => (
                        <div key={update.id} className="border rounded-lg p-3">
                          <div className="flex justify-between">
                            <Badge 
                              variant="outline" 
                              className={`
                                ${update.status === 'completed' || update.status === 'ready' || update.status === 'delivered' 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : update.status === 'in_progress' 
                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : update.status === 'waiting_parts'
                                      ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                      : 'bg-gray-100 text-gray-800 border-gray-200'
                                }
                              `}
                            >
                              {statusOptions.find(s => s.value === update.status)?.label || update.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.created_at).toLocaleString()}
                            </span>
                          </div>
                          {update.comment && (
                            <p className="mt-2 text-sm">{update.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Нет истории изменений
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="parts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Запрос запчастей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="partsNeeded" className="block text-sm font-medium mb-1">
                        Требуемые запчасти
                      </label>
                      <Textarea
                        id="partsNeeded"
                        placeholder="Укажите названия, артикулы или описания требуемых запчастей..."
                        value={partsNeeded}
                        onChange={(e) => setPartsNeeded(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleRequestParts}
                      disabled={!partsNeeded.trim()}
                      className="w-full"
                    >
                      Отправить запрос на запчасти
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Запчасти в заказе</CardTitle>
                </CardHeader>
                <CardContent>
                  {workOrder.parts && workOrder.parts.length > 0 ? (
                    <div className="space-y-3">
                      {workOrder.parts.map((part, index) => (
                        <div key={index} className="flex items-center justify-between pb-2 border-b">
                          <div>
                            <div className="font-medium">{part.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Кол-во: {part.quantity} шт.
                            </div>
                          </div>
                          <div className="font-medium">{part.price} ₽</div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 font-semibold">
                        <span>Итого:</span>
                        <span>
                          {workOrder.parts.reduce((sum, part) => sum + part.price * part.quantity, 0)} ₽
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Запчасти не добавлены к заказу
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" /> Детали заказа
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Номер заказа:</span>
                  <span className="font-medium">{workOrder.order_number}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Создан:</span>
                  <span className="font-medium">
                    {new Date(workOrder.created_at).toLocaleDateString()}
                  </span>
                </div>
                {workOrder.start_date && (
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Начат:</span>
                    <span className="font-medium">
                      {new Date(workOrder.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {workOrder.completion_date && (
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Завершен:</span>
                    <span className="font-medium">
                      {new Date(workOrder.completion_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {workOrder.total_cost && (
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Стоимость работ:</span>
                    <span className="font-semibold">{workOrder.total_cost} ₽</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (workOrder.status === "in_progress") {
                      setSelectedStatus("completed");
                      setStatusComment("Работы выполнены в полном объеме");
                    } else if (workOrder.status !== "completed" && workOrder.status !== "ready" && workOrder.status !== "delivered") {
                      setSelectedStatus("in_progress");
                      setStatusComment("Приступаю к работе");
                    } else if (workOrder.status === "completed") {
                      setSelectedStatus("quality_check");
                      setStatusComment("Передаю на проверку качества");
                    }
                  }}
                >
                  {workOrder.status === "in_progress" 
                    ? "Завершить работу" 
                    : workOrder.status !== "completed" && workOrder.status !== "ready" && workOrder.status !== "delivered" 
                      ? "Начать работу"
                      : workOrder.status === "completed"
                        ? "Передать на проверку"
                        : "Управление заказом"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MechanicTaskDetails;

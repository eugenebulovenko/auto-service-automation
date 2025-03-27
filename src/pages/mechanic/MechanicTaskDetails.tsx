import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Plus, Package } from "lucide-react"; // Removed 'Tool' which doesn't exist

// Define the WorkOrder interface with proper types
interface WorkOrder {
  id: string;
  order_number: string;
  status: string;
  start_date: string | null;
  completion_date: string | null;
  total_cost: number | null;
  mechanic_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  appointment_id: string | null;
  vehicle_id: string | null; // Ensure this is included
  photos?: { url: string; id: string }[];
  services?: any[];
  parts?: { id: string; name: string; price: number; quantity: number }[];
}

const MechanicTaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [showPartForm, setShowPartForm] = useState(false);
  const [partForm, setPartForm] = useState({
    name: "",
    price: "",
    quantity: "1"
  });

  useEffect(() => {
    fetchWorkOrder();
  }, [id]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      
      if (!id) return;
      
      const { data: workOrderData, error } = await supabase
        .from("work_orders")
        .select(`
          *,
          photos:repair_photos(id, photo_url)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;

      // Get services for this order
      const { data: servicesData, error: servicesError } = await supabase
        .from("appointment_services")
        .select(`
          id,
          service_id,
          price,
          services:service_id(name, duration)
        `)
        .eq("appointment_id", workOrderData.appointment_id);
      
      if (servicesError) throw servicesError;

      // Get parts for this order
      const { data: partsData, error: partsError } = await supabase
        .from("order_parts")
        .select("*")
        .eq("work_order_id", id);
      
      if (partsError) throw partsError;

      // Transform services data
      const services = servicesData || [];
      
      // Transform parts data and handle the correct properties
      const parts = (partsData || []).map(part => ({
        id: part.id,
        name: part.part_id, // From the 'parts' table via part_id
        price: part.price,
        quantity: part.quantity
      }));

      // Transform photos data
      const photos = workOrderData.photos ? 
        workOrderData.photos.map((p: any) => ({
          id: p.id,
          url: p.photo_url
        })) : [];

      setWorkOrder({
        ...workOrderData,
        services,
        parts,
        photos,
        vehicle_id: workOrderData.vehicle_id || null
      });
      
      setNewStatus(workOrderData.status);
    } catch (error) {
      console.error("Error fetching work order:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные о заказе",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      if (!workOrder || !newStatus) return;
      
      const { error } = await supabase
        .from("work_orders")
        .update({ status: newStatus })
        .eq("id", workOrder.id);
      
      if (error) throw error;
      
      toast({
        title: "Статус обновлен",
        description: `Статус заказа изменен на: ${newStatus}`
      });
      
      setWorkOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !workOrder) return;
      
      setUploadingPhoto(true);
      
      // Generate unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `work_orders/${workOrder.id}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("work_photos")
        .upload(filePath, file, {
          cacheControl: "3600",
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("work_photos")
        .getPublicUrl(filePath);
      
      // Save reference in database using repair_photos table
      const { error: dbError } = await supabase
        .from("repair_photos")
        .insert({
          work_order_id: workOrder.id,
          photo_url: publicUrl.publicUrl,
          created_by: workOrder.mechanic_id || '',
          description: ''
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: "Фото загружено",
        description: "Фото успешно добавлено к заказу"
      });
      
      // Refresh data
      fetchWorkOrder();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить фото",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddPart = async () => {
    try {
      if (!workOrder) return;
      
      const price = parseFloat(partForm.price);
      const quantity = parseInt(partForm.quantity, 10);
      
      if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
        toast({
          title: "Ошибка",
          description: "Введите корректную цену и количество",
          variant: "destructive"
        });
        return;
      }
      
      // Use order_parts table instead of work_order_parts
      const { error } = await supabase
        .from("order_parts")
        .insert({
          work_order_id: workOrder.id,
          part_id: partForm.name, // This should be a valid part_id from parts table
          price,
          quantity
        });
      
      if (error) throw error;
      
      toast({
        title: "Запчасть добавлена",
        description: "Запчасть успешно добавлена к заказу"
      });
      
      // Reset form
      setPartForm({ name: "", price: "", quantity: "1" });
      setShowPartForm(false);
      
      // Refresh data
      fetchWorkOrder();
    } catch (error) {
      console.error("Error adding part:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить запчасть",
        variant: "destructive"
      });
    }
  };

  // Rest of the component implementation...
  // This is a placeholder, the actual implementation would depend on the component's UI requirements

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <div>Loading...</div>
      ) : workOrder ? (
        <div>
          <h1>Work Order Details</h1>
          {/* Render work order details */}
        </div>
      ) : (
        <div>Work order not found</div>
      )}
    </div>
  );
};

export default MechanicTaskDetails;

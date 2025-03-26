import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Copy, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const AdminWorkOrders = () => {
  const { toast } = useToast();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    order_number: "",
    customer_notes: "",
    internal_notes: "",
    is_warranty: false,
  });
  
  const fetchWorkOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          appointments(
            *,
            vehicles(*),
            profiles(first_name, last_name)
          ),
          profiles(first_name, last_name),
          order_status_updates(
            *,
            profiles(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setWorkOrders(data || []);
    } catch (err: any) {
      setError(err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить заказ-наряды",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchWorkOrders();
  }, []);
  
  const filteredWorkOrders = workOrders.filter(order => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(searchTerm) ||
      order.customer_notes?.toLowerCase().includes(searchTerm) ||
      order.internal_notes?.toLowerCase().includes(searchTerm) ||
      order.profiles?.first_name?.toLowerCase().includes(searchTerm) ||
      order.profiles?.last_name?.toLowerCase().includes(searchTerm)
    );
  });
  
  const handleEditClick = (workOrder: any) => {
    setSelectedWorkOrder(workOrder);
    setEditFormData({
      order_number: workOrder.order_number || "",
      customer_notes: workOrder.customer_notes || "",
      internal_notes: workOrder.internal_notes || "",
      is_warranty: workOrder.is_warranty || false,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (workOrder: any) => {
    setSelectedWorkOrder(workOrder);
    setIsDeleteDialogOpen(true);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleEditSubmit = async () => {
    if (!selectedWorkOrder) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          order_number: editFormData.order_number,
          customer_notes: editFormData.customer_notes,
          internal_notes: editFormData.internal_notes,
          is_warranty: editFormData.is_warranty,
        })
        .eq('id', selectedWorkOrder.id);
      
      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Заказ-наряд успешно обновлен",
      });
      
      setIsEditDialogOpen(false);
      fetchWorkOrders();
    } catch (err: any) {
      console.error("Update error:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ-наряд",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedWorkOrder) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', selectedWorkOrder.id);
      
      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Заказ-наряд успешно удален",
      });
      
      setIsDeleteDialogOpen(false);
      fetchWorkOrders();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказ-наряд",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Управление заказ-нарядами</CardTitle>
          <CardDescription>Просмотр, редактирование и удаление заказ-нарядов.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <ScrollArea>
            <Table>
              <TableCaption>Список всех заказ-нарядов в системе.</TableCaption>
              <TableHead>
                <TableRow>
                  <TableHead>Номер заказа</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Загрузка...</TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-destructive">Ошибка: {error.message}</TableCell>
                  </TableRow>
                )}
                {filteredWorkOrders.length === 0 && !loading && !error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Нет данных</TableCell>
                  </TableRow>
                ) : (
                  filteredWorkOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>
                        {order.profiles?.first_name} {order.profiles?.last_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), "dd.MM.yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {order.order_status_updates && order.order_status_updates.length > 0 ? (
                          <Badge variant="secondary">
                            {order.order_status_updates[0].status}
                          </Badge>
                        ) : (
                          <Badge>Новый</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Открыть меню</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(order)}>
                              <Edit className="mr-2 h-4 w-4" /> Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" /> Копировать
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteClick(order)} className="text-red-500">
                              <Trash className="mr-2 h-4 w-4" /> Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать заказ-наряд</DialogTitle>
            <DialogDescription>
              Измените необходимые поля и сохраните.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order_number" className="text-right">
                Номер заказа
              </Label>
              <Input
                id="order_number"
                name="order_number"
                value={editFormData.order_number}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_notes" className="text-right">
                Заметки клиента
              </Label>
              <Textarea
                id="customer_notes"
                name="customer_notes"
                value={editFormData.customer_notes}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="internal_notes" className="text-right">
                Внутренние заметки
              </Label>
              <Textarea
                id="internal_notes"
                name="internal_notes"
                value={editFormData.internal_notes}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_warranty" className="text-right">
                Гарантия
              </Label>
              <Checkbox
                id="is_warranty"
                name="is_warranty"
                checked={editFormData.is_warranty}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, is_warranty: !!checked }))}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleEditSubmit} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Удалить заказ-наряд</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этот заказ-наряд? Это действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>Вы действительно хотите удалить заказ-наряд номер {selectedWorkOrder?.order_number}?</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={loading}>
              {loading ? "Удаление..." : "Удалить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWorkOrders;

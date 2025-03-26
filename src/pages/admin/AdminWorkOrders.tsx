
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Updated interface to match the database schema
interface WorkOrder {
  id: string;
  created_at: string;
  order_number: string;
  status: string;
  total_cost: number | null;
  mechanic_id: string | null;
  appointment_id: string | null;
  start_date: string | null;
  completion_date: string | null;
  updated_at: string | null;
  // Additional fields for UI that aren't in the DB table
  title?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  client_id?: string;
  cost?: number;
  due_date?: string;
  is_warranty?: boolean;
}

const AdminWorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editWorkOrder, setEditWorkOrder] = useState<WorkOrder | null>(null);
  const { toast } = useToast();
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);
  const [mechanics, setMechanics] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);

  // Form state for creating/editing work orders
  const [orderNumber, setOrderNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>("medium");
  const [clientId, setClientId] = useState("");
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [isWarranty, setIsWarranty] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    setIsWarranty(checked);
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchClients();
    fetchMechanics();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching work orders:", error);
        toast({
          title: "Error",
          description: "Failed to fetch work orders.",
          variant: "destructive",
        });
      }

      if (data) {
        setWorkOrders(data);
      }
    } catch (error) {
      console.error("Unexpected error fetching work orders:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching work orders.",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'client');

      if (error) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: "Failed to fetch clients.",
          variant: "destructive",
        });
      }

      if (data) {
        setClients(data as { id: string; first_name: string; last_name: string; }[]);
      }
    } catch (error) {
      console.error("Unexpected error fetching clients:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching clients.",
        variant: "destructive",
      });
    }
  };

  const fetchMechanics = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'mechanic');

      if (error) {
        console.error("Error fetching mechanics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch mechanics.",
          variant: "destructive",
        });
      }

      if (data) {
        setMechanics(data as { id: string; first_name: string; last_name: string; }[]);
      }
    } catch (error) {
      console.error("Unexpected error fetching mechanics:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching mechanics.",
        variant: "destructive",
      });
    }
  };

  const createWorkOrder = async () => {
    try {
      // Generate a simple order number if not provided
      const generatedOrderNumber = orderNumber || `WO-${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase
        .from('work_orders')
        .insert({
          order_number: generatedOrderNumber,
          status: status,
          mechanic_id: mechanicId,
          total_cost: totalCost,
          start_date: startDate || null,
          completion_date: completionDate || null,
        });

      if (error) {
        console.error("Error creating work order:", error);
        toast({
          title: "Error",
          description: "Failed to create work order.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Work order created successfully.",
      });
      setOpen(false);
      fetchWorkOrders();
      clearForm();
    } catch (error) {
      console.error("Unexpected error creating work order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the work order.",
        variant: "destructive",
      });
    }
  };

  const updateWorkOrder = async () => {
    if (!editWorkOrder) return;

    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          order_number: orderNumber,
          status: status,
          mechanic_id: mechanicId,
          total_cost: totalCost,
          start_date: startDate || null,
          completion_date: completionDate || null,
        })
        .eq('id', editWorkOrder.id);

      if (error) {
        console.error("Error updating work order:", error);
        toast({
          title: "Error",
          description: "Failed to update work order.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Work order updated successfully.",
      });
      setEditWorkOrder(null);
      fetchWorkOrders();
      clearForm();
    } catch (error) {
      console.error("Unexpected error updating work order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the work order.",
        variant: "destructive",
      });
    }
  };

  const deleteWorkOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting work order:", error);
        toast({
          title: "Error",
          description: "Failed to delete work order.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Work order deleted successfully.",
      });
      fetchWorkOrders();
    } catch (error) {
      console.error("Unexpected error deleting work order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the work order.",
        variant: "destructive",
      });
    }
  };

  const clearForm = () => {
    setOrderNumber("");
    setTitle("");
    setDescription("");
    setStatus("open");
    setPriority("medium");
    setClientId("");
    setMechanicId(null);
    setTotalCost(0);
    setStartDate("");
    setCompletionDate("");
    setIsWarranty(false);
  };

  const filteredWorkOrders = workOrders.filter((workOrder) =>
    workOrder.order_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEditDialog = (workOrder: WorkOrder) => {
    setEditWorkOrder(workOrder);
    setOrderNumber(workOrder.order_number);
    setStatus(workOrder.status);
    setMechanicId(workOrder.mechanic_id);
    setTotalCost(workOrder.total_cost || 0);
    setStartDate(workOrder.start_date || "");
    setCompletionDate(workOrder.completion_date || "");
    
    // Set UI-only fields if they exist
    setTitle(workOrder.title || "");
    setDescription(workOrder.description || "");
    setPriority(workOrder.priority || "medium");
    setClientId(workOrder.client_id || "");
    setIsWarranty(workOrder.is_warranty || false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Input
          type="text"
          placeholder="Search work orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
              <DialogDescription>
                Add a new work order to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orderNumber" className="text-right">
                  Order Number
                </Label>
                <Input
                  type="text"
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as 'high' | 'medium' | 'low')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Client
                </Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mechanic" className="text-right">
                  Mechanic
                </Label>
                <Select value={mechanicId || ""} onValueChange={(value) => setMechanicId(value === "" ? null : value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a mechanic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {mechanics.map((mechanic) => (
                      <SelectItem key={mechanic.id} value={mechanic.id}>
                        {mechanic.first_name} {mechanic.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="totalCost" className="text-right">
                  Total Cost
                </Label>
                <Input
                  type="number"
                  id="totalCost"
                  value={totalCost}
                  onChange={(e) => setTotalCost(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="completionDate" className="text-right">
                  Completion Date
                </Label>
                <Input
                  type="date"
                  id="completionDate"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isWarranty" className="text-right">
                  Warranty
                </Label>
                <div className="col-span-3">
                  <Checkbox
                    id="isWarranty"
                    checked={isWarranty}
                    onCheckedChange={handleCheckboxChange}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => { setOpen(false); clearForm(); }}>
                Cancel
              </Button>
              <Button type="submit" onClick={createWorkOrder}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableCaption>A list of your work orders.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mechanic</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Completion Date</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredWorkOrders.map((workOrder) => {
            const mechanic = mechanics.find(m => m.id === workOrder.mechanic_id);

            return (
              <TableRow key={workOrder.id}>
                <TableCell>{workOrder.order_number}</TableCell>
                <TableCell>{workOrder.status}</TableCell>
                <TableCell>{mechanic ? `${mechanic.first_name} ${mechanic.last_name}` : "Unassigned"}</TableCell>
                <TableCell>{workOrder.start_date || "Not started"}</TableCell>
                <TableCell>{workOrder.completion_date || "Not completed"}</TableCell>
                <TableCell>${workOrder.total_cost || 0}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenEditDialog(workOrder)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the work order from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteWorkOrder(workOrder.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={7}>
              {filteredWorkOrders.length} work order(s) total
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <Dialog open={!!editWorkOrder} onOpenChange={() => setEditWorkOrder(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Work Order</DialogTitle>
            <DialogDescription>
              Edit the details of the selected work order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="orderNumber" className="text-right">
                Order Number
              </Label>
              <Input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as 'high' | 'medium' | 'low')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Client
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mechanic" className="text-right">
                Mechanic
              </Label>
              <Select value={mechanicId || ""} onValueChange={(value) => setMechanicId(value === "" ? null : value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a mechanic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.first_name} {mechanic.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalCost" className="text-right">
                Total Cost
              </Label>
              <Input
                type="number"
                id="totalCost"
                value={totalCost}
                onChange={(e) => setTotalCost(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="completionDate" className="text-right">
                Completion Date
              </Label>
              <Input
                type="date"
                id="completionDate"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isWarranty" className="text-right">
                Warranty
              </Label>
              <div className="col-span-3">
                <Checkbox
                  id="isWarranty"
                  checked={isWarranty}
                  onCheckedChange={handleCheckboxChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => { setEditWorkOrder(null); clearForm(); }}>
              Cancel
            </Button>
            <Button type="submit" onClick={updateWorkOrder}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWorkOrders;

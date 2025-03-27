
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Gift, Plus, Users, Percent, Edit, Trash } from "lucide-react";

interface LoyaltyProgram {
  id: string;
  name: string;
  discount_percentage: number;
  min_visits: number;
  created_at: string;
}

interface ClientLoyalty {
  id: string;
  user_id: string;
  loyalty_program_id: string;
  active_from: string;
  full_name: string;
  program_name: string;
  discount_percentage: number;
}

const LoyaltyProgram = () => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [clientLoyalties, setClientLoyalties] = useState<ClientLoyalty[]>([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, full_name: string}[]>([]);
  
  const [newProgram, setNewProgram] = useState({
    name: "",
    discount_percentage: 5,
    min_visits: 3
  });
  
  const [newClientLoyalty, setNewClientLoyalty] = useState({
    userId: "",
    programId: ""
  });

  useEffect(() => {
    fetchPrograms();
    fetchClientLoyalties();
    fetchClients();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      // Using the type assertion to work with the new table that isn't in the types yet
      const { data, error } = await supabase
        .from('loyalty_programs' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Type assertion to match our interface
      setPrograms(data as LoyaltyProgram[] || []);
    } catch (error) {
      console.error('Error fetching loyalty programs:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить программы лояльности",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientLoyalties = async () => {
    try {
      // Using type assertion for the new table
      const { data, error } = await supabase
        .from('client_loyalty_programs' as any)
        .select(`
          *,
          profiles(first_name, last_name),
          loyalty_programs(name, discount_percentage)
        `)
        .order('active_from', { ascending: false });
      
      if (error) throw error;
      
      // Transform and type the data correctly
      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        loyalty_program_id: item.loyalty_program_id,
        active_from: item.active_from,
        full_name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`,
        program_name: item.loyalty_programs?.name || '',
        discount_percentage: item.loyalty_programs?.discount_percentage || 0
      }));
      
      setClientLoyalties(formattedData);
    } catch (error) {
      console.error('Error fetching client loyalties:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'client');
      
      if (error) throw error;
      
      const formattedClients = (data || []).map(client => ({
        id: client.id,
        full_name: `${client.first_name} ${client.last_name}`
      }));
      
      setClients(formattedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const createProgram = async () => {
    try {
      if (!newProgram.name) {
        toast({
          title: "Ошибка",
          description: "Укажите название программы",
          variant: "destructive"
        });
        return;
      }
      
      // Type assertion for the new table
      const { data, error } = await supabase
        .from('loyalty_programs' as any)
        .insert({
          name: newProgram.name,
          discount_percentage: newProgram.discount_percentage,
          min_visits: newProgram.min_visits
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Программа создана",
        description: "Новая программа лояльности успешно создана"
      });
      
      // Type assertion to match our interface
      const newProgramData = data as LoyaltyProgram;
      setPrograms([newProgramData, ...programs]);
      setNewProgram({
        name: "",
        discount_percentage: 5,
        min_visits: 3
      });
    } catch (error) {
      console.error('Error creating loyalty program:', error);
      toast({
        title: "Ошибка создания",
        description: "Не удалось создать программу лояльности",
        variant: "destructive"
      });
    }
  };

  const assignClientToProgram = async () => {
    try {
      if (!newClientLoyalty.userId || !newClientLoyalty.programId) {
        toast({
          title: "Ошибка",
          description: "Выберите клиента и программу лояльности",
          variant: "destructive"
        });
        return;
      }
      
      // Type assertion for the new table
      const { data, error } = await supabase
        .from('client_loyalty_programs' as any)
        .insert({
          user_id: newClientLoyalty.userId,
          loyalty_program_id: newClientLoyalty.programId,
          active_from: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Программа назначена",
        description: "Клиент успешно добавлен в программу лояльности"
      });
      
      fetchClientLoyalties();
      setNewClientLoyalty({
        userId: "",
        programId: ""
      });
    } catch (error) {
      console.error('Error assigning client to loyalty program:', error);
      toast({
        title: "Ошибка назначения",
        description: "Не удалось добавить клиента в программу лояльности",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Программы лояльности</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Новая программа
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать программу лояльности</DialogTitle>
              <DialogDescription>
                Добавьте новую программу лояльности для клиентов
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Название программы</Label>
                <Input
                  id="name"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                  placeholder="VIP клиент"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="discount">Скидка (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="1"
                    max="100"
                    value={newProgram.discount_percentage}
                    onChange={(e) => setNewProgram({...newProgram, discount_percentage: parseInt(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="visits">Мин. посещений</Label>
                  <Input
                    id="visits"
                    type="number"
                    min="1"
                    value={newProgram.min_visits}
                    onChange={(e) => setNewProgram({...newProgram, min_visits: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={createProgram}>Создать программу</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-primary" />
              Список программ лояльности
            </CardTitle>
            <CardDescription>
              Управление скидками и бонусами для постоянных клиентов
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : programs.length > 0 ? (
              <div className="space-y-4">
                {programs.map((program) => (
                  <div key={program.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{program.name}</h4>
                      <div className="flex space-x-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Percent className="h-3.5 w-3.5 mr-1" />
                          Скидка: {program.discount_percentage}%
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          Мин. визитов: {program.min_visits}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Нет созданных программ лояльности
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Клиенты в программах лояльности
            </CardTitle>
            <CardDescription>
              Управление участниками программ лояльности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить клиента в программу
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Добавить клиента в программу</DialogTitle>
                    <DialogDescription>
                      Выберите клиента и программу лояльности
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client">Клиент</Label>
                      <select 
                        id="client"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={newClientLoyalty.userId}
                        onChange={(e) => setNewClientLoyalty({...newClientLoyalty, userId: e.target.value})}
                      >
                        <option value="">Выберите клиента</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="program">Программа лояльности</Label>
                      <select 
                        id="program"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={newClientLoyalty.programId}
                        onChange={(e) => setNewClientLoyalty({...newClientLoyalty, programId: e.target.value})}
                      >
                        <option value="">Выберите программу</option>
                        {programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name} (скидка {program.discount_percentage}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button onClick={assignClientToProgram}>Добавить клиента</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {clientLoyalties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Программа</TableHead>
                    <TableHead>Скидка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientLoyalties.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.full_name}</TableCell>
                      <TableCell>{item.program_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.discount_percentage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Нет клиентов в программах лояльности
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoyaltyProgram;

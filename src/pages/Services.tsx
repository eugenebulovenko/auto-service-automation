
import MainLayout from "@/layouts/MainLayout";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Wrench, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category_id: string;
  category_name?: string;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Fetch categories first
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('service_categories')
          .select('id, name');
        
        if (categoriesError) throw categoriesError;

        const categoriesMap: {[key: string]: string} = {};
        if (categoriesData) {
          categoriesData.forEach((category) => {
            categoriesMap[category.id] = category.name;
          });
        }
        setCategories(categoriesMap);

        // Fetch services
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        if (data) {
          const servicesWithCategories = data.map(service => ({
            ...service,
            category_name: categoriesMap[service.category_id] || 'Основные услуги'
          }));
          setServices(servicesWithCategories);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить услуги. Пожалуйста, попробуйте позже.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [toast]);

  // Group services by category
  const servicesByCategory: {[key: string]: Service[]} = {};
  services.forEach(service => {
    const categoryName = service.category_name || 'Основные услуги';
    if (!servicesByCategory[categoryName]) {
      servicesByCategory[categoryName] = [];
    }
    servicesByCategory[categoryName].push(service);
  });

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-3">Наши услуги</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Полный спектр услуг по обслуживанию и ремонту автомобилей от наших опытных специалистов
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.keys(servicesByCategory).map((categoryName) => (
                <div key={categoryName}>
                  <h2 className="text-2xl font-semibold mb-4 border-l-4 border-primary pl-3">{categoryName}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servicesByCategory[categoryName].map((service) => (
                      <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                          {service.description && (
                            <CardDescription className="mb-3 line-clamp-2">
                              {service.description}
                            </CardDescription>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{service.duration} мин.</span>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                              {service.price} ₽
                            </Badge>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button asChild className="w-full">
                            <Link to={`/booking?service=${service.id}`} className="flex items-center justify-center">
                              Записаться <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-16 text-center">
            <Button size="lg" asChild>
              <Link to="/booking" className="flex items-center px-6">
                <Wrench className="mr-2 h-5 w-5" /> Записаться на сервис
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Services;

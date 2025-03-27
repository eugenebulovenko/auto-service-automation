
import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, Calendar, ClipboardList, Wrench, BarChart3, Settings, 
  ChevronRight, ChevronLeft, LogOut, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminHome from "./AdminHome";
import AdminAppointments from "./AdminAppointments";
import AdminWorkOrders from "./AdminWorkOrders";
import AdminClients from "./AdminClients";
import AdminMechanics from "./AdminMechanics";
import AdminParts from "./AdminParts";
import AdminReports from "./AdminReports";
import AdminLoyalty from "./AdminLoyalty";

const AdminDashboard = () => {
  const { signOut, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: "Обзор", path: "/admin", icon: <BarChart3 className="h-5 w-5" /> },
    { name: "Записи", path: "/admin/appointments", icon: <Calendar className="h-5 w-5" /> },
    { name: "Заказ-наряды", path: "/admin/work-orders", icon: <ClipboardList className="h-5 w-5" /> },
    { name: "Клиенты", path: "/admin/clients", icon: <Users className="h-5 w-5" /> },
    { name: "Механики", path: "/admin/mechanics", icon: <Wrench className="h-5 w-5" /> },
    { name: "Запчасти", path: "/admin/parts", icon: <Settings className="h-5 w-5" /> },
    { name: "Программы лояльности", path: "/admin/loyalty", icon: <Gift className="h-5 w-5" /> },
    { name: "Отчеты", path: "/admin/reports", icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div 
        className={`bg-primary text-white transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } fixed inset-y-0 left-0 z-30 md:relative`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-white/20">
            <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
              <span className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center font-bold">
                A
              </span>
              {!collapsed && <span className="ml-2 font-semibold">АвтоСервис</span>}
            </div>
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="text-white/80 hover:text-white"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="flex-1 py-6 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                      location.pathname === item.path || 
                      (item.path !== "/admin" && location.pathname.startsWith(item.path))
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-4 border-t border-white/20">
            <div className={`flex items-center ${collapsed ? "justify-center" : ""} mb-4`}>
              {collapsed ? (
                <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center">
                  {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center">
                    {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-sm text-white/70">Администратор</p>
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="secondary" 
              className={`${collapsed ? "p-2 w-full justify-center" : "w-full"}`}
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="ml-2">Выйти</span>}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
        <div className="p-6 min-h-screen bg-secondary/30">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/appointments" element={<AdminAppointments />} />
            <Route path="/work-orders" element={<AdminWorkOrders />} />
            <Route path="/clients" element={<AdminClients />} />
            <Route path="/mechanics" element={<AdminMechanics />} />
            <Route path="/parts" element={<AdminParts />} />
            <Route path="/loyalty" element={<AdminLoyalty />} />
            <Route path="/reports" element={<AdminReports />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

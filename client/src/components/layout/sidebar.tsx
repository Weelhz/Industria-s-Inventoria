import {
  Home,
  Package,
  Activity,
  Users,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { currentUser } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const { toast } = useToast();

  const allMenuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Package, label: "Inventory", path: "/inventory" },
    { icon: Activity, label: "Activity", path: "/activity" },
    { icon: Users, label: "Users", path: "/users" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Database, label: "Database", path: "/database" },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (currentUser?.role === "user") {
      return ["/dashboard", "/inventory", "/activity"].includes(item.path);
    }
    if (currentUser?.role === "overseer") {
      return ["/activity"].includes(item.path);
    }
    return true;
  });

  const handleEasterEgg = () => {
    const newClickCount = easterEggClicks + 1;
    setEasterEggClicks(newClickCount);
    
    if (newClickCount === 4) {
      toast({
        title: "Here is the answer...",
        description: (
          <a 
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Click here for the answer
          </a>
        ),
        duration: 8000,
      });
      setEasterEggClicks(0);
    } else if (newClickCount === 2) {
      toast({
        title: "Curious...",
        description: "What do you seek?",
        duration: 3000,
      });
    }
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div
          className="w-full h-21 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => onNavigate("/about")}
        >
          <img src="/logo.svg" alt="Logo" className="h-21 w-21" />
        </div>
      </div>

      {/* Collapse Button */}
      <div className="px-4 pb-2">
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            handleEasterEgg();
          }}
          className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title="Toggle sidebar"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

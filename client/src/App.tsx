import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/contexts/user-context";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Activity from "@/pages/activity";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import Database from "@/pages/database";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('/dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case '/dashboard':
        return <Dashboard />;
      case '/inventory':
        return <Inventory />;
      case '/activity':
        return <Activity />;
      case '/users':
        return <Users />;
      case '/settings':
        return <Settings />;
      case '/database':
        return <Database />;
      case '/about':
        return <About />;
      default:
        return <NotFound />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case '/dashboard':
        return 'Dashboard';
      case '/inventory':
        return 'Inventory';
      case '/activity':
        return 'Activity';
      case '/users':
        return 'Users';
      case '/settings':
        return 'Settings';
      case '/database':
        return 'Database';
      case '/about':
        return 'About Inventoria';
      default:
        return 'Page Not Found';
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <div className="flex h-screen">
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar title={getPageTitle()} />
            <main className="flex-1 overflow-auto">
              {renderPage()}
            </main>
          </div>
        </div>
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
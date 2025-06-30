import { User, LogOut, Settings } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = "Dashboard" }: TopBarProps) {
  const { currentUser, setCurrentUser } = useUser();

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(user => user.id.toString() === userId);
    if (selectedUser) {
      setCurrentUser(selectedUser);
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Title */}
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      {/* User Controls */}
      <div className="flex items-center space-x-4">
        {/* User Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Acting as:</span>
          <Select
            value={currentUser?.id?.toString() || ""}
            onValueChange={handleUserChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}



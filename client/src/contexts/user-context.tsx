import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  users: User[];
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const fetchedUsers = await response.json();
      setUsers(fetchedUsers);
      
      // Update current user if it exists in the new list
      if (currentUser) {
        const updatedCurrentUser = fetchedUsers.find((user: User) => user.id === currentUser.id);
        if (updatedCurrentUser) {
          setCurrentUser(updatedCurrentUser);
        }
      } else {
        // Set default user - prefer admin, then first user
        const defaultUser = fetchedUsers.find((user: User) => user.role === 'admin') || fetchedUsers[0];
        if (defaultUser) {
          setCurrentUser(defaultUser);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, users, isLoading, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
}

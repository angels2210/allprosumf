import React, { createContext, useContext, useState, useEffect } from 'react';

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  type?: 'natural' | 'juridica';
  identification?: string;
}

interface ClientContextType {
  client: Client | null;
  loading: boolean;
  login: (client: Client, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedClient = localStorage.getItem('client');
    const token = localStorage.getItem('clientToken');
    
    if (storedClient && token) {
      try {
        setClient(JSON.parse(storedClient));
      } catch (e) {
        console.error('Error parsing stored client', e);
        localStorage.removeItem('client');
        localStorage.removeItem('clientToken');
      }
    }
    setLoading(false);
  }, []);

  const login = (clientData: Client, token: string) => {
    setClient(clientData);
    localStorage.setItem('client', JSON.stringify(clientData));
    localStorage.setItem('clientToken', token);
  };

  const logout = () => {
    setClient(null);
    localStorage.removeItem('client');
    localStorage.removeItem('clientToken');
  };

  return (
    <ClientContext.Provider value={{ 
      client, 
      loading, 
      login, 
      logout, 
      isAuthenticated: !!client 
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}

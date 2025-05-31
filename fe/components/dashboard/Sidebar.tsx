"use client";

import { useEffect, useState } from "react";
import { 
  LogOut, 
  Menu, 
  Trash2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { AvatarFallback, AvatarImage, Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { BACKEND_BASE_URL } from "@/lib/constants";
import { toast } from "sonner";

interface ChatSession {
  id: string;
  date: string;
  chats: {
    id: string;
    prompt: string;
    responce: string;
    genUrl: string;
  }[];
}

export default function Sidebar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/sessions`, {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setChatSessions(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        toast.error('Failed to load chat sessions');
      }
    };

    if (session?.user?.accessToken) {
      fetchSessions();
    }
  }, [session?.user?.accessToken]);

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        toast.success('Session deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="h-full bg-neutral-800">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden absolute top-4 left-4 z-50"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-neutral-700">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback>
                {session?.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2">Sessions</h3>
            <div>
              {chatSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/${session.id}`}
                  className="flex items-center justify-between p-2 hover:bg-neutral-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {session.chats[0]?.prompt || 'New Session'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-700">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

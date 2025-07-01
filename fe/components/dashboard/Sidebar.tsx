"use client";

import { useEffect, useState } from "react";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { AvatarFallback, AvatarImage, Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { toast } from "sonner";
import DashLoader from "../loaders/DashLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { useRouter } from "next/navigation";

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

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export default function Sidebar() {
  const { data: session } = useSession();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_BASE_URL}/sessions`, {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setChatSessions(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        toast.error("Failed to load chat sessions");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.accessToken) {
      fetchSessions();
    }
  }, [session?.user?.accessToken]);

  // Update delete handler to open dialog
  const handleDeleteSessionClick = (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      setChatSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      toast.success("Session deleted successfully");
      setSessionToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <aside className="h-full bg-neutral-800 border-r border-neutral-800 flex flex-col md:min-w-64">
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className=" bg-neutral-800">
          <DialogHeader>
            <DialogTitle>Delete Session?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Sessions */}
      <div className="flex-1 w-[10] overflow-y-auto p-4 space-y-2">
        <h3 className="text-sm font-semibold p-2 text-neutral-300">Sessions</h3>
        <Button className=" w-full"
        onClick={() => router.push("/dashboard")}
        ><span><Plus className=" text-black font-bold"/></span>New Chat</Button>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="scale-75">
              <DashLoader />
            </div>
          </div>
        ) : chatSessions.length > 0 ? (
          chatSessions.map((session) => (
            <Link
              key={session.id}
              href={`/dashboard/${session.id}`}
              className="flex items-center justify-between px-2 py-1 max-w-full rounded-md bg-neutral-700 hover:bg-neutral-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {session.chats[0]?.prompt || "New Session"}
                </p>
                
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleDeleteSessionClick(session.id, e)}
              >
                <Trash2 className=" text-red-400 h-4 w-4" />
              </Button>
            </Link>
          ))
        ) : (
          <p className="text-sm text-neutral-400">No sessions found.</p>
        )}
      </div>

      {/* User Info */}
      <div className="p-1 px-2 border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback>
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="p-2 border-t border-neutral-800">
        <Button
          className="w-full justify-start text-neutral-200 border border-neutral-700 bg-neutral-800 hover:bg-neutral-900"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

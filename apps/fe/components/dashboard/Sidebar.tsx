"use client";

import { useEffect, useState } from "react";
import { LogOut, Plus, Trash2, ChevronLeft, ChevronRight, Coins } from "lucide-react";
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
import { useCredits } from "@/contexts/CreditsContext";

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
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { credits } = useCredits();

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
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/sessions/${sessionToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to delete session');
        return;
      }
      setChatSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      toast.success("Session deleted successfully");
      router.push('/dashboard');
    } catch (error) {
      console.error('Delete session error:', error);
      toast.error('Failed to delete session');
    } finally {
      setSessionToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <aside className={`relative h-full bg-[#f8f8f8] dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 transition-[width] duration-300 ease-in-out ${collapsed ? "w-14" : "w-64"}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-nav">Delete Session?</DialogTitle>
            <DialogDescription className="font-body">
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              className="rounded-full font-nav"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full font-nav">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {collapsed ? (
        /* Collapsed view */
        <div className="flex flex-col items-center flex-1 w-14 py-4 gap-3 animate-in fade-in duration-300">
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            onClick={() => router.push("/dashboard")}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="text-xs">
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full text-neutral-500 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* Expanded view: fixed width + clipping so content doesn't reflow while the sidebar animates open */
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 w-64 animate-in fade-in duration-300">
          {/* Sessions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="font-nav text-xs font-semibold uppercase tracking-wider p-2 text-neutral-500 dark:text-neutral-400">
              Sessions
            </h3>
            <Button
              className="w-full rounded-full bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 font-nav font-medium"
              onClick={() => router.push("/dashboard")}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
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
                  className="flex items-center justify-between px-2 py-1 max-w-full rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm truncate text-neutral-800 dark:text-neutral-100">
                      {session.chats[0]?.prompt.slice(0, 20)+ "..."}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={(e) => handleDeleteSessionClick(session.id, e)}
                  >
                    <Trash2 className="text-red-500 dark:text-red-400 h-4 w-4" />
                  </Button>
                </Link>
              ))
            ) : (
              <p className="font-body text-sm text-neutral-500 dark:text-neutral-400">No sessions found.</p>
            )}
          </div>

          {/* User Info */}
          <div className="p-1 px-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-nav text-sm font-medium truncate text-neutral-900 dark:text-white">{session?.user?.name || "User"}</p>
                <p className="font-body text-xs text-neutral-500 dark:text-neutral-400 truncate">{session?.user?.email}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Coins className="h-3 w-3 text-[#4a3294]" />
                  <span className="font-badge text-xs text-[#4a3294] font-medium">{credits} credits</span>
                  <Link href="/pricing" className="font-badge text-xs text-neutral-500 dark:text-neutral-400 underline hover:text-[#4a3294] dark:hover:text-[#4a3294] ml-1">
                    Buy more
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="p-2 flex justify-center border-t border-neutral-200 dark:border-neutral-800">
            <Button
              className="w-full rounded-full font-nav text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        </div>
      )}
    </aside>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSession } from "@/actions/auth";
import { getHistory, clearHistory, deleteHistoryItem, updateHistoryItem, updateNotesOrder } from "@/actions/history";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Trash2, Calendar, Clock, Trash, Edit2, Pin, PinOff, GripVertical, ArrowUpRight, Eye, RefreshCw } from "lucide-react";

interface Note {
  _id: string;
  title: string;
  content: string;
  isPinned?: boolean;
  order?: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("all_time"); // all_time, today, 7_days, 30_days
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
  const router = useRouter();

  // Edit & View Modal State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Drag and Drop State
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    const session = await getSession();
    
    if (session) {
      setIsLoggedIn(true);
      const res = await getHistory(searchQuery, sortOption);
      if (res.success && res.notes) {
        setNotes(res.notes);
      } else {
        setNotes([]);
      }
    } else {
      setIsLoggedIn(false);
      const historyStr = localStorage.getItem("blanked_note_history");
      if (historyStr) {
        let localNotes: Note[] = JSON.parse(historyStr);
        
        // Apply search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          localNotes = localNotes.filter(
            (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
          );
        }

        // Apply sort/date filter
        const now = new Date();
        localNotes = localNotes.filter((n) => {
          const noteDate = new Date(n.createdAt);
          if (sortOption === "today") {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return noteDate >= startOfToday;
          } else if (sortOption === "7_days") {
            const startOf7Days = new Date(now);
            startOf7Days.setDate(now.getDate() - 7);
            return noteDate >= startOf7Days;
          } else if (sortOption === "30_days") {
            const startOf30Days = new Date(now);
            startOf30Days.setDate(now.getDate() - 30);
            return noteDate >= startOf30Days;
          }
          return true;
        });

        // Sort descending, pins first, then order, then date
        localNotes.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setNotes(localNotes);
      } else {
        setNotes([]);
      }
    }
    setIsLoading(false);
  }, [searchQuery, sortOption]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete all saved notes? This action cannot be undone.")) {
      return;
    }

    if (isLoggedIn) {
      const res = await clearHistory();
      if (res.success) {
        setNotes([]);
        showToast("History cleared successfully!");
      } else {
        showToast("Failed to clear history.", 'error');
      }
    } else {
      localStorage.removeItem("blanked_note_history");
      setNotes([]);
      showToast("History cleared successfully!");
    }
  };

  const handleDelete = async (id: string) => {
    if (isLoggedIn) {
      const res = await deleteHistoryItem(id);
      if (res.success) {
        fetchNotes();
        showToast("Note deleted successfully!");
      } else {
        showToast("Failed to delete note.", 'error');
      }
    } else {
      const historyStr = localStorage.getItem("blanked_note_history");
      if (historyStr) {
        let localNotes: Note[] = JSON.parse(historyStr);
        localNotes = localNotes.filter(n => n._id !== id);
        localStorage.setItem("blanked_note_history", JSON.stringify(localNotes));
        fetchNotes();
        showToast("Note deleted successfully!");
      }
    }
  };

  const handlePinToggle = async (note: Note) => {
    const isCurrentlyPinned = !!note.isPinned;
    const newPinnedState = !isCurrentlyPinned;

    if (newPinnedState) {
      const currentPins = notes.filter(n => n.isPinned).length;
      if (currentPins >= 4) {
        showToast("You can only pin up to 4 notes.", 'error');
        return;
      }
    }

    if (isLoggedIn) {
      const res = await updateHistoryItem(note._id, { isPinned: newPinnedState });
      if (res.success) {
        fetchNotes();
      } else {
        showToast(res.error || "Failed to update pin.", 'error');
      }
    } else {
      const historyStr = localStorage.getItem("blanked_note_history");
      if (historyStr) {
        let localNotes: Note[] = JSON.parse(historyStr);
        const index = localNotes.findIndex(n => n._id === note._id);
        if (index !== -1) {
          localNotes[index].isPinned = newPinnedState;
          localStorage.setItem("blanked_note_history", JSON.stringify(localNotes));
          fetchNotes();
        }
      }
    }
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleEditSubmit = async () => {
    if (!editingNote) return;
    setIsSavingEdit(true);

    if (isLoggedIn) {
      const res = await updateHistoryItem(editingNote._id, { title: editTitle, content: editContent });
      if (res.success) {
        fetchNotes();
        showToast("Note updated successfully!");
        setEditingNote(null);
      } else {
        showToast("Failed to update note.", 'error');
      }
    } else {
      const historyStr = localStorage.getItem("blanked_note_history");
      if (historyStr) {
        let localNotes: Note[] = JSON.parse(historyStr);
        const index = localNotes.findIndex(n => n._id === editingNote._id);
        if (index !== -1) {
          localNotes[index].title = editTitle;
          localNotes[index].content = editContent;
          localStorage.setItem("blanked_note_history", JSON.stringify(localNotes));
          fetchNotes();
          showToast("Note updated successfully!");
          setEditingNote(null);
        }
      }
    }
    setIsSavingEdit(false);
  const handleDragStart = (e: React.DragEvent, id: string, isPinned: boolean) => {
    if (isPinned) {
      e.preventDefault();
      return;
    }
    setDraggedNoteId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string, isPinned: boolean) => {
    e.preventDefault();
    if (isPinned) return;
    setDragOverNoteId(id);
  };

  const handleDrop = async (e: React.DragEvent, id: string, isPinned: boolean) => {
    e.preventDefault();
    setDragOverNoteId(null);
    if (isPinned || !draggedNoteId || draggedNoteId === id) {
      setDraggedNoteId(null);
      return;
    }

    const newNotes = [...notes];
    const draggedIndex = newNotes.findIndex(n => n._id === draggedNoteId);
    const dropIndex = newNotes.findIndex(n => n._id === id);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const [draggedNote] = newNotes.splice(draggedIndex, 1);
    newNotes.splice(dropIndex, 0, draggedNote);

    // Reassign orders for unpinned notes
    const updates: { id: string; order: number }[] = [];
    let currentOrder = 1;
    
    const updatedNotes = newNotes.map(n => {
      if (!n.isPinned) {
        updates.push({ id: n._id, order: currentOrder });
        return { ...n, order: currentOrder++ };
      }
      return n;
    });

    setNotes(updatedNotes);
    setDraggedNoteId(null);

    if (isLoggedIn) {
      const res = await updateNotesOrder(updates);
      if (!res.success) showToast("Failed to save new order.", 'error');
    } else {
      localStorage.setItem("blanked_note_history", JSON.stringify(updatedNotes));
    }
  };

  const handleResetOrder = async () => {
    if (!confirm("Reset drag order to default?")) return;
    
    if (isLoggedIn) {
      const updates = notes.map(n => ({ id: n._id, order: 0 }));
      await updateNotesOrder(updates);
      fetchNotes();
      showToast("Order reset successfully!");
    } else {
      const historyStr = localStorage.getItem("blanked_note_history");
      if (historyStr) {
        let localNotes: Note[] = JSON.parse(historyStr);
        localNotes = localNotes.map(n => ({ ...n, order: 0 }));
        localStorage.setItem("blanked_note_history", JSON.stringify(localNotes));
        fetchNotes();
        showToast("Order reset successfully!");
      }
    }
  };

  const handleReopen = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    localStorage.setItem("blanked_note_content", note.content);
    router.push("/");
  };

  const handleCardClick = (note: Note) => {
    setViewingNote(note);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] transition-colors duration-300 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & SubNav */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-cyan-500" />
              Note History
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-gray-100 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white transition-all"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 w-full sm:w-auto bg-gray-100 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white transition-all cursor-pointer"
              >
                <option value="all_time">All Time</option>
                <option value="today">Today</option>
                <option value="7_days">Last 7 Days</option>
                <option value="30_days">Last 30 Days</option>
              </select>
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Reset Order Button */}
            <button 
              onClick={handleResetOrder}
              disabled={notes.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reset Order"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Order
            </button>

            {/* Clear All Button */}
            <button 
              onClick={handleClearAll}
              disabled={notes.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {notes.map((note) => (
              <div 
                key={note._id} 
                className={`group relative bg-white dark:bg-[#0B1120] border ${note.isPinned ? 'border-cyan-500 shadow-cyan-500/10' : 'border-gray-200 dark:border-white/10'} rounded-2xl p-6 shadow-sm hover:shadow-xl dark:shadow-none hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all duration-300 flex flex-col h-64`}
              >
                {note.isPinned && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-1.5 rounded-full shadow-lg">
                    <Pin className="w-4 h-4" />
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handlePinToggle(note)}
                      className={`p-1.5 rounded-lg transition-colors ${note.isPinned ? 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10' : 'text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10'}`}
                      title={note.isPinned ? "Unpin Note" : "Pin Note"}
                    >
                      {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => openEditModal(note)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Edit Note"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(note._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Note"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap line-clamp-6">
                    {note.content}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  <span>{new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No notes found</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              {searchQuery ? "Try adjusting your search or filters to find what you're looking for." : "You haven't saved any notes yet. Go back to the editor and click 'Save' to keep your thoughts here."}
            </p>
            {!searchQuery && (
              <Link 
                href="/" 
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-full hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Go to Editor
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-cyan-500" />
              Edit Note
            </h3>
            
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all mb-4 font-bold"
            />
            
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Note content..."
              className="w-full flex-1 min-h-[200px] p-4 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all mb-6 resize-none"
            />

            <div className="flex justify-end gap-3 mt-auto">
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                disabled={isSavingEdit}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-lg transition-all shadow-sm shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-full shadow-lg border transition-all duration-300 transform ${
          toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        } ${
          toast.type === 'success' 
            ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400" 
            : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
        }`}
      >
        <div className="flex items-center gap-2 font-medium text-sm">
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {toast.message}
        </div>
      </div>
    </div>
  );
}

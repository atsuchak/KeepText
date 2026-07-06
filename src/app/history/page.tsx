"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSession } from "@/actions/auth";
import { getHistory, clearHistory, deleteHistoryItem, updateHistoryItem, updateNotesOrder } from "@/actions/history";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Trash2, Calendar, Clock, Trash, Edit2, Pin, PinOff, GripVertical, ArrowUpRight, Eye, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmModal } from "@/components/ConfirmModal";

interface Note {
  _id: string;
  title: string;
  content: string;
  isPinned?: boolean;
  order?: number;
  createdAt: string;
}

function SortableNoteCard({
  note,
  onCardClick,
  onReopen,
  onPinToggle,
  onOpenEdit,
  onDelete
}: {
  note: Note;
  onCardClick: (note: Note) => void;
  onReopen: (e: React.MouseEvent, note: Note) => void;
  onPinToggle: (note: Note) => void;
  onOpenEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onCardClick(note)}
      className={`group relative border ${
        note.isPinned
          ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-500 shadow-indigo-500/20'
          : 'bg-white dark:bg-[#0B1120] border-gray-200 dark:border-white/10'
      } rounded-2xl p-6 shadow-sm hover:shadow-xl dark:shadow-none hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-colors duration-300 flex flex-col h-48 cursor-pointer`}
    >
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-2 max-w-[70%]">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
            {note.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => onReopen(e, note)}
            className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
            title="Reopen Note"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPinToggle(note)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.isPinned
                ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                : 'text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10'
            }`}
            title={note.isPinned ? "Unpin Note" : "Pin Note"}
          >
            {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onOpenEdit(note)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
            title="Edit Note"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note._id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete Note"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden pointer-events-none">
        <div
          className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap line-clamp-3 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pointer-events-none">
        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm'
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("all_time"); // all_time, today, 7_days, 30_days
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Edit & View Modal State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);



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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  const totalPages = Math.ceil(notes.length / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [notes.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotes = notes.slice(startIndex, endIndex);

  const executeClearAll = async () => {
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

  const handleClearAll = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Clear History",
      message: "Are you sure you want to delete all saved notes? This action cannot be undone.",
      onConfirm: executeClearAll,
      confirmText: "Clear All"
    });
  };

  const executeDelete = async (id: string) => {
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

  const handleDelete = (id: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Delete Note",
      message: "Are you sure you want to delete this note? This action cannot be undone.",
      onConfirm: () => executeDelete(id),
      confirmText: "Delete"
    });
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
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = notes.findIndex((n) => n._id === active.id);
      const newIndex = notes.findIndex((n) => n._id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        if (!!notes[oldIndex].isPinned !== !!notes[newIndex].isPinned) {
          return;
        }

        const newNotes = arrayMove(notes, oldIndex, newIndex);
        
        const updates: { id: string; order: number }[] = [];
        let pinnedOrder = 1;
        let unpinnedOrder = 1;
        
        const updatedNotes = newNotes.map(n => {
          if (n.isPinned) {
            updates.push({ id: n._id, order: pinnedOrder });
            return { ...n, order: pinnedOrder++ };
          } else {
            updates.push({ id: n._id, order: unpinnedOrder });
            return { ...n, order: unpinnedOrder++ };
          }
        });

        setNotes(updatedNotes);

        if (isLoggedIn) {
          const res = await updateNotesOrder(updates);
          if (!res.success) showToast("Failed to save new order.", 'error');
        } else {
          localStorage.setItem("blanked_note_history", JSON.stringify(updatedNotes));
        }
      }
    }
  };

  const executeResetOrder = async () => {
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

  const handleResetOrder = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Reset Order",
      message: "Reset drag order to default?",
      onConfirm: executeResetOrder,
      confirmText: "Reset"
    });
  };

  const handleReopen = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    localStorage.setItem("blanked_note_content", note.content);
    localStorage.setItem("blanked_note_id", note._id);
    localStorage.setItem("blanked_note_title", note.title);
    router.push("/");
  };

  const handleCardClick = (note: Note) => {
    setViewingNote(note);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] transition-colors duration-300 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & SubNav */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl hidden sm:block">
              <Clock className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Clock className="w-6 h-6 text-cyan-500 sm:hidden" />
                Note History
              </h1>

            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-80 md:w-96">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
              {/* Sort Dropdown */}
              <div className="relative flex-1 sm:flex-none" ref={sortDropdownRef}>
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 pl-10 pr-8 py-2 w-full sm:w-auto bg-gray-100 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white transition-all cursor-pointer min-w-[140px] text-left relative"
                >
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <span className="truncate font-medium">
                    {sortOption === 'all_time' ? 'All Time' :
                     sortOption === 'today' ? 'Today' :
                     sortOption === '7_days' ? 'Last 7 Days' :
                     sortOption === '30_days' ? 'Last 30 Days' : 'Sort Notes'}
                  </span>
                  <svg className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 w-full sm:w-[160px] bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1.5 origin-top">
                    {[
                      { value: 'all_time', label: 'All Time' },
                      { value: 'today', label: 'Today' },
                      { value: '7_days', label: 'Last 7 Days' },
                      { value: '30_days', label: 'Last 30 Days' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortOption(option.value);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${ 
                          sortOption === option.value 
                            ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-500/10 font-medium' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        {option.label}
                        {sortOption === option.value && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear All Button */}
              <button 
                onClick={handleClearAll}
                disabled={notes.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {!isLoading && notes.length > 0 && (
          <div className="flex justify-end mb-4 pr-2">
            <button 
              onClick={handleResetOrder}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Reset Order"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notes.length > 0 ? (
          <div className="flex flex-col gap-6">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={paginatedNotes.map(n => n._id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {paginatedNotes.map((note) => (
                    <SortableNoteCard
                      key={note._id}
                      note={note}
                      onCardClick={handleCardClick}
                      onReopen={handleReopen}
                      onPinToggle={handlePinToggle}
                      onOpenEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {notes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                  {[20, 50, 100].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        itemsPerPage === size
                          ? 'bg-white dark:bg-white/10 text-cyan-600 dark:text-cyan-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {Math.max(1, totalPages)}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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

      {/* View Modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setViewingNote(null)}>
          <div className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4 gap-4">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {viewingNote.title}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button 
                  onClick={() => {
                    handlePinToggle(viewingNote);
                    setViewingNote({...viewingNote, isPinned: !viewingNote.isPinned});
                  }}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${viewingNote.isPinned ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-500 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10'}`}
                  title={viewingNote.isPinned ? "Unpin Note" : "Pin Note"}
                >
                  {viewingNote.isPinned ? <PinOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Pin className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                <button 
                  onClick={() => {
                    setViewingNote(null);
                    openEditModal(viewingNote);
                  }}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="Edit Note"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={() => {
                    setViewingNote(null);
                    handleDelete(viewingNote._id);
                  }}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete Note"
                >
                  <Trash className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={(e) => handleReopen(e, viewingNote)}
                  className="ml-1 sm:ml-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-lg transition-all shadow-sm shadow-blue-500/25 flex items-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="hidden sm:inline">Reopen in Editor</span>
                  <span className="inline sm:hidden">Reopen</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar min-h-0">
              <div 
                className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed text-lg [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_a]:text-blue-500 [&_a]:underline [&_a]:cursor-pointer"
                dangerouslySetInnerHTML={{ __html: viewingNote.content }}
              />
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-white/10 gap-2">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Created: {new Date(viewingNote.createdAt).toLocaleString()}
              </div>
              <button
                onClick={() => setViewingNote(null)}
                className="px-4 py-2 sm:px-6 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingNote && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => { if (!isSavingEdit) setEditingNote(null); }}
        >
          <div 
            className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-cyan-500" />
              Edit Note
            </h3>
            
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!isSavingEdit) handleEditSubmit();
                }
              }}
              placeholder="Title..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all mb-4 font-bold"
            />
            
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (!isSavingEdit) handleEditSubmit();
                }
              }}
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

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
      />

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

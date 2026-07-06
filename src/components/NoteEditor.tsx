"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getNote, saveNote } from "@/actions/notes";
import { saveToHistory } from "@/actions/history";
import { 
  Save, Type, Trash2, Bold, Italic, Underline, Highlighter, 
  Baseline, Strikethrough, Heading1, Heading2, History, 
  Link as LinkIcon, List, ListOrdered, Smile 
} from "lucide-react";
import Link from "next/link";

export function NoteEditor() {
  const [content, setContent] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function initializeNote() {
      const savedLocalContent = localStorage.getItem("blanked_note_content");
      const res = await getNote();
      
      let initialHTML = "";
      if (res.success) {
        setIsLoggedIn(true);
        if (savedLocalContent) {
          initialHTML = savedLocalContent;
          setContent(initialHTML);
          await saveNote(initialHTML);
          localStorage.removeItem("blanked_note_content");
        } else {
          initialHTML = res.content || "";
          setContent(initialHTML);
        }
      } else {
        setIsLoggedIn(false);
        if (savedLocalContent !== null) {
          initialHTML = savedLocalContent;
          setContent(initialHTML);
        }
      }
      setIsLoaded(true);
      
      // Delay to ensure ref is attached
      setTimeout(() => {
        if (editorRef.current && !editorRef.current.innerHTML && initialHTML) {
          editorRef.current.innerHTML = initialHTML;
        }
      }, 0);
    }
    
    initializeNote();
  }, []);

  useEffect(() => {
    const handleSaveRequest = () => {
      setIsSaveModalOpen(true);
    };
    document.addEventListener("requestSaveNote", handleSaveRequest);
    return () => {
      document.removeEventListener("requestSaveNote", handleSaveRequest);
    };
  }, []);

  const debouncedSaveToDb = useCallback((newContent: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(newContent);
    }, 1000);
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    
    if (isLoggedIn) {
      debouncedSaveToDb(newContent);
    } else {
      localStorage.setItem("blanked_note_content", newContent);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleSaveToHistory = async () => {
    setIsSaving(true);
    try {
      if (isLoggedIn) {
        const res = await saveToHistory(saveTitle, content);
        if (res.success) {
          showToast("Note saved successfully!");
        } else {
          showToast(res.error || "Failed to save note", 'error');
        }
      } else {
        const historyStr = localStorage.getItem("blanked_note_history");
        const history = historyStr ? JSON.parse(historyStr) : [];
        
        let finalTitle = saveTitle;
        if (!finalTitle || finalTitle.trim() === "") {
          const plainText = editorRef.current?.innerText || "";
          const words = plainText.trim().split(/\s+/);
          finalTitle = words.slice(0, 2).join(" ");
          if (!finalTitle) finalTitle = "Untitled";
        }

        const newNote = {
          _id: Date.now().toString(),
          title: finalTitle,
          content,
          createdAt: new Date().toISOString(),
        };

        history.push(newNote);
        localStorage.setItem("blanked_note_history", JSON.stringify(history));
        showToast("Note saved locally!");
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving note.", 'error');
    } finally {
      setIsSaving(false);
      setIsSaveModalOpen(false);
      setSaveTitle("");
    }
  };

  const clearText = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setContent("");
    if (isLoggedIn) {
      saveNote("");
    } else {
      localStorage.removeItem("blanked_note_content");
    }
    setIsClearModalOpen(false);
    showToast("Text cleared successfully!");
  };

  const execFormat = (command: string, value?: string) => {
    if (command === 'createLink') {
      const url = window.prompt("Enter link URL:", "https://");
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false, value);
    }
    
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const insertEmoji = (emoji: string) => {
    document.execCommand('insertText', false, emoji);
    setShowEmojiPicker(false);
    if (editorRef.current) editorRef.current.focus();
  };

  const EMOJIS = ["😀", "😂", "🥺", "❤️", "✨", "🔥", "👍", "🙌", "💡", "🚀", "🎉", "📌"];

  if (!isLoaded) {
    return <div className="flex-1 w-full h-full bg-white dark:bg-black" />;
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-white dark:bg-black transition-colors duration-300 relative">
      <div className="flex-1 overflow-auto p-4 sm:p-8 pb-40 max-w-5xl mx-auto w-full">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="w-full min-h-[70vh] outline-none border-none text-gray-900 dark:text-gray-100 text-lg sm:text-xl leading-relaxed font-sans empty:before:content-[attr(placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-600 focus:outline-none"
          placeholder="Start typing your note here..."
        />
      </div>

      {/* Floating Dock (Main Actions) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 sm:gap-2 p-2 bg-white/80 dark:bg-[#0B1120]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-full shadow-2xl dark:shadow-black/50 transition-all">
          <Link href="/history" className="flex items-center gap-2 px-4 py-2.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-sm font-medium" title="History">
            <History className="w-5 h-5" />
            <span className="hidden md:inline">History</span>
          </Link>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />
          
          <button onClick={() => setShowToolbar(!showToolbar)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-sm font-medium ${showToolbar ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`} title="Format">
            <Type className="w-5 h-5" />
            <span className="hidden md:inline">Format</span>
          </button>
          
          <button onClick={() => setIsSaveModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all shadow-sm shadow-blue-500/25 text-sm font-medium" title="Save">
            <Save className="w-5 h-5" />
            <span className="hidden md:inline">Save</span>
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />
          
          <button onClick={() => setIsClearModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-sm font-medium" title="Clear Text">
            <Trash2 className="w-5 h-5" />
            <span className="hidden md:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Formatting Toolbar (Pops up above dock) */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-[#1a2333]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-black/50 transition-all duration-300 z-40 overflow-visible ${showToolbar ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="px-4 py-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar max-w-[95vw] md:max-w-none">
          <button onClick={() => execFormat('bold')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Bold">
            <Bold className="w-5 h-5" />
          </button>
          <button onClick={() => execFormat('italic')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Italic">
            <Italic className="w-5 h-5" />
          </button>
          <button onClick={() => execFormat('underline')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Underline">
            <Underline className="w-5 h-5" />
          </button>
          <button onClick={() => execFormat('strikeThrough')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Strikethrough">
            <Strikethrough className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />
          
          <button onClick={() => execFormat('formatBlock', 'H1')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Heading 1">
            <Heading1 className="w-5 h-5" />
          </button>
          <button onClick={() => execFormat('formatBlock', 'H2')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Heading 2">
            <Heading2 className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />

          <button onClick={() => execFormat('insertUnorderedList')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Bullet List">
            <List className="w-5 h-5" />
          </button>
          <button onClick={() => execFormat('insertOrderedList')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Numbered List">
            <ListOrdered className="w-5 h-5" />
          </button>
          <button onClick={() => execFormat('createLink')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Insert Link">
            <LinkIcon className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'bg-gray-200 dark:bg-white/20 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`} title="Emoji">
              <Smile className="w-5 h-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 grid grid-cols-4 gap-2 z-50">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-2xl leading-none transition-colors">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />
          
          <div className="relative group flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
            <Baseline className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => execFormat('foreColor', e.target.value)} title="Text Color" />
          </div>
          <div className="relative group flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
            <Highlighter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => execFormat('hiliteColor', e.target.value)} title="Highlight Color" />
          </div>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />
          
          <select 
            onChange={(e) => execFormat('fontSize', e.target.value)}
            className="bg-transparent text-gray-600 dark:text-gray-300 border-none outline-none text-sm p-2 pr-4 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg cursor-pointer"
            title="Font Size"
            defaultValue="3"
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>
        </div>
      </div>

      {/* Clear Text Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-11/12 max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Clear Text</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to permanently clear all text? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearText}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-sm shadow-red-500/25"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-11/12 max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Save Note</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Enter a title for your note (optional). If left blank, the first 2 words will be used.
            </p>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Title..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all mb-6"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToHistory}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-lg transition-all shadow-sm shadow-blue-500/25 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div 
        className={`fixed top-24 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-full shadow-lg border transition-all duration-300 transform ${
          toast.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
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

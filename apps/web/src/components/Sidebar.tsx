import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../context/ThemeContext';

export function Sidebar({ 
  onNewChat, onSelectChat, currentChatId, userEmail 
}: { 
  onNewChat: () => void; onSelectChat: (id: string) => void; currentChatId: string | null; userEmail: string;
}) {
  const [history, setHistory] = useState<{ chat_id: string, title: string }[]>([]);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('conversations').select('chat_id, title').not('chat_id', 'is', null).order('created_at', { ascending: false });
      if (data) {
        const uniqueChats = data.reduce((acc: any[], current) => {
          const x = acc.find(item => item.chat_id === current.chat_id);
          if (!x) return acc.concat([current]);
          else return acc;
        }, []);
        setHistory(uniqueChats);
      }
    };
    fetchHistory();
  }, [currentChatId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="w-[280px] sm:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 flex flex-col h-[100dvh] flex-shrink-0 transition-colors duration-300">
      <div className="p-4">
        <button onClick={onNewChat} className="w-full flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-xl transition-colors font-medium shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">Recent Chats</p>
        {history.map((chat) => (
          <button key={chat.chat_id} onClick={() => onSelectChat(chat.chat_id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${currentChatId === chat.chat_id ? 'bg-gray-200 dark:bg-gray-800 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
            {chat.title || 'Untitled Chat'}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Theme</p>
        <div className="flex gap-2">
          <button onClick={() => setTheme('light')} className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${theme === 'light' ? 'border-gray-400 bg-white text-black shadow-sm' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>Light</button>
          <button onClick={() => setTheme('dark')} className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${theme === 'dark' ? 'border-gray-500 bg-gray-800 text-white shadow-sm' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>Dark</button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase shadow-sm">
            {userEmail?.[0] || 'U'}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm truncate">{userEmail}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white px-2 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Log out
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useAgentSocket } from '../hooks/useAgentSocket';
import { MessageBubble } from './MessageBubble';
import { ApprovalCard } from './ApprovalCard';
import { Sidebar } from './Sidebar';
import { supabase } from '../lib/supabaseClient';

export function ChatWindow() {
  const { connected, messages, sendMessage, pendingApproval, respondToApproval, connect, resetChat, currentChatId, loadChat } = useAgentSocket();
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<any>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [stagedFile, setStagedFile] = useState<{ base64: string, name: string, type: string } | null>(null);
  
  // NEW: State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (file.type.startsWith('image/')) {
        setStagedImage(base64String); 
      } else {
        setStagedFile({ base64: base64String, name: file.name, type: file.type });
      }
    };
    reader.readAsDataURL(file); 
    e.target.value = ''; 
  };

  const handleSend = () => {
    if (!input.trim() && !stagedImage && !stagedFile) return;
    sendMessage(input.trim(), stagedImage || undefined, stagedFile?.base64, stagedFile?.name, stagedFile?.type);
    setInput(''); setStagedImage(null); setStagedFile(null);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  if (!session) {
    // ... (Your existing Login UI stays exactly the same) ...
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f7f7f8] dark:bg-gray-950 transition-colors duration-300 p-4">
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          </div>
          <input className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl mb-3 outline-none text-gray-800 dark:text-gray-100 focus:border-black dark:focus:border-gray-500 transition-colors" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl mb-6 outline-none text-gray-800 dark:text-gray-100 focus:border-black dark:focus:border-gray-500 transition-colors" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          
          <div className="flex flex-col gap-3">
            <button className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 p-3 rounded-xl font-medium transition-colors" onClick={async () => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) alert(error.message); }}>Login</button>
            <button className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white p-3 rounded-xl font-medium transition-colors" onClick={async () => { const { error } = await supabase.auth.signUp({ email, password }); if (error) alert(error.message); else alert('Check email or log in'); }}>Sign Up</button>
            
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>

            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-black dark:text-white p-3 rounded-xl font-medium transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#f7f7f8] dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      
      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* SIDEBAR (Responsive) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar 
          onNewChat={() => { resetChat(); setIsSidebarOpen(false); }} 
          onSelectChat={(id) => { loadChat(id); setIsSidebarOpen(false); }} 
          currentChatId={currentChatId} 
          userEmail={session.user.email || 'User'} 
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 h-full relative min-w-0">
        <header className="h-14 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3">
            {/* HAMBURGER MENU (Mobile Only) */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <span className="font-semibold text-gray-800 dark:text-gray-100">AI Device Controller</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{connected ? 'Connected' : 'Disconnected'}</span>
            {!connected && <button className="bg-black dark:bg-white text-white dark:text-black px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors" onClick={connect}>Connect</button>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto pt-8 pb-32 px-4 flex flex-col">
            {messages.length === 0 && (
              <div className="h-[50vh] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-lg">AI</div>
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">How can I help you today?</h1>
              </div>
            )}
            {messages.map((m, i) => <MessageBubble key={i} role={m.role} text={m.text} image={m.image} />)}
            {pendingApproval && <ApprovalCard approval={pendingApproval} onApprove={() => respondToApproval(true)} onReject={() => respondToApproval(false)} />}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f7f7f8] dark:from-gray-950 via-[#f7f7f8] dark:via-gray-950 to-transparent pb-4 sm:pb-6 pt-10 px-3 sm:px-4 transition-colors duration-300">
          <div className="max-w-3xl mx-auto relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-lg flex flex-col p-2 transition-colors duration-300">
            {(stagedImage || stagedFile) && (
              <div className="flex items-center gap-3 px-3 pt-2 pb-1">
                {stagedImage && <div className="relative"><img src={stagedImage} className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" /><button onClick={() => setStagedImage(null)} className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button></div>}
                {stagedFile && <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm text-gray-800 dark:text-gray-200"><span className="truncate max-w-[150px] sm:max-w-xs">📄 {stagedFile.name}</span><button onClick={() => setStagedFile(null)} className="text-red-500 font-bold ml-2">×</button></div>}
              </div>
            )}
            <div className="flex items-center">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.docx,.txt,.csv" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 sm:p-3 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></button>
              <input className="flex-1 bg-transparent px-2 py-3 outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400 text-sm sm:text-base" placeholder="Message AI..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} />
              <button className="bg-black dark:bg-white text-white dark:text-black p-2 sm:p-3 rounded-xl disabled:opacity-50 transition-colors" disabled={(!input.trim() && !stagedImage && !stagedFile) || !connected} onClick={handleSend}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
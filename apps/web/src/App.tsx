import { ChatWindow } from './components/ChatWindow';
import { ThemeProvider } from './context/ThemeContext';

export default function App() { 
  return (
    <ThemeProvider>
      <ChatWindow />
    </ThemeProvider>
  );
}
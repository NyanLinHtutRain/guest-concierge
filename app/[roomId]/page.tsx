'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { sendMessage, getRoomPublicInfo } from '@/app/actions'
import { 
  Send, Loader2, MapPin, 
  HelpCircle, X, ChevronRight, 
  Wifi, Coffee, Car, ShieldAlert 
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = { id: string; role: 'user' | 'model'; content: string }

// --- 1. THE FAQ "VAULT" DATA ---
// We organize questions by category so it looks clean, not messy.
const FAQ_CATEGORIES = [
  {
    title: "Essentials",
    icon: Wifi,
    questions: [
      "What is the Wifi password?",
      "How do I use the Air Conditioner?",
      "Where do I throw the trash?",
      "Is there a washing machine?",
      "How do I use the hot water?"
    ]
  },
  {
    title: "Check-In / Out",
    icon: ShieldAlert,
    questions: [
      "What is the check-out time?",
      "Can I have a late check-out?",
      "Where do I leave the keys?",
      "How do I get into the gym/pool?"
    ]
  },
  {
    title: "Food & Local",
    icon: Coffee,
    questions: [
      "What are the top 3 restaurants nearby?",
      "Where is the nearest convenience store?",
      "Best place for coffee?",
      "Any night markets nearby?"
    ]
  },
  {
    title: "Transport",
    icon: Car,
    questions: [
      "How do I get a Grab/Taxi here?",
      "Where is the nearest train station?",
      "Parking information?",
      "How far is the airport?"
    ]
  }
]

export default function RoomChatPage() {
  const params = useParams()
  const roomId = params.roomId as string 

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', content: 'Welcome! I am your digital concierge. Tap the **Menu** button below for quick questions, or type anything!' }
  ])
  
  const [brand, setBrand] = useState({ 
    name: roomId.replace('-', ' '), 
    color: '#000000', 
    logo: '' 
  })
  
  // NEW: State for the FAQ Modal
  const [isFaqOpen, setIsFaqOpen] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getRoomPublicInfo(roomId).then((data) => {
      if (data) {
        setBrand({
          name: data.name,
          color: data.primary_color || '#000000',
          logo: data.logo_url || ''
        })
      }
    })
  }, [roomId])

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) 
  }, [messages])

  async function handleSend(text: string) {
    if (!text.trim() || isLoading) return
    
    // Close modal if open
    setIsFaqOpen(false)

    const tempId = crypto.randomUUID()
    const userMsg: Message = { id: tempId, role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const result = await sendMessage(roomId, text, messages)

      if (!result.success) {
        throw new Error(result.response || "Unknown error")
      }

      const aiId = crypto.randomUUID()
      const aiMsg: Message = { id: aiId, role: 'model', content: result.response }
      setMessages(prev => [...prev, aiMsg])

    } catch (error) {
      console.error("Chat Error:", error)
      const errorId = crypto.randomUUID()
      setMessages(prev => [...prev, { 
        id: errorId, 
        role: 'model', 
        content: "⚠️ System Offline: Please refresh the page." 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* --- 2. MODERN HEADER (Glassmorphism) --- */}
      <header 
        className="absolute top-0 left-0 right-0 p-4 z-20 transition-all duration-500 backdrop-blur-md bg-white/80 border-b border-white/20"
      >
        <div className="flex items-center gap-3">
          {brand.logo ? (
// eslint-disable-next-line @next/next/no-img-element
          <img 
            src={brand.logo} 
            alt="Logo" 
            className="h-12 w-auto object-contain" 
          />
          ) : (
             <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
          )}
          <div>
            <h1 className="font-bold text-slate-900 capitalize text-lg leading-tight drop-shadow-sm" style={{ color: brand.color }}>
              {brand.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-xs text-slate-500 font-medium">Always Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- 3. CHAT AREA --- */}
      <main className="flex-1 overflow-y-auto pt-24 pb-32 px-4 space-y-6 bg-slate-50 scroll-smooth">
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div 
              className={`max-w-[85%] px-5 py-4 text-[15px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'text-white rounded-2xl rounded-tr-sm' 
                : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-100'
              }`}
              style={m.role === 'user' ? { backgroundColor: brand.color, boxShadow: `0 4px 12px -2px ${brand.color}40` } : {}}
            >
              {m.role === 'user' ? (
                 <span>{m.content}</span>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800 flex items-center gap-1 inline-flex">
                           {props.children} <MapPin className="w-3 h-3" />
                        </a>
                      ),
                      img: ({node, ...props}) => (
                        // eslint-disable-next-line
                        <img {...props} className="rounded-xl mt-3 mb-2 w-full h-48 object-cover border border-slate-100 shadow-sm" />
                      ),
                      ul: ({node, ...props}) => <ul {...props} className="list-disc pl-4 my-2 space-y-1 text-slate-600" />,
                      ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-4 my-2 space-y-1 text-slate-600" />,
                      strong: ({node, ...props}) => <strong {...props} className="font-bold text-slate-900" />
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
               <span className="text-xs text-slate-400 font-medium">Typing...</span>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* --- 4. FLOATING FOOTER --- */}
      <footer className="absolute bottom-6 left-4 right-4 z-20">
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-2 flex items-center gap-2 pr-2 pl-4">
          
          {/* THE NEW "FAQ MENU" BUTTON */}
          <button 
            onClick={() => setIsFaqOpen(true)}
            className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Open Menu"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex-1 flex items-center gap-2"
          >
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-slate-900 text-base placeholder:text-slate-400 focus:outline-none py-3"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()} 
              className="p-3 rounded-full text-white shadow-lg disabled:opacity-50 hover:scale-105 transition-all active:scale-95"
              style={{ backgroundColor: brand.color }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </footer>

      {/* --- 5. THE FAQ DRAWER (MODAL) --- */}
      {isFaqOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          
          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setIsFaqOpen(false)} />
          
          {/* Drawer Content */}
          <div className="bg-white rounded-t-[2rem] shadow-2xl p-6 pb-10 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Concierge Menu</h2>
                <p className="text-sm text-slate-500">Tap a question to ask instantly</p>
              </div>
              <button 
                onClick={() => setIsFaqOpen(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              {FAQ_CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <cat.icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{cat.title}</span>
                  </div>
                  <div className="space-y-2">
                    {cat.questions.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 flex justify-between items-center group active:scale-[0.98]"
                      >
                        <span className="text-slate-700 font-medium text-sm">{q}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
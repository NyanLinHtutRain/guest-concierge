'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { sendMessage } from '@/app/actions'
import { Wifi, Thermometer, Info, Send, Loader2 } from 'lucide-react' // <--- Changed Thermostat to Thermometer

type Message = { id: string; role: 'user' | 'model'; content: string }

export default function RoomChatPage() {
  const params = useParams()
  const roomId = params.roomId as string 

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', content: 'Welcome! I am your digital concierge. How can I help you today?' }
  ])
  
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) 
  }, [messages])

  async function handleSend(text: string) {
    if (!text.trim() || isLoading) return
    
    // Generate ID safely
    const tempId = crypto.randomUUID() // <--- Fixed "impure function" error
    
    // 1. Optimistic Update
    const userMsg: Message = { id: tempId, role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // 2. Server Action
    const { response } = await sendMessage(roomId, text, messages)

    // 3. AI Response
    const aiId = crypto.randomUUID() // <--- Fixed here too
    const aiMsg: Message = { id: aiId, role: 'model', content: response }
    setMessages(prev => [...prev, aiMsg])
    setIsLoading(false)
  }

  const quickActions = [
    { icon: Wifi, label: 'Wifi', prompt: 'What is the wifi password?' },
    { icon: Thermometer, label: 'AC', prompt: 'How do I use the AC?' }, // <--- Updated Icon
    { icon: Info, label: 'Tips', prompt: 'What are some local tips?' },
  ]

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <header className="flex-none bg-white p-4 border-b flex justify-between items-center z-10 shadow-sm">
        <div>
          <h1 className="font-bold text-slate-900 capitalize">{roomId.replace('-', ' ')}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">Concierge Online</span>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        
        {/* Quick Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button 
              key={action.label}
              onClick={() => handleSend(action.prompt)}
              className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-slate-100"
            >
              <action.icon className="w-5 h-5 text-slate-700" />
              <span className="text-xs font-semibold text-slate-600">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="space-y-4 pb-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-black text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
              }`}>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-slate-50 border px-4 py-3 rounded-2xl rounded-tl-none">
                 <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
               </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 bg-white border-t border-slate-100 z-10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex gap-2 relative"
        >
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-100 rounded-full px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 placeholder:text-slate-400"
          />
          <button 
            type="submit"
            aria-label="Send Message" 
            disabled={isLoading || !input.trim()} 
            className="absolute right-2 top-1.5 bg-black text-white p-2 rounded-full hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}
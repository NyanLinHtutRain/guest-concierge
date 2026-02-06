'use client'

import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '@/app/actions'
import { Wifi, Thermometer, Info, Send, Loader2, MapPin } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = { id: string; role: 'user' | 'model'; content: string }

export default function ChatClient({ roomId, roomName }: { roomId: string, roomName: string }) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', content: `Welcome to **${roomName}**! I am your digital concierge. How can I help you today?` }
  ])
  
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) 
  }, [messages])

  async function handleSend(text: string) {
    if (!text.trim() || isLoading) return
    
    const tempId = crypto.randomUUID()
    const userMsg: Message = { id: tempId, role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const result = await sendMessage(roomId, text, messages)
      if (!result.success) throw new Error(result.response)

      const aiId = crypto.randomUUID()
      const aiMsg: Message = { id: aiId, role: 'model', content: result.response }
      setMessages(prev => [...prev, aiMsg])

    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', content: "⚠️ System Offline: Please refresh." }])
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    { icon: Wifi, label: 'Wifi', prompt: 'What is the wifi password?' },
    { icon: Thermometer, label: 'AC', prompt: 'How do I use the AC?' },
    { icon: Info, label: 'Food', prompt: 'What are the top 3 food recommendations nearby?' },
  ]

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <header className="flex-none bg-white p-4 border-b flex justify-between items-center z-10 shadow-sm">
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-tight">{roomName}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">Concierge Online</span>
          </div>
        </div>
      </header>

      {/* Main Chat */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button key={action.label} onClick={() => handleSend(action.prompt)} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-slate-100">
              <action.icon className="w-5 h-5 text-slate-700" />
              <span className="text-xs font-semibold text-slate-600">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 pb-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
              }`}>
                {m.role === 'user' ? (
                   <span>{m.content}</span>
                ) : (
                  // FIX 1: Wrapped ReactMarkdown in a div to handle the "className"
                  <div className="markdown-container space-y-3">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" className="text-blue-600 underline font-bold flex items-center gap-1 inline-flex"><MapPin className="w-3 h-3" />{props.children}</a>,
                        ul: ({node, ...props}) => <ul {...props} className="list-disc pl-4 space-y-1" />,
                        ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-4 space-y-1" />,
                        strong: ({node, ...props}) => <strong {...props} className="font-bold text-slate-900" />,
                        p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />
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
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex gap-2 relative">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-100 text-slate-900 rounded-full px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 placeholder:text-slate-400"
          />
          {/* FIX 2: Made disabled logic explicit (check length === 0) */}
          <button 
            type="submit" 
            disabled={isLoading || input.trim().length === 0} 
            className="absolute right-2 top-1.5 bg-black text-white p-2 rounded-full hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}
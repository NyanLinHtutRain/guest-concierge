'use server'

import { supabase } from '@/utils/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// 1. Define the Type (This fixes the "any" error)
type Message = {
  role: string
  content: string
  id?: string // Optional, but helps if passed from frontend
}

export async function sendMessage(roomId: string, message: string, history: Message[]) {
  try {
    // 2. Fetch Room Data
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('slug', roomId)
      .single()

    if (error || !room) {
      console.error("❌ ROOM ERROR:", error)
      return { success: false, response: "I couldn't find the room details." }
    }

    // 3. Clean History for Gemini
    // We map the incoming messages to the format Gemini needs
    const cleanHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    // Rule: History cannot start with a 'model' message
    if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
      cleanHistory.shift()
    }

    // 4. System Prompt
    const systemPrompt = `
      You are the Concierge for "${room.name}".
      
      [KNOWLEDGE BASE]
      - Wifi SSID: ${room.wifi_ssid}
      - Wifi Password: ${room.wifi_pass}
      - AC Instructions: ${room.ac_guide}
      - House Rules: ${room.rules}
      
      [INSTRUCTIONS]
      - Answer politely and briefly (under 50 words).
      - If you don't know, ask them to contact the host.
    `

    // 5. Call Gemini 
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // <--- The Fix
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }]
      }
    })

    const chat = model.startChat({
      history: cleanHistory
    })

    const result = await chat.sendMessage(message)
    return { success: true, response: result.response.text() }

  } catch (err) {
    console.error('AI Error:', err)
    
    let errorMessage = "Unknown error";
    if (err instanceof Error) errorMessage = err.message;

    return { success: false, response: `System Error: ${errorMessage}` }
  }
}
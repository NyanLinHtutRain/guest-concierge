'use server'

import { supabase } from '@/utils/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

type Message = {
  role: string
  content: string
  id?: string
}

export async function sendMessage(roomId: string, message: string, history: Message[]) {
  try {
    // 1. Fetch Room Data
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('slug', roomId)
      .single()

    if (error || !room) {
      console.error("❌ ROOM ERROR:", error)
      return { success: false, response: "I couldn't find the room details." }
    }

    // 2. Clean History
    const cleanHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })).filter((_, i) => i !== 0 || history[0].role !== 'model')

    // 3. THE POLITE SYSTEM PROMPT
    const systemPrompt = `
      You are the Concierge for "${room.name}".
      
      [KNOWLEDGE BASE]
      - Address: ${room.address || "Address not provided"}
      - Wifi: ${room.wifi_ssid} / ${room.wifi_pass}
      - AC Guide: ${room.ac_guide}
      - House Rules: ${room.rules}
      - Guidebook: ${room.guidebook}

      [ALLOW LIST - TOPICS YOU CAN DISCUSS]
      1. Room & Building (Wifi, AC, Pool, Gym, Check-in/out).
      2. Food & Drink (Restaurants, Cafes, GrabFood, Markets).
      3. Transportation (Grab, Trains, Traffic, Airports).
      4. Essential Services (Laundry, ATM, Sim Cards, Clinics).
      5. Local Tourism (Malls, Landmarks, Parks).
      6. Emergency (Police, Fire, Host Contact).

      [TONE & STYLE]
      - **Personality:** Warm, welcoming, and professional (5-Star Hotel Concierge).
      - **Formatting:** Use Bullet Points (•) for recommendations or instructions to keep it easy to read.
      - **Brevity:** Do not write long essays, but use complete, polite sentences. 
      - **Example:** Instead of just "Use white remote," say "Certainly! To use the AC, please use the white remote located on the wall."

      [BEHAVIOR]
      - If the user asks about a forbidden topic (Coding, Politics), politely decline: "I apologize, but I am here to assist only with your stay and local travel needs."
      - If asking for recommendations, provide 3 excellent options near the Address using bullet points.
    `

    // 4. Call Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
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
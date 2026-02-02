'use server'

import { supabase } from '@/utils/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

type Message = {
  role: string
  content: string
  id?: string
}

// --- 1. CHATBOT FUNCTION ---
export async function sendMessage(roomId: string, message: string, history: Message[]) {
  try {
    // A. Fetch Room Data
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('slug', roomId)
      .single()

    if (error || !room) {
      console.error("❌ ROOM ERROR:", error)
      return { success: false, response: "I couldn't find the room details." }
    }

    // B. Clean History
    const cleanHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })).filter((_, i) => i !== 0 || history[0].role !== 'model')

    // C. System Prompt
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

    // D. Call Gemini (Using your requested model version)
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

// --- 2. CREATE ROOM FUNCTION (UPDATED SECURITY) ---
export async function createRoom(formData: FormData) {
  'use server'
  
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const wifi_ssid = formData.get('wifi_ssid') as string
  const wifi_pass = formData.get('wifi_pass') as string
  const ac_guide = formData.get('ac_guide') as string
  const rules = formData.get('rules') as string
  
  // 🔒 SECURITY UPGRADE: Generate Random Secret Key
  // Instead of "the-loft", we generate "k92x-m4p1" so guests can't guess other rooms.
  const randomCode = Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
  const slug = randomCode;

  // Build the Guidebook
  const checkin = formData.get('checkin') as string
  const checkout = formData.get('checkout') as string
  const trash = formData.get('trash') as string
  const laundry = formData.get('laundry') as string
  const facilities = formData.get('facilities') as string
  const food = formData.get('food') as string
  
  const guidebookText = `
    CHECK-IN: ${checkin}
    CHECK-OUT: ${checkout}
    TRASH DISPOSAL: ${trash}
    LAUNDRY: ${laundry}
    FACILITIES: ${facilities}
    HOST RECOMMENDATIONS: ${food}
  `

  // Save to Supabase
  const { error } = await supabase.from('rooms').insert({
    name,       // Human name (e.g. "Room 101")
    slug,       // Secret URL (e.g. "k92x-m4p1")
    address,
    wifi_ssid,
    wifi_pass,
    ac_guide,
    rules,
    guidebook: guidebookText
  })

  if (error) {
    console.error('Error creating room:', error)
    return { success: false, message: 'Failed to create room' }
  }

  redirect('/')
}

// --- 3. UPDATE ROOM ---
export async function updateRoom(formData: FormData) {
  'use server'
  
  const slug = formData.get('slug') as string
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const wifi_ssid = formData.get('wifi_ssid') as string
  const wifi_pass = formData.get('wifi_pass') as string
  const ac_guide = formData.get('ac_guide') as string
  const rules = formData.get('rules') as string
  
  // Rebuild Guidebook
  const checkin = formData.get('checkin') as string
  const checkout = formData.get('checkout') as string
  const trash = formData.get('trash') as string
  const laundry = formData.get('laundry') as string
  const facilities = formData.get('facilities') as string
  const food = formData.get('food') as string
  
  const guidebookText = `
    CHECK-IN: ${checkin}
    CHECK-OUT: ${checkout}
    TRASH DISPOSAL: ${trash}
    LAUNDRY: ${laundry}
    FACILITIES: ${facilities}
    HOST RECOMMENDATIONS: ${food}
  `

  const { error } = await supabase
    .from('rooms')
    .update({
      name,
      address,
      wifi_ssid,
      wifi_pass,
      ac_guide,
      rules,
      guidebook: guidebookText
    })
    .eq('slug', slug)

  if (error) {
    console.error('Error updating room:', error)
    return { success: false, message: 'Failed to update' }
  }

  revalidatePath('/')
  redirect('/')
}

// --- 4. DELETE ROOM ---
export async function deleteRoom(slug: string) {
  'use server'
  
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('slug', slug)

  if (error) {
    console.error('Error deleting room:', error)
    return { success: false, message: 'Failed to delete' }
  }

  revalidatePath('/')
}
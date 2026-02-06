'use server'

import { supabaseAdmin } from '@/utils/supabase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

type Message = {
  role: string
  content: string
  id?: string
}

// --- 1. NEW: PUBLIC BRANDING FETCH ---
// This allows the Chat Page to get the design without needing the Wifi Password/Rules yet.
export async function getRoomPublicInfo(slug: string) {
  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('name, logo_url, primary_color')
    .eq('slug', slug)
    .single()
  
  return room
}

// --- 2. CHATBOT FUNCTION (Unchanged) ---
export async function sendMessage(roomId: string, message: string, history: Message[]) {
  try {
    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('slug', roomId)
      .single()

    if (error || !room) {
      console.error("❌ ROOM ERROR:", error)
      return { success: false, response: "I couldn't find the room details." }
    }

    const cleanHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })).filter((_, i) => i !== 0 || history[0].role !== 'model')

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

      [BEHAVIOR]
      - If the user asks about a forbidden topic (Coding, Politics), politely decline.
      - If asking for recommendations, provide 3 excellent options near the Address using bullet points.
    `

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }]
      }
    })

    const chat = model.startChat({ history: cleanHistory })
    const result = await chat.sendMessage(message)
    return { success: true, response: result.response.text() }

  } catch (err) {
    console.error('AI Error:', err)
    let errorMessage = "Unknown error";
    if (err instanceof Error) errorMessage = err.message;
    return { success: false, response: `System Error: ${errorMessage}` }
  }
}

// --- 3. CREATE ROOM (Updated) ---
export async function createRoom(formData: FormData) {
  'use server'
  
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const wifi_ssid = formData.get('wifi_ssid') as string
  const wifi_pass = formData.get('wifi_pass') as string
  const ac_guide = formData.get('ac_guide') as string
  const rules = formData.get('rules') as string
  
  // NEW: Get Branding Info
  const logo_url = formData.get('logo_url') as string
  const primary_color = formData.get('primary_color') as string
  
  const randomCode = Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
  const slug = randomCode;

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

  const { error } = await supabaseAdmin.from('rooms').insert({
    name,
    slug,
    address,
    wifi_ssid,
    wifi_pass,
    ac_guide,
    rules,
    logo_url,        // <--- NEW
    primary_color,   // <--- NEW
    guidebook: guidebookText
  })

  if (error) {
    console.error('Error creating room:', error)
    return { success: false, message: 'Failed to create room' }
  }

  redirect('/')
}

// --- 4. UPDATE ROOM (Updated) ---
export async function updateRoom(formData: FormData) {
  'use server'
  
  const slug = formData.get('slug') as string
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const wifi_ssid = formData.get('wifi_ssid') as string
  const wifi_pass = formData.get('wifi_pass') as string
  const ac_guide = formData.get('ac_guide') as string
  const rules = formData.get('rules') as string

  // NEW: Get Branding Info
  const logo_url = formData.get('logo_url') as string
  const primary_color = formData.get('primary_color') as string
  
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

  const { error } = await supabaseAdmin
    .from('rooms')
    .update({
      name,
      address,
      wifi_ssid,
      wifi_pass,
      ac_guide,
      rules,
      logo_url,       // <--- NEW
      primary_color,  // <--- NEW
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

export async function deleteRoom(slug: string) {
  'use server'
  const { error } = await supabaseAdmin.from('rooms').delete().eq('slug', slug)
  if (error) {
    console.error('Error deleting room:', error)
    return { success: false, message: 'Failed to delete' }
  }
  revalidatePath('/')
}
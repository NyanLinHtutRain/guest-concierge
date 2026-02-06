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

// --- HELPER: Parse "One Box" Questions into JSON ---
// Takes the single text block and creates one "Quick Questions" category
function parseFaqData(formData: FormData) {
  // 1. Get the big block of text from the single textarea
  const rawText = formData.get('faq_text') as string || ''
  
  // 2. Split by new line -> Clean up -> Filter empty lines
  const questions = rawText.split('\n').map(q => q.trim()).filter(q => q !== '')
  
  // If no questions, return empty array
  if (questions.length === 0) return []

  // 3. Return a single "Concierge Menu" category
  return [{
    title: "Quick Questions",
    icon: "HelpCircle", // Uses the default icon
    questions: questions
  }]
}

// --- 1. GET PUBLIC INFO ---
// Fetches the room design and the FAQ list for the frontend
export async function getRoomPublicInfo(slug: string) {
  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('name, logo_url, primary_color, faq_payload')
    .eq('slug', slug)
    .single()
  
  return room
}

// --- 2. CHATBOT FUNCTION ---
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
      
      [KNOWLEDGE BASE - USE THIS TO ANSWER]
      - Address: ${room.address || "Address not provided"}
      - Wifi: ${room.wifi_ssid} / ${room.wifi_pass}
      - AC Guide: ${room.ac_guide}
      - House Rules: ${room.rules}
      
      [FULL HANDBOOK & DETAILS]
      ${room.guidebook}

      [ALLOW LIST]
      1. Room & Building (Wifi, AC, Pool, Gym, Check-in/out).
      2. Food & Drink (Restaurants, Cafes, GrabFood, Markets).
      3. Transportation (Grab, Trains, Traffic, Airports).
      4. Essential Services (Laundry, ATM, Sim Cards, Clinics).
      5. Local Tourism (Malls, Landmarks, Parks).
      6. Emergency (Police, Fire, Host Contact).

      [TONE & STYLE]
      - **Personality:** Warm, welcoming, and professional (5-Star Hotel Concierge).
      - **Formatting:** Use Bullet Points (•) for recommendations.
      - **Brevity:** Short, polite sentences.

      [BEHAVIOR]
      - If the answer is in the Knowledge Base, give it.
      - If the answer is NOT in the Knowledge Base, say "Please contact the host for this information."
      - If asking for recommendations, provide 3 excellent options near the Address.
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
  const logo_url = formData.get('logo_url') as string
  const primary_color = formData.get('primary_color') as string
  
  const randomCode = Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
  const slug = randomCode;

  // UPDATED: Using 'other_info' instead of food/host recommendations
  const guidebookText = `
    CHECK-IN: ${formData.get('checkin')}
    CHECK-OUT: ${formData.get('checkout')}
    TRASH DISPOSAL: ${formData.get('trash')}
    LAUNDRY: ${formData.get('laundry')}
    FACILITIES: ${formData.get('facilities')}
    OTHER INFO: ${formData.get('other_info')} 
  `

  // Process the Menu Buttons from the single text box
  const faq_payload = parseFaqData(formData)

  const { error } = await supabaseAdmin.from('rooms').insert({
    name,
    slug,
    address,
    wifi_ssid,
    wifi_pass,
    ac_guide,
    rules,
    logo_url,
    primary_color,
    guidebook: guidebookText,
    faq_payload // <--- SAVE TO DB
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
  
  // UPDATED: Using 'other_info' instead of food/host recommendations
  const guidebookText = `
    CHECK-IN: ${formData.get('checkin')}
    CHECK-OUT: ${formData.get('checkout')}
    TRASH DISPOSAL: ${formData.get('trash')}
    LAUNDRY: ${formData.get('laundry')}
    FACILITIES: ${formData.get('facilities')}
    OTHER INFO: ${formData.get('other_info')}
  `

  // Process the Menu Buttons from the single text box
  const faq_payload = parseFaqData(formData)

  const { error } = await supabaseAdmin
    .from('rooms')
    .update({
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      wifi_ssid: formData.get('wifi_ssid') as string,
      wifi_pass: formData.get('wifi_pass') as string,
      ac_guide: formData.get('ac_guide') as string,
      rules: formData.get('rules') as string,
      logo_url: formData.get('logo_url') as string,
      primary_color: formData.get('primary_color') as string,
      guidebook: guidebookText,
      faq_payload // <--- UPDATE DB
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
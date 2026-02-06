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
function parseFaqData(formData: FormData) {
  const rawText = formData.get('faq_text') as string || ''
  const questions = rawText.split('\n').map(q => q.trim()).filter(q => q !== '')
  
  if (questions.length === 0) return []

  return [{
    title: "Quick Questions",
    icon: "HelpCircle", 
    questions: questions
  }]
}

// --- 1. GET PUBLIC INFO ---
export async function getRoomPublicInfo(slug: string) {
  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('name, logo_url, primary_color, faq_payload')
    .eq('slug', slug)
    .single()
  
  return room
}

// --- 2. CHATBOT FUNCTION (UPDATED INTELLIGENCE) ---
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

    // --- NEW "SMART HYBRID" PROMPT ---
    const systemPrompt = `
      You are the Concierge for "${room.name}".
      
      [YOUR KNOWLEDGE BASE - PRIORITY #1]
      - Address: ${room.address || "Address not provided"}
      - Wifi: ${room.wifi_ssid} / ${room.wifi_pass}
      - AC Guide: ${room.ac_guide}
      - House Rules: ${room.rules}
      
      [HANDBOOK & DETAILS - PRIORITY #2]
      ${room.guidebook}

      [OPERATING INSTRUCTIONS]
      1. **Property Questions:** If the user asks about the room (keys, wifi, inventory, appliances), check the KNOWLEDGE BASE first. 
         - If the info is there -> Answer it.
         - If the info is MISSING -> Do NOT guess. Say: "I don't have that specific detail in my handbook, please reach out to the host directly."

      2. **General & Local Questions:** If the user asks about things NOT in the handbook (e.g., "How to cook pasta?", "Nearest pharmacy?", "Weather?"), USE YOUR OWN AI KNOWLEDGE.
         - You know the Property Address is: ${room.address}. Use this to recommend real nearby places if they ask.
         - Be helpful! Act like a smart local friend.

      3. **Tone:** Warm, professional, 5-Star Hotel Concierge. Helpful but concise.

      [DISALLOW LIST - DO NOT DISCUSS]
      - Politics or Religion (Politely change subject).
      - Illegal activities.
      - Sexual or NSFW content.
      - Coding/Programming help (Say "I am a hotel concierge, I can't help with code").
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

// --- 3. CREATE ROOM ---
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

  const guidebookText = `
    CHECK-IN: ${formData.get('checkin')}
    CHECK-OUT: ${formData.get('checkout')}
    TRASH DISPOSAL: ${formData.get('trash')}
    LAUNDRY: ${formData.get('laundry')}
    FACILITIES: ${formData.get('facilities')}
    OTHER INFO: ${formData.get('other_info')} 
  `

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
    faq_payload
  })

  if (error) {
    console.error('Error creating room:', error)
    return { success: false, message: 'Failed to create room' }
  }

  redirect('/')
}

// --- 4. UPDATE ROOM ---
export async function updateRoom(formData: FormData) {
  'use server'
  
  const slug = formData.get('slug') as string
  
  const guidebookText = `
    CHECK-IN: ${formData.get('checkin')}
    CHECK-OUT: ${formData.get('checkout')}
    TRASH DISPOSAL: ${formData.get('trash')}
    LAUNDRY: ${formData.get('laundry')}
    FACILITIES: ${formData.get('facilities')}
    OTHER INFO: ${formData.get('other_info')}
  `

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
      faq_payload
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
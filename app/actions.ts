'use server'

import { supabaseAdmin } from '@/utils/supabase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod' // NEW: Validation Library
import crypto from 'crypto' // NEW: Native Crypto for secure slugs

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// --- SCHEMAS (Input Validation) ---
const RoomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  wifi_ssid: z.string().min(1, "Wifi Name is required"),
  wifi_pass: z.string().min(1, "Wifi Password is required"),
  checkin: z.string().optional(),
  checkout: z.string().optional(),
  ac_guide: z.string().optional(),
  rules: z.string().optional(),
  trash: z.string().optional(),
  laundry: z.string().optional(),
  facilities: z.string().optional(),
  food: z.string().optional(),
  // For update only
  slug: z.string().optional(),
})

// --- HELPER: Secure Slug Generator ---
// Generates format like: "kx92-m2p1" (Cryptographically secure)
function generateSecureSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomBytes = crypto.randomBytes(8)
  let result = ''
  
  // Create two groups of 4 chars
  for (let i = 0; i < 8; i++) {
    const index = randomBytes[i] % chars.length
    result += chars[index]
    if (i === 3) result += '-'
  }
  return result
}

type Message = {
  role: string
  content: string
  id?: string
}

// --- 1. CHATBOT FUNCTION ---
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
      - **Formatting:** Use Bullet Points (•) for recommendations or instructions.
      - **Brevity:** Do not write long essays, but use complete, polite sentences. 

      [BEHAVIOR]
      - If the user asks about a forbidden topic (Coding, Politics), politely decline.
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

// --- 2. CREATE ROOM FUNCTION ---
export async function createRoom(formData: FormData) {
  'use server'
  
  // A. VALIDATION: Parse and validate inputs using Zod
  const rawData = Object.fromEntries(formData.entries())
  const validation = RoomSchema.safeParse(rawData)

  if (!validation.success) {
    console.error("Validation Failed:", validation.error.flatten())
    return { success: false, message: 'Invalid input data' }
  }

  const data = validation.data
  
  // B. SECURE SLUG: Use crypto instead of Math.random
  const slug = generateSecureSlug()

  // Construct the guidebook text blob
  const guidebookText = `
    CHECK-IN: ${data.checkin}
    CHECK-OUT: ${data.checkout}
    TRASH DISPOSAL: ${data.trash}
    LAUNDRY: ${data.laundry}
    FACILITIES: ${data.facilities}
    HOST RECOMMENDATIONS: ${data.food}
  `

  const { error } = await supabaseAdmin.from('rooms').insert({
    name: data.name,
    slug,
    address: data.address,
    wifi_ssid: data.wifi_ssid,
    wifi_pass: data.wifi_pass,
    ac_guide: data.ac_guide,
    rules: data.rules,
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
  
  const rawData = Object.fromEntries(formData.entries())
  const validation = RoomSchema.safeParse(rawData)

  if (!validation.success || !rawData.slug) {
    console.error("Validation Failed:", validation.error?.flatten())
    return { success: false, message: 'Invalid input data' }
  }

  const data = validation.data
  const slug = rawData.slug as string // Slug is passed via hidden field

  const guidebookText = `
    CHECK-IN: ${data.checkin}
    CHECK-OUT: ${data.checkout}
    TRASH DISPOSAL: ${data.trash}
    LAUNDRY: ${data.laundry}
    FACILITIES: ${data.facilities}
    HOST RECOMMENDATIONS: ${data.food}
  `

  const { error } = await supabaseAdmin
    .from('rooms')
    .update({
      name: data.name,
      address: data.address,
      wifi_ssid: data.wifi_ssid,
      wifi_pass: data.wifi_pass,
      ac_guide: data.ac_guide,
      rules: data.rules,
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
  
  const { error } = await supabaseAdmin
    .from('rooms')
    .delete()
    .eq('slug', slug)

  if (error) {
    console.error('Error deleting room:', error)
    return { success: false, message: 'Failed to delete' }
  }

  revalidatePath('/')
}
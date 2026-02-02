import { supabase } from '@/utils/supabase'
import { updateRoom } from '@/app/actions'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { redirect } from 'next/navigation'

// 1. Update the Type Definition: params is now a Promise
type Props = {
  params: Promise<{ slug: string }>
}

export default async function EditRoomPage({ params }: Props) {
  // 2. AWAIT the params to get the slug
  const { slug } = await params

  // 3. Fetch the existing data using the awaited slug
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!room) redirect('/')

  // Helper to extract data from the big guidebook text
  const getGuideVal = (key: string) => {
    const match = room.guidebook?.match(new RegExp(`${key}: (.*)`))
    return match ? match[1] : ''
  }

  // Wrapper function to satisfy TypeScript
  async function handleSave(formData: FormData) {
    'use server'
    await updateRoom(formData)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full border border-slate-300 hover:bg-slate-100 text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Edit Property</h1>
        </div>

        <form action={handleSave} className="space-y-8 pb-20">
          
          {/* HIDDEN FIELD: Sends the slug so we know which room to update */}
          <input type="hidden" name="slug" value={room.slug} />

          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">1. Basic Info</h2>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Property Name</label>
              <input 
                name="name" 
                type="text" 
                defaultValue={room.name} 
                required 
                className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Address</label>
              <input 
                name="address" 
                type="text" 
                defaultValue={room.address} 
                required 
                className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">2. Tech Specs</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Wifi Name</label>
                <input 
                  name="wifi_ssid" 
                  type="text" 
                  defaultValue={room.wifi_ssid} 
                  required 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Wifi Pass</label>
                <input 
                  name="wifi_pass" 
                  type="text" 
                  defaultValue={room.wifi_pass} 
                  required 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Check-In</label>
                <input 
                  name="checkin" 
                  type="text" 
                  defaultValue={getGuideVal('CHECK-IN')} 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Check-Out</label>
                <input 
                  name="checkout" 
                  type="text" 
                  defaultValue={getGuideVal('CHECK-OUT')} 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">3. House Guide</h2>
             <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">AC Guide</label>
              <input 
                name="ac_guide" 
                type="text" 
                defaultValue={room.ac_guide} 
                className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">House Rules</label>
              <textarea 
                name="rules" 
                defaultValue={room.rules} 
                className="w-full p-3 border border-slate-300 rounded-lg h-20 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Trash</label>
                <input 
                  name="trash" 
                  type="text" 
                  defaultValue={getGuideVal('TRASH DISPOSAL')} 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
               <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Laundry</label>
                <input 
                  name="laundry" 
                  type="text" 
                  defaultValue={getGuideVal('LAUNDRY')} 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
            </div>
             <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Facilities</label>
                <input 
                  name="facilities" 
                  type="text" 
                  defaultValue={getGuideVal('FACILITIES')} 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Host Recommendations</label>
                <textarea 
                  name="food" 
                  defaultValue={getGuideVal('HOST RECOMMENDATIONS')} 
                  className="w-full p-3 border border-slate-300 rounded-lg h-24 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
          </div>

          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}
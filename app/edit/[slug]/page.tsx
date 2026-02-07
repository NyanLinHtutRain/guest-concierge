/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/utils/supabase-admin'
import { updateRoom, addGalleryItem, deleteGalleryItem } from '@/app/actions'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function EditRoomPage({ params }: Props) {
  const { slug } = await params

  // Fetch Data
  const { data: roomData } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('slug', slug)
    .single()

  const room = roomData as any

  if (!room) redirect('/')

  // Helper to extract data from the big guidebook text
  const getGuideVal = (key: string) => {
    // Escaping special characters for regex safety might be needed for some keys, 
    // but works fine for simple keys like "OTHER INFO"
    const match = room.guidebook?.match(new RegExp(`${key}: (.*)`))
    return match ? match[1] : ''
  }

  // UPDATED HELPER: Flatten ALL questions from ALL categories into one string
  const getAllQuestions = () => {
    if (!room.faq_payload || !Array.isArray(room.faq_payload)) return ''
    
    // 1. Map through each category and get its 'questions' array
    const allQs = room.faq_payload.flatMap((cat: any) => cat.questions || [])
    
    // 2. Join them with new lines
    return allQs.join('\n')
  }

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

        {/* --- MAIN FORM --- */}
        <form action={handleSave} className="space-y-8 pb-10">
          
          <input type="hidden" name="slug" value={room.slug} />

          {/* Section 1: Basic Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">1. Basic Info</h2>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Property Name</label>
              <input name="name" type="text" defaultValue={room.name} required className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Address</label>
              <input name="address" type="text" defaultValue={room.address} required className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
            </div>
          </div>

          {/* Section 2: Access */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">2. Access & Wifi</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Wifi Name</label>
                <input name="wifi_ssid" type="text" defaultValue={room.wifi_ssid} required className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Wifi Pass</label>
                <input name="wifi_pass" type="text" defaultValue={room.wifi_pass} required className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Check-In</label>
                <input name="checkin" type="text" defaultValue={getGuideVal('CHECK-IN')} className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Check-Out</label>
                <input name="checkout" type="text" defaultValue={getGuideVal('CHECK-OUT')} className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
              </div>
            </div>
          </div>

          {/* Section 3: House Guide */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">3. House Guide</h2>
             <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">AC Guide</label>
              <input name="ac_guide" type="text" defaultValue={room.ac_guide} className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">House Rules</label>
              <textarea name="rules" defaultValue={room.rules} className="w-full p-3 border border-slate-300 rounded-lg h-20 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Trash</label>
                <input name="trash" type="text" defaultValue={getGuideVal('TRASH DISPOSAL')} className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
              </div>
               <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Laundry</label>
                <input name="laundry" type="text" defaultValue={getGuideVal('LAUNDRY')} className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
              </div>
            </div>
             <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Facilities</label>
                <input name="facilities" type="text" defaultValue={getGuideVal('FACILITIES')} className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
              </div>

              {/* UPDATED SECTION 4: OTHER INFO */}
              <div className="pt-4 border-t border-slate-100 mt-4">
                <label className="block text-sm font-bold text-slate-900 mb-1">Other Guides & Handbook Info</label>
                <textarea 
                  name="other_info" 
                  defaultValue={getGuideVal('OTHER INFO')} 
                  className="w-full p-3 border border-slate-300 rounded-lg h-32 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" 
                />
              </div>
          </div>

          {/* Section 5: Branding */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">5. Branding</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input name="primary_color" type="color" defaultValue={room.primary_color || '#000000'} className="h-10 w-20 cursor-pointer border border-slate-300 rounded overflow-hidden" />
                  <span className="text-xs text-slate-500">Click to pick color</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Logo URL</label>
                <input name="logo_url" type="url" defaultValue={room.logo_url || ''} className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-black/10" />
              </div>
            </div>
          </div>

          {/* Section 6: ONE BOX QUESTIONS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">6. Concierge Menu (The Questions)</h2>
            <p className="text-sm text-slate-500">Paste your questions here (One per line).</p>
            <textarea 
              name="faq_text" 
              defaultValue={getAllQuestions()} 
              placeholder="What is the wifi password?&#10;How do I use the AC?" 
              className="w-full p-3 border border-slate-300 rounded-lg h-64 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 outline-none" 
            />
          </div>

          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </form>

        {/* --- NEW SECTION 7: VISUAL INSTRUCTIONS --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6 mb-20">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <ImageIcon className="w-5 h-5 text-slate-900" />
                <h2 className="font-bold text-lg text-slate-900">7. Visual Instructions</h2>
            </div>
            
            <p className="text-sm text-slate-500">Upload photos for things like &quot;Heater&quot;, &quot;Remote&quot;, or &quot;Washing Machine&quot;. The AI will show them when asked.</p>

            {/* UPLOAD FORM */}
            <form action={async (formData: FormData) => {
                'use server'
                await addGalleryItem(formData)
            }} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="hidden" name="slug" value={room.slug} />
                
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Label (e.g. &quot;Washing Machine&quot;)</label>
                    <input 
                        name="label" 
                        type="text" 
                        required 
                        placeholder="e.g. Heater Remote"
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm" 
                    />
                </div>
                
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Photo</label>
                    <input 
                        name="file" 
                        type="file" 
                        accept="image/*"
                        required 
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" 
                    />
                </div>

                <button type="submit" className="bg-slate-900 text-white p-2.5 rounded-lg hover:bg-black transition-colors flex items-center gap-2 text-sm font-bold">
                    <Upload className="w-4 h-4" />
                    Upload
                </button>
            </form>

            {/* GALLERY GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.gallery_payload?.map((item: any) => (
                    <div key={item.id} className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.label} className="w-full h-32 object-cover" />
                        <div className="p-2 bg-white border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.label}</p>
                        </div>
                        
                        {/* DELETE BUTTON */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <form action={async () => {
                                'use server'
                                await deleteGalleryItem(room.slug, item.id)
                            }}>
                                <button className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
                
                {(!room.gallery_payload || room.gallery_payload.length === 0) && (
                    <div className="col-span-full text-center py-8 text-slate-400 text-sm italic">
                        No photos uploaded yet.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
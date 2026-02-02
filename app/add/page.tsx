'use client'

import { createRoom } from '@/app/actions'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function AddRoomPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full border border-slate-300 hover:bg-slate-100 text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Add New Property</h1>
        </div>

        <form 
          action={async (formData) => {
            await createRoom(formData)
          }} 
          className="space-y-8 pb-20"
        >          
          {/* Section 1: The Basics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">1. Basic Info</h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Property Name (This will be your link)</label>
              <input 
                name="name" 
                type="text" 
                required 
                placeholder="e.g. The Loft at KL Sentral" 
                className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
              <p className="text-xs text-slate-500 mt-1">Will become: .../the-loft-at-kl-sentral</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Full Address (For Maps)</label>
              <input 
                name="address" 
                type="text" 
                required 
                placeholder="e.g. D'IVOz Residences, Old Klang Road, 58000 KL" 
                className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
            </div>
          </div>

          {/* Section 2: Tech Specs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">2. Access & Wifi</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Wifi Name</label>
                <input 
                  name="wifi_ssid" 
                  type="text" 
                  required 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Wifi Password</label>
                <input 
                  name="wifi_pass" 
                  type="text" 
                  required 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Check-In Time</label>
                <input 
                  name="checkin" 
                  type="text" 
                  placeholder="3:00 PM" 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Check-Out Time</label>
                <input 
                  name="checkout" 
                  type="text" 
                  placeholder="11:00 AM" 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: The Guidebook */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">3. House Guide</h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">How to use AC?</label>
              <input 
                name="ac_guide" 
                type="text" 
                placeholder="Use white remote..." 
                className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
            </div>

             <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">House Rules</label>
              <textarea 
                name="rules" 
                placeholder="No smoking, Quiet hours after 10pm..." 
                className="w-full p-3 border border-slate-300 rounded-lg h-20 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Trash Disposal</label>
                <input 
                  name="trash" 
                  type="text" 
                  placeholder="Room near the lift..." 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
               <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Laundry Info</label>
                <input 
                  name="laundry" 
                  type="text" 
                  placeholder="Washer in kitchen..." 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
            </div>
             <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Gym / Pool Info</label>
                <input 
                  name="facilities" 
                  type="text" 
                  placeholder="Level 5, use access card..." 
                  className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
                />
              </div>
          </div>

          {/* Section 4: Recommendations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b border-slate-200 pb-2 text-slate-900">4. Host Favorites</h2>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Top 3 Food Spots (Optional)</label>
              <textarea 
                name="food" 
                placeholder="1. Nasi Lemak Village&#10;2. Bean Brothers Cafe&#10;3. Al-Safa Curry House" 
                className="w-full p-3 border border-slate-300 rounded-lg h-24 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-black/10 focus:border-slate-900 outline-none" 
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            <Save className="w-5 h-5" />
            Create Property
          </button>

        </form>
      </div>
    </div>
  )
}
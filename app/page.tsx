import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Wifi, MapPin, QrCode, ExternalLink, ShieldCheck } from "lucide-react";

// 1. Fetch data on the server
async function getRooms() {
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("*")
    .order("name");
    
  if (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }
  return rooms || [];
}

export default async function AdminDashboard() {
  const rooms = await getRooms();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Navbar */}
      <nav className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-green-400" />
          <h1 className="font-bold text-lg tracking-wide">Concierge Admin</h1>
        </div>
        <div className="text-xs text-slate-400">
          v1.0 • {rooms.length} Rooms Active
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-slate-500 mt-1">Manage your properties and guest access.</p>
          </div>
          <a 
            href="https://supabase.com/dashboard/project/mroasbwuhxhfsnkzuawc/editor/29654"
            target="_blank"
            className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            + Add New Room
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Rooms</h3>
            <p className="text-4xl font-extrabold mt-2">{rooms.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">System Status</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-xl font-bold">Operational</p>
            </div>
          </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Database</h3>
            <p className="text-xl font-bold mt-2 text-blue-600">Supabase Connected</p>
          </div>
        </div>

        {/* Rooms List */}
        <div>
          <h3 className="text-lg font-bold mb-4">Your Rooms</h3>
          
          {rooms.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500">No rooms found. Go to Supabase to add one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
                  
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{room.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="font-mono">/{room.slug}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-slate-400">
                      <Wifi className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <div className="text-sm">
                      <span className="text-slate-400 text-xs uppercase font-bold">Wifi Pass:</span>
                      <p className="font-mono bg-slate-100 inline-block px-2 py-1 rounded ml-2 text-slate-700">{room.wifi_pass}</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                      <Link 
                        href={`/${room.slug}`} 
                        className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Test Chat
                      </Link>
                      <a 
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://guest-concierge.vercel.app/${room.slug}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                      >
                        <QrCode className="w-3 h-3" />
                        Get QR
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
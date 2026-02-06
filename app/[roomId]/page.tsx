import { supabaseAdmin } from '@/utils/supabase-admin'
import { notFound } from 'next/navigation'
import ChatClient from './ChatClient' // Imports the file we just made

// 1. Define Props (params is a Promise in Next.js 15)
type Props = {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params

  // 2. Fetch the Room Name securely on the server
  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('name')
    .eq('slug', roomId)
    .single()

  // If no room found, show 404
  if (!room) {
    notFound()
  }

  // 3. Render the Client Component with the correct Name
  return <ChatClient roomId={roomId} roomName={room.name} />
}
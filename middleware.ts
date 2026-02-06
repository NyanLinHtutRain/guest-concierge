import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // 1. Define the protected routes (Admin Dashboard & Add Room)
  const protectedPaths = ['/', '/add']
  const isProtected = protectedPaths.some(path => req.nextUrl.pathname === path)

  // If it's a public room (e.g. /room-101), let them pass immediately
  if (!isProtected) {
    return NextResponse.next()
  }

  // 2. CHECK FOR "TRUSTED DEVICE" COOKIE
  // If we find this cookie, we skip the password check entirely.
  const trustCookie = req.cookies.get('admin_trust')
  if (trustCookie?.value === 'true') {
    return NextResponse.next()
  }

  // 3. IF NO COOKIE, ASK FOR PASSWORD (Basic Auth)
  const basicAuth = req.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    // FIX: Load credentials from Environment Variables
    // If variables aren't set, this defaults to empty strings to prevent accidental access
    const adminUser = process.env.ADMIN_USER
    const adminPass = process.env.ADMIN_PASSWORD

    if (adminUser && adminPass && user === adminUser && pwd === adminPass) {
      // Password Correct! 
      // We create the response allowing them in...
      const response = NextResponse.next()
      
      // ...BUT we also attach a 30-Day "Trust Cookie" so they don't have to login again.
      response.cookies.set('admin_trust', 'true', { 
        maxAge: 60 * 60 * 24 * 30, // 30 Days in seconds
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      return response
    }
  }

  // 4. If no password or wrong password, show the login box
  return new NextResponse('Auth Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}

// Only run this on the main routes
export const config = {
  matcher: ['/', '/add'],
}
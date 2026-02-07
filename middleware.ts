import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // 1. CHECK FOR "TRUSTED DEVICE" COOKIE
  // If we find this cookie, we skip the password check entirely.
  const trustCookie = req.cookies.get('admin_trust')
  if (trustCookie?.value === 'true') {
    return NextResponse.next()
  }

  // 2. IF NO COOKIE, ASK FOR PASSWORD (Basic Auth)
  const basicAuth = req.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    // Load credentials from Environment Variables
    const adminUser = process.env.ADMIN_USER
    const adminPass = process.env.ADMIN_PASSWORD

    if (adminUser && adminPass && user === adminUser && pwd === adminPass) {
      // Password Correct! 
      const response = NextResponse.next()
      
      // Attach a 30-Day "Trust Cookie"
      response.cookies.set('admin_trust', 'true', { 
        maxAge: 60 * 60 * 24 * 30, // 30 Days
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      return response
    }
  }

  // 3. If no password or wrong password, show the login box
  return new NextResponse('Auth Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}

// THE GATEKEEPER CONFIG
// This Middleware ONLY runs on these paths.
// All other paths (like /my-room-slug) are ignored and stay Public.
export const config = {
  matcher: [
    '/', 
    '/add', 
    '/edit/:path*' // This protects /edit AND /edit/anything
  ],
}
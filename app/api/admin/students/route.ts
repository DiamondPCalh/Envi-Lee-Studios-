// app/api/admin/students/route.ts
// Manages the academy student whitelist
// Only accessible by the admin (you)

import { NextRequest, NextResponse } from 'next/server'

// Your Clerk user ID — this is YOU, the admin
// Get it from clerk.com → Users → click your account → copy the User ID
const ADMIN_USER_ID = process.env.ADMIN_USER_ID ?? ''

// We store students in Vercel environment as a simple JSON list
// For production upgrade to Vercel KV or a database

function getStudents(): string[] {
  try {
    const list = process.env.ACADEMY_STUDENTS ?? '[]'
    return JSON.parse(list)
  } catch {
    return []
  }
}

// GET — check if an email has free access
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ access: false })

  const students = getStudents()
  const access = students.includes(email.toLowerCase().trim())
  return NextResponse.json({ access })
}

// POST — add a student (admin only)
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (userId !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const students = getStudents()
  const normalized = email.toLowerCase().trim()

  if (!students.includes(normalized)) {
    students.push(normalized)
  }

  // Note: To persist this properly, use Vercel KV
  // For now we return the updated list and you update ACADEMY_STUDENTS env var
  return NextResponse.json({
    success: true,
    students,
    message: 'Student added. Update ACADEMY_STUDENTS in Vercel env vars to persist.'
  })
}

// DELETE — remove a student (admin only)
export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (userId !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const students = getStudents()
  const normalized = email.toLowerCase().trim()
  const updated = students.filter(s => s !== normalized)

  return NextResponse.json({
    success: true,
    students: updated,
    message: 'Student removed. Update ACADEMY_STUDENTS in Vercel env vars to persist.'
  })
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Get userId from query param — passed from client
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ hasAccess: false })

  const adminId = process.env.ADMIN_USER_ID
  if (userId === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

  const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    const accessRes = await fetch(`${redisUrl}/get/prompts_access_${userId}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
    const accessData = await accessRes.json()
    if (accessData.result === 'true' || accessData.result === '1') {
      return NextResponse.json({ hasAccess: true, role: 'subscriber' })
    }
  }

  return NextResponse.json({ hasAccess: false })
}

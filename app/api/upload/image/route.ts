// app/api/upload/image/route.ts
// Uploads images to Cloudinary and returns a permanent public URL
// Used by POD Studios, AI Studios, and any other app that needs public image URLs

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, folder, fileName } = await req.json()

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ 
        error: 'Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Vercel.' 
      }, { status: 500 })
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })
    }

    // Generate signature for signed upload
    const timestamp = Math.round(Date.now() / 1000)
    const uploadFolder = folder || 'envi-lee-studios'
    
    // Create signature string
    const crypto = await import('crypto')
    const sigString = `folder=${uploadFolder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(sigString).digest('hex')

    // Build form data
    const formData = new FormData()
    formData.append('file', imageBase64)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    formData.append('folder', uploadFolder)
    if (fileName) {
      formData.append('public_id', fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-'))
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json() as {
      secure_url?: string
      url?: string
      public_id?: string
      error?: { message?: string }
    }

    if (!res.ok || !data.secure_url) {
      return NextResponse.json({ 
        error: 'Cloudinary upload failed: ' + (data.error?.message || JSON.stringify(data)) 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imageUrl: data.secure_url,
      publicId: data.public_id,
    })

  } catch (err) {
    console.error('[/api/upload/image]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  return NextResponse.json({ 
    status: cloudName ? 'Cloudinary configured' : 'Cloudinary NOT configured',
    configured: !!cloudName 
  })
}

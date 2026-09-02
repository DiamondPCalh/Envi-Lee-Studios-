// app/api/upload/image/route.ts
// Unsigned Cloudinary upload — no signature needed, just cloud name + upload preset
// Used by: POD Studios, AI Studios, Video Generator, Lip Sync Studio

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, folder, fileName } = await req.json()

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default'

    if (!cloudName) {
      return NextResponse.json({ error: 'CLOUDINARY_CLOUD_NAME not configured in Vercel' }, { status: 500 })
    }
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })
    }

    // Detect resource type from base64 header
    const isVideo = imageBase64.startsWith('data:video')
    const isAudio = imageBase64.startsWith('data:audio')
    const resourceType = (isVideo || isAudio) ? 'video' : 'image'

    // Unsigned upload — no signature needed
    const formData = new FormData()
    formData.append('file', imageBase64)
    formData.append('upload_preset', uploadPreset)
    if (folder) formData.append('folder', folder)
    if (fileName) {
      const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-')
      formData.append('public_id', cleanName)
    }

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    )

    const data = await res.json() as {
      secure_url?: string
      public_id?: string
      error?: { message?: string }
    }

    if (!res.ok || !data.secure_url) {
      return NextResponse.json({
        error: 'Upload failed: ' + (data.error?.message || JSON.stringify(data))
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
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default'
  return NextResponse.json({
    status: cloudName ? 'Cloudinary configured ✓' : 'CLOUDINARY_CLOUD_NAME not set',
    cloudName: cloudName || 'missing',
    uploadPreset: preset,
    configured: !!cloudName,
  })
}

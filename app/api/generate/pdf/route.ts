// app/api/generate/pdf/route.ts
// Generates downloadable PDFs from filled legal forms
// Uses html-pdf-node or puppeteer-free approach with jsPDF via API response

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { docType, title, subtitle, fields, values, stampText, userId } = await req.json()

    // Build HTML document
    const fieldRows = fields.map((f: { label: string; key: string; full?: boolean }) => `
      <div class="field-box ${f.full ? 'full' : ''}">
        <div class="field-label">${f.label}</div>
        <div class="field-value">${values[f.key] || '—'}</div>
      </div>
    `).join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; background: #fff; color: #1a1a1a; padding: 48px; }
  .header { text-align: center; margin-bottom: 32px; }
  .studio { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #888; margin-bottom: 8px; font-family: Arial, sans-serif; }
  h1 { font-size: 26px; color: #000; margin-bottom: 6px; }
  h2 { font-size: 13px; color: #666; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; font-family: Arial, sans-serif; }
  .divider { width: 60px; height: 3px; background: #ff6a00; margin: 0 auto 32px; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .field-box { border-bottom: 1px solid #ddd; padding-bottom: 12px; }
  .field-box.full { grid-column: span 2; }
  .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; font-family: Arial, sans-serif; }
  .field-value { font-size: 14px; color: #1a1a1a; min-height: 22px; line-height: 1.5; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ff6a00; margin: 24px 0 12px; border-bottom: 1px solid #ff6a00; padding-bottom: 4px; font-family: Arial, sans-serif; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; }
  .sig-line { border-bottom: 1px solid #333; height: 36px; margin-bottom: 6px; }
  .sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-family: Arial, sans-serif; }
  .stamp { position: fixed; bottom: 48px; right: 48px; width: 100px; height: 100px; border: 3px solid rgba(255,106,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-15deg); opacity: 0.6; }
  .stamp-text { font-size: 9px; font-weight: 700; color: rgba(255,106,0,0.8); text-align: center; text-transform: uppercase; letter-spacing: 1px; line-height: 1.4; font-family: Arial, sans-serif; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; font-family: Arial, sans-serif; }
  .watermark { font-size: 9px; color: #ccc; text-align: center; margin-top: 8px; font-family: Arial, sans-serif; letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="header">
    <div class="studio">Envi Lee Creator Studios™</div>
    <h1>${title}</h1>
    <h2>${subtitle}</h2>
    <div class="divider"></div>
  </div>

  <div class="fields">
    ${fieldRows}
  </div>

  <div class="signatures">
    <div>
      <div class="sig-label">Owner / Creator Signature</div>
      <div class="sig-line"></div>
      <div style="font-size:11px;color:#888;font-family:Arial;">Print Name: ${values.owner || values.creator || values.ownerName || '________________________'}</div>
    </div>
    <div>
      <div class="sig-label">Date</div>
      <div class="sig-line" style="padding-top:10px;font-size:13px;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <div class="stamp">
    <div class="stamp-text">${stampText}</div>
  </div>

  <div class="footer">
    <span>Envi Lee Creator Studios™ — Baddie Legal Vault</span>
    <span>Document ID: EL-${docType?.toUpperCase()}-${Date.now().toString().slice(-6)}</span>
  </div>
  <div class="watermark">This document is for personal protection purposes only and does not constitute legal advice. Consult a licensed attorney for legal guidance.</div>
</body>
</html>`

    // Return HTML as response with PDF content type hint
    // In production this would use puppeteer or html-pdf
    // For now return the HTML with a special header so browser can print to PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Doc-Type': docType,
        'X-Doc-Title': title,
      },
    })

  } catch (err) {
    console.error('[/api/generate/pdf]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

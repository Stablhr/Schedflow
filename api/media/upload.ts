import type { NextApiRequest, NextApiResponse } from 'next'
import { put } from '@vercel/blob'
import { success, error } from '../_lib/response'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return res.status(400).json({ ok: false, error: 'No file provided' })
    }

    // Validate file size (50MB max)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ ok: false, error: 'File too large (max 50MB)' })
    }

    const blob = await put(`social-media/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return res.status(201).json({
      ok: true,
      data: {
        storageUrl: blob.url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}

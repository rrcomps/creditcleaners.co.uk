import type { NextApiRequest, NextApiResponse } from 'next'

interface LeadResponse {
  ok: boolean
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LeadResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const lead = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  console.log('Received lead:', lead)

  return res.status(200).json({ ok: true })
}

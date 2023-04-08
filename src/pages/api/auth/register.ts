import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/utils/sendEmail'
import { genSaltSync, hashSync } from 'bcrypt'
import type { NextApiRequest, NextApiResponse } from 'next'
import { genSync } from 'random-web-token'

type Data = {
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing name or email or password' })
    }

    const token = genSync('extra', 72)
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashSync(password, genSaltSync()),
        verificationToken: token,
      }
    })

    await sendEmail({
      to: email,
      type: 'emailVerification',
      token
    })

    return res.status(200).json({})
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

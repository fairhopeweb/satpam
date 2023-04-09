import { wrapper } from '@/_middlewares/wrapper'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/utils/sendEmail'
import { genSaltSync, hashSync } from 'bcrypt'
import NodeRSA from 'encrypt-rsa'
import type { NextApiRequest, NextApiResponse } from 'next'
import { genSync } from 'random-web-token'

type Data = {
  privateKey?: string,
  error?: string
}

export default wrapper(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing name or email or password' })
    }

    const token = genSync('extra', 72)
    const { publicKey, privateKey } = new NodeRSA().createPrivateAndPublicKeys()
    const usersCount = await prisma.user.count()
    await prisma.user.create({
      data: {
        name,
        email,
        publicKey,
        role: usersCount === 0 ? 'owner' : 'user',
        password: hashSync(password, genSaltSync()),
        verificationToken: token,
      }
    })

    await sendEmail({
      to: email,
      type: 'emailVerification',
      token
    })

    return res.status(200).json({ privateKey })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
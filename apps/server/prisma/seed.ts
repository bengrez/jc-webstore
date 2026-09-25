import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../src/lib/prisma.js'
import { seedProducts as catalog } from './seed-products.js'

const requireEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Falta variable de entorno ${key}`)
  }
  return value
}

const seedAdminUser = async () => {
  const email = z
    .string()
    .trim()
    .email()
    .parse(requireEnv('ADMIN_EMAIL'))
    .toLowerCase()
  const password = z.string().min(8).parse(requireEnv('ADMIN_PASSWORD'))

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  })
}

const seedProducts = async () => {
  const now = Date.now()

  for (const [index, product] of catalog.entries()) {
    const { id, options, images, tags, specs, ...fields } = product
    const data = {
      ...fields,
      images: JSON.stringify(images),
      tags: JSON.stringify(tags),
      specs: JSON.stringify(specs),
      isActive: true,
      // El catálogo ordena por createdAt desc: escalonamos para respetar el orden del arreglo.
      createdAt: new Date(now - index * 60_000),
    }

    await prisma.$transaction([
      prisma.product.upsert({ where: { id }, update: data, create: { id, ...data } }),
      prisma.productOption.deleteMany({ where: { productId: id } }),
      prisma.productOption.createMany({
        data: options.map((option, sortOrder) => ({
          productId: id,
          type: option.type,
          label: option.label,
          required: option.required ?? false,
          choices: JSON.stringify(option.choices ?? []),
          sortOrder,
        })),
      }),
    ])
  }
}

const main = async () => {
  await seedAdminUser()
  await seedProducts()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('[seed] failed', error)
    await prisma.$disconnect()
    process.exit(1)
  })

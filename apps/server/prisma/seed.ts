import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../src/lib/prisma.js'

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
  const products = [
    {
      id: 'grad-stole-magna',
      name: 'Estola bordada Magna',
      description: 'Estola en satín mate con bordado dorado y ribete a color.',
      price: 22990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['estolas', 'bordado', 'graduación']),
      specs: JSON.stringify(['Satín mate', 'Bordado premium', 'Largo 150 cm']),
      personalization: 'Bordado de escudo, iniciales y ribetes en contraste.',
      minOrder: 'MOQ 20 unidades',
      leadTime: 'Entrega 15 días',
      availability: 'A_PEDIDO' as const,
      badge: 'Top ventas',
      sampleEligible: true,
    },
    {
      id: 'grad-birrete-signature',
      name: 'Birrete Signature',
      description: 'Birrete estructurado con borla premium y placa metálica personalizable.',
      price: 14990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1523580841500-42761e3f30b4?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['birretes', 'placa', 'graduación']),
      specs: JSON.stringify(['Fieltro estructurado', 'Borla premium', 'Tallas S-XL']),
      personalization: 'Placa grabada láser y color de borla institucional.',
      minOrder: 'MOQ 30 unidades',
      leadTime: 'Entrega 10 días',
      availability: 'DISPONIBLE' as const,
      badge: 'Nuevo',
      sampleEligible: true,
    },
    {
      id: 'grad-tunica-ceremonial',
      name: 'Túnica ceremonial premium',
      description: 'Túnica de gabardina liviana con cierre oculto y opción de escudo.',
      price: 32990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['túnicas', 'confección', 'graduación']),
      specs: JSON.stringify(['Gabardina liviana', 'Cremallera invisible', 'Doble costura']),
      personalization: 'Color de rib, bordado de nombre y escudo full color.',
      minOrder: 'MOQ 15 unidades',
      leadTime: 'Entrega 20 días',
      availability: 'A_PEDIDO' as const,
      badge: 'Edición limitada',
      sampleEligible: false,
    },
    {
      id: 'mkt-kit-bienvenida',
      name: 'Kit de bienvenida ejecutivo',
      description: 'Set con libreta vegana, lápiz metálico, termo y empaque listo.',
      price: 27990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['welcome kit', 'corporativo', 'regalos']),
      specs: JSON.stringify(['Termo 500 ml', 'Libreta vegana', 'Estuche rígido']),
      personalization: 'Grabado láser, tarjetón interno y empaque con logo.',
      minOrder: 'MOQ 25 kits',
      leadTime: 'Entrega 12 días',
      availability: 'A_PEDIDO' as const,
      badge: 'Personalizado',
      sampleEligible: true,
    },
    {
      id: 'mkt-textil-eco',
      name: 'Tote bag ecológica bordada',
      description: 'Tote de algodón reciclado con asas reforzadas y bordado a 3 hilos.',
      price: 11990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['textil', 'eco', 'merchandising']),
      specs: JSON.stringify(['Algodón reciclado', 'Bordado 3 hilos', 'Asas reforzadas']),
      personalization: 'Bordado, serigrafía y etiqueta interna con claim.',
      minOrder: 'MOQ 40 unidades',
      leadTime: 'Entrega 14 días',
      availability: 'DISPONIBLE' as const,
      badge: 'Top ventas',
      sampleEligible: true,
    },
    {
      id: 'mkt-kit-escritura',
      name: 'Kit de escritura premium',
      description: 'Estuche rígido con roller metálico, libreta soft touch y marcador.',
      price: 18990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['escritura', 'eventos', 'corporativo']),
      specs: JSON.stringify(['Roller metálico', 'Libreta soft touch', 'Estuche rígido']),
      personalization: 'Grabado láser y tampografía en roller y libreta.',
      minOrder: 'MOQ 30 unidades',
      leadTime: 'Entrega 10 días',
      availability: 'DISPONIBLE' as const,
      badge: 'Nuevo',
      sampleEligible: true,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images,
        tags: product.tags,
        specs: product.specs,
        personalization: product.personalization,
        minOrder: product.minOrder,
        leadTime: product.leadTime,
        availability: product.availability,
        badge: product.badge,
        sampleEligible: product.sampleEligible,
        isActive: true,
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images,
        tags: product.tags,
        specs: product.specs,
        personalization: product.personalization,
        minOrder: product.minOrder,
        leadTime: product.leadTime,
        availability: product.availability,
        badge: product.badge,
        sampleEligible: product.sampleEligible,
        isActive: true,
      },
    })
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

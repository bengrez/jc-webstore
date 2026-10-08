// Datos mínimos para el e2e: un admin y un producto con opciones COLOR, TEXT y FILE.
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

if (!process.env.DATABASE_URL?.includes('e2e')) {
  throw new Error('e2e-seed sólo corre contra la base e2e (DATABASE_URL=file:./e2e.db).')
}

const email = process.env.ADMIN_EMAIL ?? 'admin@e2e.test'
const password = process.env.ADMIN_PASSWORD ?? 'clave-e2e-123'

await prisma.adminUser.create({ data: { email, passwordHash: await bcrypt.hash(password, 4) } })

await prisma.product.create({
  data: {
    id: 'e2e-estola',
    name: 'Estola bordada E2E',
    description: 'Estola de prueba para el flujo de cotización.',
    category: 'graduaciones',
    price: 15000,
    images: JSON.stringify(['/brand/logo.jpeg']),
    tags: JSON.stringify(['estolas']),
    specs: JSON.stringify(['Satín mate']),
    personalization: 'Bordado de nombre',
    minOrder: 'MOQ 10 unidades',
    leadTime: 'Entrega 15 días',
    availability: 'A_PEDIDO',
    sampleEligible: false,
    options: {
      create: [
        {
          type: 'COLOR',
          label: 'Color de ribete',
          required: true,
          choices: JSON.stringify([
            { label: 'Azul ceremonial', value: '#1F4FA0' },
            { label: 'Oro champagne', value: '#C9A961' },
          ]),
          sortOrder: 0,
        },
        { type: 'TEXT', label: 'Texto bordado', required: true, sortOrder: 1 },
        { type: 'FILE', label: 'Logo institucional', required: false, sortOrder: 2 },
      ],
    },
  },
})

await prisma.$disconnect()
console.log('[e2e] seed listo')

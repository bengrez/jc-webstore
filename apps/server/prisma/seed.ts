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
    // ── GRADUACIONES ──────────────────────────────────────────────────────────
    {
      id: 'grad-stole-magna',
      name: 'Estola bordada Magna',
      description: 'Estola en satín mate con bordado dorado y ribete a color. Ideal para ceremonias de grado con distinción académica.',
      price: 22990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584363542200-b25da33e1a88?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519340333-e4e3a4d26015?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['estolas', 'bordado', 'graduación']),
      specs: JSON.stringify([
        'Satín mate 100%',
        'Bordado en hilo dorado metálico',
        'Largo 150 cm, ancho 10 cm',
        'Ribetes en color institucional',
        'Resistente a lavado en seco',
      ]),
      personalization: 'Bordado de escudo institucional, iniciales o nombre completo. Ribetes en cualquier color Pantone.',
      minOrder: 'MOQ 20 unidades',
      leadTime: 'Entrega 15 días',
      availability: 'A_PEDIDO' as const,
      badge: 'Top ventas',
      sampleEligible: true,
    },
    {
      id: 'grad-birrete-signature',
      name: 'Birrete Signature',
      description: 'Birrete estructurado con borla premium y placa metálica personalizable. Acabado institucional para colegios y universidades.',
      price: 14990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1523580841500-42761e3f30b4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1627556704302-624286467c65?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['birretes', 'placa', 'graduación']),
      specs: JSON.stringify([
        'Fieltro estructurado de alta densidad',
        'Borla en hilo premium trenzado',
        'Placa metálica grabable en aluminio',
        'Tallas ajustables S / M / L / XL',
        'Compatible con clips de diploma',
      ]),
      personalization: 'Placa grabada láser con nombre o escudo. Color de borla en tonos institucionales.',
      minOrder: 'MOQ 30 unidades',
      leadTime: 'Entrega 10 días',
      availability: 'DISPONIBLE' as const,
      badge: 'Nuevo',
      sampleEligible: true,
    },
    {
      id: 'grad-tunica-ceremonial',
      name: 'Túnica ceremonial premium',
      description: 'Túnica de gabardina liviana con cierre oculto y opción de escudo bordado. Acabado ceremonial para promociones y actos oficiales.',
      price: 32990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1574019683512-c3ad29b8843b?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['túnicas', 'confección', 'graduación']),
      specs: JSON.stringify([
        'Gabardina liviana anti-arrugas',
        'Cremallera invisible frontal',
        'Doble costura reforzada en hombros',
        'Cuello redondo con rib institucional',
        'Tallas S–XXXL (guía de tallas incluida)',
      ]),
      personalization: 'Color de rib en cuello y mangas, bordado de nombre y escudo full color.',
      minOrder: 'MOQ 15 unidades',
      leadTime: 'Entrega 20 días',
      availability: 'A_PEDIDO' as const,
      badge: 'Edición limitada',
      sampleEligible: false,
    },
    {
      id: 'grad-medalla-honor',
      name: 'Medalla de Honor Premium',
      description: 'Medalla con relieve personalizado en zinc fundido y baño en oro, plata o bronce. Cinta de graduación con colores institucionales.',
      price: 8990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567427018-b174be4e7e67?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1559416001-6a3af9e3a8eb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1546961342-aa5faf058511?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['medallas', 'premios', 'distinción', 'graduación']),
      specs: JSON.stringify([
        'Zinc fundido con molde personalizado',
        'Baño en oro 24K, plata o bronce',
        'Diámetro 5 cm, grosor 3 mm',
        'Cinta satinada de 90 cm',
        'Caja individual de presentación incluida',
        'Grabado láser en reverso',
      ]),
      personalization: 'Escudo, nombre de institución y año de graduación en relieve. Cinta en colores Pantone.',
      minOrder: 'MOQ 30 unidades',
      leadTime: 'Entrega 18 días',
      availability: 'A_PEDIDO' as const,
      badge: null,
      sampleEligible: true,
    },
    {
      id: 'grad-banda-escolar',
      name: 'Banda Institucional Escolar',
      description: 'Banda de honor en satín bicolor con letras bordadas. Para reinas, delegadas y abanderadas en actos oficiales.',
      price: 12990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1584363542200-b25da33e1a88?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519340333-e4e3a4d26015?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['bandas', 'honor', 'actos oficiales', 'graduación']),
      specs: JSON.stringify([
        'Satín bicolor de alta densidad',
        'Ancho 10 cm, largo ajustable',
        'Letras bordadas en hilo metalizado',
        'Cierre con broche metálico dorado',
        'Lavado a mano, no centrifugar',
      ]),
      personalization: 'Texto institucional, nombre y año bordados. Combinación de colores del colegio.',
      minOrder: 'MOQ 10 unidades',
      leadTime: 'Entrega 12 días',
      availability: 'DISPONIBLE' as const,
      badge: 'Nuevo',
      sampleEligible: true,
    },
    {
      id: 'grad-insignia-egreso',
      name: 'Insignia de Egreso',
      description: 'Pin de solapa en metal esmaltado con escudo institucional. Recuerdo duradero para graduandos y docentes.',
      price: 4990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1523580841500-42761e3f30b4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['insignias', 'pins', 'souvenirs', 'graduación']),
      specs: JSON.stringify([
        'Metal con acabado dorado brillante',
        'Esmalte horneado full color',
        'Tamaño 2,5 × 2,5 cm',
        'Broche de mariposa en reverso',
        'Bolsa de organza individual',
      ]),
      personalization: 'Diseño de escudo, año de egreso y colores institucionales.',
      minOrder: 'MOQ 50 unidades',
      leadTime: 'Entrega 14 días',
      availability: 'DISPONIBLE' as const,
      badge: null,
      sampleEligible: true,
    },
    {
      id: 'grad-bufanda-grad',
      name: 'Bufanda de Graduación',
      description: 'Bufanda en tejido premium con colores y logo institucional. Souvenir exclusivo para cada graduado.',
      price: 15990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1543310465-32aede1d51f0?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584363542200-b25da33e1a88?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['bufandas', 'textil', 'souvenir', 'graduación']),
      specs: JSON.stringify([
        'Acrílico premium suave al tacto',
        'Tejido jacquard con logo en relieve',
        'Dimensiones 180 × 20 cm',
        'Flecos terminados a mano',
        'Empaque individual con tarjeta',
      ]),
      personalization: 'Colores institucionales, logo en jacquard y año de graduación en las puntas.',
      minOrder: 'MOQ 20 unidades',
      leadTime: 'Entrega 21 días',
      availability: 'A_PEDIDO' as const,
      badge: null,
      sampleEligible: true,
    },
    {
      id: 'grad-set-ceremonia',
      name: 'Pack Ceremonia Completo',
      description: 'Set completo: túnica + estola + birrete con borla. Solución llave en mano para colegios que quieren uniformidad total en su ceremonia.',
      price: 62990,
      category: 'graduaciones' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1574019683512-c3ad29b8843b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['set completo', 'pack', 'ceremonia', 'graduación']),
      specs: JSON.stringify([
        'Incluye túnica ceremonial + estola + birrete',
        'Materiales premium coordinados',
        'Personalización unificada de escudo y colores',
        'Tallas independientes por prenda',
        'Entrega en bolsa individual por graduado',
        'Coordinación de entregas por listado',
      ]),
      personalization: 'Escudo, nombre de institución, colores y ribetes coordinados en las tres prendas.',
      minOrder: 'MOQ 15 sets',
      leadTime: 'Entrega 25 días',
      availability: 'A_PEDIDO' as const,
      badge: 'Oferta',
      sampleEligible: false,
    },
    // ── MARKETING / CORPORATIVO ───────────────────────────────────────────────
    {
      id: 'mkt-kit-bienvenida',
      name: 'Kit de bienvenida ejecutivo',
      description: 'Set con libreta vegana, lápiz metálico, termo y empaque listo. Ideal para onboarding de empleados o regalo de clientes VIP.',
      price: 27990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504389901917-56e4b6f7d28f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1513689125086-28ec2e2d8c19?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['welcome kit', 'corporativo', 'regalos']),
      specs: JSON.stringify([
        'Termo de acero inoxidable 500 ml',
        'Libreta en cuero vegano A5',
        'Bolígrafo roller metálico',
        'Estuche rígido con cierre magnético',
        'Tarjetón impreso personalizado incluido',
      ]),
      personalization: 'Grabado láser en termo y bolígrafo, tarjetón interno y empaque con logo.',
      minOrder: 'MOQ 25 kits',
      leadTime: 'Entrega 12 días',
      availability: 'A_PEDIDO' as const,
      badge: 'Personalizado',
      sampleEligible: true,
    },
    {
      id: 'mkt-textil-eco',
      name: 'Tote bag ecológica bordada',
      description: 'Tote de algodón reciclado con asas reforzadas y bordado a 3 hilos. Ideal para activaciones de marca y eventos.',
      price: 11990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1543310465-32aede1d51f0?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['textil', 'eco', 'merchandising']),
      specs: JSON.stringify([
        'Algodón reciclado 220 g/m²',
        'Bordado en 3 hilos con relieve',
        'Asas reforzadas 70 cm',
        'Capacidad 12 litros',
        'Lavado a máquina hasta 30°C',
      ]),
      personalization: 'Bordado, serigrafía o sublimado. Etiqueta interna con claim de marca.',
      minOrder: 'MOQ 40 unidades',
      leadTime: 'Entrega 14 días',
      availability: 'DISPONIBLE' as const,
      badge: 'Top ventas',
      sampleEligible: true,
    },
    {
      id: 'mkt-kit-escritura',
      name: 'Kit de escritura premium',
      description: 'Estuche rígido con roller metálico, libreta soft touch y marcador. Para eventos, congresos y regalos corporativos de alto nivel.',
      price: 18990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1455390582262-e32f1e6f32db?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1587614382346-1ec1856d5fd7?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['escritura', 'eventos', 'corporativo']),
      specs: JSON.stringify([
        'Roller metálico plateado con recambio',
        'Libreta soft touch 100 hojas rayadas',
        'Marcador doble punta incluido',
        'Estuche rígido con espuma de presentación',
        'Caja de regalo lista para entregar',
      ]),
      personalization: 'Grabado láser y tampografía en roller y libreta. Logo en tapa del estuche.',
      minOrder: 'MOQ 30 unidades',
      leadTime: 'Entrega 10 días',
      availability: 'DISPONIBLE' as const,
      badge: 'Nuevo',
      sampleEligible: true,
    },
    {
      id: 'mkt-polo-bordado',
      name: 'Polo Bordado Corporativo',
      description: 'Polo de piqué de alto gramaje con bordado estructurado de logo. Para uniformes y merchandising con alta presencia de marca.',
      price: 14990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['textil', 'uniforme', 'corporativo', 'bordado']),
      specs: JSON.stringify([
        'Piqué 220 g/m² resistente al uso',
        'Cuello y puños en tejido rib',
        'Bordado en hasta 12 colores de hilo',
        'Tallas XS–XXXL (guía de tallas incluida)',
        'Color sólido o con contraste en cuello',
        'Lavado industrial hasta 60°C',
      ]),
      personalization: 'Logo bordado en pecho izquierdo, opcional en espalda o manga. Hasta 12 colores de hilo.',
      minOrder: 'MOQ 12 unidades',
      leadTime: 'Entrega 10 días',
      availability: 'DISPONIBLE' as const,
      badge: 'Top ventas',
      sampleEligible: true,
    },
    {
      id: 'mkt-gorra-bordada',
      name: 'Gorra Premium Bordada',
      description: 'Gorra estructurada de 5 paneles con visera curva y bordado 3D de logo. Ideal para outdoor, deportivo y merchandising premium.',
      price: 9990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['gorras', 'bordado', 'merchandising', '3D']),
      specs: JSON.stringify([
        'Twill 100% algodón cepillado',
        'Bordado 3D en frente (hasta 8 colores)',
        'Cierre metálico o velcro ajustable',
        '5 paneles con soporte de aro',
        'Visera pre-curvada premium',
        'Parche lateral en PVC o goma (opcional)',
      ]),
      personalization: 'Bordado 3D en frente y plano en visera. Parche lateral en PVC o goma.',
      minOrder: 'MOQ 24 unidades',
      leadTime: 'Entrega 15 días',
      availability: 'DISPONIBLE' as const,
      badge: null,
      sampleEligible: true,
    },
    {
      id: 'mkt-delantal-corp',
      name: 'Delantal Corporativo Bordado',
      description: 'Delantal de trabajo en drill pesado con bolsillos frontales y logo bordado. Para cocina, tiendas y servicio de hospitality.',
      price: 13990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1576502200938-9b3eb1eca58e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['delantales', 'uniforme', 'gastronomía', 'corporativo']),
      specs: JSON.stringify([
        'Drill 300 g/m² resistente a manchas',
        '2 bolsillos frontales con costuras reforzadas',
        'Tiras ajustables en cuello y cintura',
        'Largo 90 cm (larga) o 60 cm (media)',
        'Bordado de logo hasta 8 colores',
        'Lavado industrial hasta 60°C',
      ]),
      personalization: 'Logo bordado en pecho. Nombre del trabajador opcional. Color de tirantes contrastante.',
      minOrder: 'MOQ 10 unidades',
      leadTime: 'Entrega 12 días',
      availability: 'A_PEDIDO' as const,
      badge: null,
      sampleEligible: true,
    },
    {
      id: 'mkt-mochila-ejecutiva',
      name: 'Mochila Ejecutiva',
      description: 'Mochila de trabajo para laptop de hasta 15" con compartimento exclusivo y logo personalizado. Corporativo de alto impacto.',
      price: 34990,
      category: 'marketing' as const,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1547949003-9792a18a2841?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504389901917-56e4b6f7d28f?auto=format&fit=crop&w=1200&q=80',
      ]),
      tags: JSON.stringify(['mochilas', 'ejecutivo', 'corporativo', 'tecnología']),
      specs: JSON.stringify([
        'Nylon 1680D resistente al agua',
        'Compartimento acolchado para laptop 15"',
        'Puerto USB de carga externo',
        'Tirantes ergonómicos con relleno 10 mm',
        'Capacidad 28 litros',
        'Logo en parche de PVC moldeado',
      ]),
      personalization: 'Logo bordado o en parche de PVC. Interior personalizable con tela sublimada.',
      minOrder: 'MOQ 15 unidades',
      leadTime: 'Entrega 18 días',
      availability: 'A_PEDIDO' as const,
      badge: 'Nuevo',
      sampleEligible: false,
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

import type { Product } from './types'

export const products: Product[] = [
  {
    id: 'grad-stole-magna',
    name: 'Estola bordada Magna',
    description:
      'Estola en satín mate con bordado dorado personalizado y ribete en contraste. Disponible en combinaciones de color institucional.',
    price: 22990,
    image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=80',
    category: 'graduaciones',
    leadTime: 'Entrega 15 días',
    badge: 'Top ventas',
  },
  {
    id: 'grad-birrete-signature',
    name: 'Birrete Signature',
    description:
      'Birrete estructurado con borla premium y placa metálica personalizada. Disponible para niñas y niños desde talla S a XL.',
    price: 14990,
    image: 'https://images.unsplash.com/photo-1523580841500-42761e3f30b4?auto=format&fit=crop&w=800&q=80',
    category: 'graduaciones',
    leadTime: 'Entrega 10 días',
    badge: 'Nuevo',
  },
  {
    id: 'grad-tunica-ceremonial',
    name: 'Túnica ceremonial premium',
    description:
      'Túnica confeccionada en gabardina liviana con doble costura, cremallera invisible y escote en V. Incluye opciones de bordado de escudo y nombre.',
    price: 32990,
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    category: 'graduaciones',
    leadTime: 'Entrega 20 días',
    badge: 'Edición limitada',
  },
  {
    id: 'mkt-kit-bienvenida',
    name: 'Kit de bienvenida ejecutivo',
    description:
      'Set corporativo con libreta vegana, lápiz metálico, termo de acero y packaging personalizado listo para entrega.',
    price: 27990,
    image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=800&q=80',
    category: 'marketing',
    leadTime: 'Entrega 12 días',
  },
  {
    id: 'mkt-textil-eco',
    name: 'Tote bag ecológica bordada',
    description:
      'Bolsa de algodón reciclado con asas reforzadas y bordado a 3 hilos del logotipo. Incluye etiqueta interna con mensajes de marca.',
    price: 11990,
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    category: 'marketing',
    leadTime: 'Entrega 14 días',
    badge: 'Top ventas',
  },
  {
    id: 'mkt-kit-escritura',
    name: 'Kit de escritura premium',
    description:
      'Estuche rígido con roller metálico, libreta soft touch y marcador fluorescente. Ideal para ferias y eventos corporativos.',
    price: 18990,
    image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=800&q=80',
    category: 'marketing',
    leadTime: 'Entrega 10 días',
    badge: 'Nuevo',
  },
]

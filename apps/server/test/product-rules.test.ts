import { describe, expect, it } from 'vitest'
import { PRODUCT_MESSAGES, validateProductInput } from '../src/shared/product-rules.js'

const valid = {
  name: 'Estola bordada',
  description: 'Estola de raso con bordado.',
  category: 'graduaciones',
  price: 15990,
  images: ['/uploads/foto-1.jpg'],
  tags: ['estola'],
  specs: ['Raso'],
  personalization: 'Bordado de nombre',
  minOrder: 'Mínimo 10 unidades',
  leadTime: '7–10 días hábiles',
  availability: 'A pedido',
  badge: null,
  sampleEligible: true,
  stockNote: null,
}

describe('reglas compartidas del formulario de producto', () => {
  it('un producto completo no tiene errores', () => {
    expect(validateProductInput(valid)).toEqual({})
  })

  it('sin foto marca sólo la foto, con un mensaje en palabras simples', () => {
    expect(validateProductInput({ ...valid, images: [] })).toEqual({ images: PRODUCT_MESSAGES.imagesMissing })
    expect(PRODUCT_MESSAGES.imagesMissing).toBe('Sube al menos una foto del producto.')
  })

  it('un cuerpo vacío marca todos los campos obligatorios, uno por campo', () => {
    expect(Object.keys(validateProductInput({})).sort()).toEqual(
      ['availability', 'category', 'description', 'images', 'leadTime', 'minOrder', 'name', 'personalization', 'price', 'specs', 'tags'].sort()
    )
    expect(Object.keys(validateProductInput(null)).length).toBeGreaterThan(5)
  })

  it('distingue precio faltante de precio con puntos o decimales', () => {
    expect(validateProductInput({ ...valid, price: 0 }).price).toBe(PRODUCT_MESSAGES.priceMissing)
    expect(validateProductInput({ ...valid, price: -5 }).price).toBe(PRODUCT_MESSAGES.priceMissing)
    expect(validateProductInput({ ...valid, price: '15990' }).price).toBe(PRODUCT_MESSAGES.priceMissing)
    expect(validateProductInput({ ...valid, price: 15.99 }).price).toBe(PRODUCT_MESSAGES.priceFormat)
  })

  it('los textos en blanco cuentan como faltantes', () => {
    const errors = validateProductInput({ ...valid, name: '   ', tags: ['  '], leadTime: '' })
    expect(Object.keys(errors).sort()).toEqual(['leadTime', 'name', 'tags'])
  })

  it('rechaza imágenes de otros sitios y categorías o disponibilidades desconocidas', () => {
    const errors = validateProductInput({
      ...valid,
      images: ['/uploads/a.png', 'https://images.unsplash.com/photo-1.jpg'],
      category: 'otra',
      availability: 'Quizás',
    })
    expect(errors).toEqual({
      images: PRODUCT_MESSAGES.imagesExternal,
      category: PRODUCT_MESSAGES.category,
      availability: PRODUCT_MESSAGES.availability,
    })
  })

  it('el distintivo y la nota de stock pueden faltar, pero no ir en blanco', () => {
    expect(validateProductInput({ ...valid, badge: undefined, stockNote: null })).toEqual({})
    expect(Object.keys(validateProductInput({ ...valid, badge: '  ', stockNote: '' })).sort()).toEqual(['badge', 'stockNote'])
  })
})

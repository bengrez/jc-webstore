/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Product, ProductOptionType } from '../data/types'

export type CartItemConfig = {
  optionId: number
  label: string
  type: ProductOptionType
  value: string
}

export type CartItem = Product & {
  quantity: number
  cartItemKey: string
  configuration: CartItemConfig[]
}

type CartContextValue = {
  items: CartItem[]
  total: number
  addItem: (product: Product, quantity: number, configuration: CartItemConfig[]) => void
  updateQuantity: (cartItemKey: string, quantity: number) => void
  removeItem: (cartItemKey: string) => void
  /** Vuelve a poner un ítem quitado en su posición original (Deshacer). */
  restoreItem: (item: CartItem, index: number) => void
  /** Reemplaza un ítem por otro con nuevas opciones y cantidad; si ya existe esa combinación, suma las cantidades. */
  replaceItem: (cartItemKey: string, product: Product, quantity: number, configuration: CartItemConfig[]) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = 'confeccionesjuany:cart'

const makeCartItemKey = (productId: string, configuration: CartItemConfig[]) => {
  const configKey = configuration.length > 0 ? JSON.stringify(configuration) : ''
  return `${productId}::${configKey}`
}

const getInitialCart = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as CartItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is CartItem =>
        Boolean(item?.id) &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        typeof item.cartItemKey === 'string'
    )
  } catch (error) {
    console.warn('No fue posible leer el carrito almacenado', error)
    return []
  }
}

type CartProviderProps = {
  children: ReactNode
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>(getInitialCart)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback(
    (product: Product, quantity: number, configuration: CartItemConfig[]) => {
      const cartItemKey = makeCartItemKey(product.id, configuration)
      setItems((prev) => {
        const existing = prev.find((item) => item.cartItemKey === cartItemKey)
        if (existing) {
          return prev.map((item) =>
            item.cartItemKey === cartItemKey
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
        return [...prev, { ...product, quantity, cartItemKey, configuration }]
      })
    },
    []
  )

  const updateQuantity = useCallback((cartItemKey: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.cartItemKey === cartItemKey
            ? { ...item, quantity: Math.max(0, Math.floor(quantity)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }, [])

  const removeItem = useCallback((cartItemKey: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemKey !== cartItemKey))
  }, [])

  const restoreItem = useCallback((item: CartItem, index: number) => {
    setItems((prev) => {
      if (prev.some((existing) => existing.cartItemKey === item.cartItemKey)) return prev
      const next = [...prev]
      next.splice(Math.min(index, next.length), 0, item)
      return next
    })
  }, [])

  const replaceItem = useCallback(
    (cartItemKey: string, product: Product, quantity: number, configuration: CartItemConfig[]) => {
      const newKey = makeCartItemKey(product.id, configuration)
      setItems((prev) => {
        const index = prev.findIndex((item) => item.cartItemKey === cartItemKey)
        if (index === -1) return prev
        const rest = prev.filter((_, i) => i !== index)
        const merged = rest.find((item) => item.cartItemKey === newKey)
        if (merged) {
          return rest.map((item) =>
            item.cartItemKey === newKey ? { ...item, quantity: item.quantity + quantity } : item
          )
        }
        const next = [...rest]
        next.splice(index, 0, { ...product, quantity, cartItemKey: newKey, configuration })
        return next
      })
    },
    []
  )

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      total,
      addItem,
      updateQuantity,
      removeItem,
      restoreItem,
      replaceItem,
      clearCart,
    }),
    [items, total, addItem, updateQuantity, removeItem, restoreItem, replaceItem, clearCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe utilizarse dentro de CartProvider')
  }
  return context
}

import type { Product } from '../../data/types'
import { formatCurrency } from '../../utils/format'
import './product-card.css'

type ProductCardProps = {
  product: Product
  onConfigure?: (product: Product) => void
}

const ProductCard = ({ product, onConfigure }: ProductCardProps) => {
  return (
    <article
      className="product-card"
      onClick={() => onConfigure?.(product)}
      // La tarjeta es la única forma de abrir el configurador: debe funcionar con teclado
      role={onConfigure ? 'button' : undefined}
      tabIndex={onConfigure ? 0 : undefined}
      aria-label={onConfigure ? `Configurar ${product.name}` : undefined}
      onKeyDown={(event) => {
        if (!onConfigure || (event.key !== 'Enter' && event.key !== ' ')) return
        event.preventDefault()
        onConfigure(product)
      }}
    >
      {product.badge && <span className="product-card__badge">{product.badge}</span>}
      <div className="product-card__image">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card__content">
        <h3>{product.name}</h3>
        <span className="product-card__price">{`Desde ${formatCurrency(product.price)}`}</span>
        <div className="product-card__meta">
          <span className={`product-card__availability product-card__availability--${product.availability === 'Disponible' ? 'in' : 'pre'}`}>
            {product.availability}
          </span>
          <span className="product-card__lead">{product.leadTime}</span>
        </div>
      </div>
    </article>
  )
}

export default ProductCard

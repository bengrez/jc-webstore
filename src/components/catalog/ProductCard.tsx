import type { Product } from '../../data/types'
import { formatCurrency } from '../../utils/format'
import './product-card.css'

type ProductCardProps = {
  product: Product
  onAddToCart?: (product: Product) => void
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <article className="product-card">
      {product.badge && <span className="product-card__badge">{product.badge}</span>}
      <div className="product-card__image">
        <img src={product.image} alt={product.name} loading="lazy" />
        <div className="product-card__overlay">
          <p>Detalle premium listo para bordados y personalización.</p>
        </div>
      </div>

      <div className="product-card__content">
        <div className="product-card__heading">
          <h3>{product.name}</h3>
          {product.leadTime && <span className="product-card__lead-time">{product.leadTime}</span>}
        </div>
        <p>{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__price">{formatCurrency(product.price)}</span>
          {onAddToCart && (
            <button
              type="button"
              className="button button--primary"
              onClick={() => onAddToCart(product)}
            >
              Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProductCard

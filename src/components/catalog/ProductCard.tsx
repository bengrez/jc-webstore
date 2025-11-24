import type { Product } from '../../data/types'
import { formatCurrency } from '../../utils/format'
import './product-card.css'

type ProductCardProps = {
  product: Product
  onAddToCart?: (product: Product) => void
  onViewDetails?: (product: Product) => void
}

const ProductCard = ({ product, onAddToCart, onViewDetails }: ProductCardProps) => {
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
        <div className="product-card__specs" aria-label="Especificaciones rápidas">
          {product.specs?.map((spec) => (
            <span key={spec}>{spec}</span>
          ))}
          {product.personalization && <span>{product.personalization}</span>}
          {product.availability && <span>Disponibilidad: {product.availability}</span>}
          {product.minOrder && <span>{product.minOrder}</span>}
        </div>
        <div className="product-card__footer">
          <span className="product-card__price">{formatCurrency(product.price)}</span>
          <div className="product-card__actions">
            {onViewDetails && (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => onViewDetails(product)}
              >
                Ver ficha
              </button>
            )}
            {onAddToCart && (
              <button
                type="button"
                className="button button--primary"
                onClick={() => onAddToCart(product)}
              >
                Añadir
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProductCard

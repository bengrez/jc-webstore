import type { Product } from '../../data/types'
import { formatCurrency } from '../../utils/format'

type ProductCardProps = {
  product: Product
  onConfigure?: (product: Product) => void
}

const ProductCard = ({ product, onConfigure }: ProductCardProps) => {
  // minOrder ya puede venir como «Mínimo 20 unidades»: se quita el prefijo para no duplicarlo
  const minOrder = (product.minOrder ?? '').replace(/^\s*m[ií]n(imo|\.)?\s*:?\s*/i, '').trim()
  const inStock = product.availability === 'Disponible'
  return (
    <article className="card">
      <div className="card-img">
        <img src={product.image} alt="" width={900} height={675} loading="lazy" />
        {product.badge && <span className="badge">{product.badge}</span>}
      </div>
      <div className="card-body">
        <h3 className="card-name">{product.name}</h3>
        <div className="card-info">
          <p className="card-price">
            <span className="pre">Desde</span> <strong>{formatCurrency(product.price)}</strong> <span>+ IVA</span>
          </p>
          <div className="card-meta">
            <span className={`avail ${inStock ? 'avail-in' : 'avail-pre'}`}>
              <span className="dot" />
              {product.availability}
            </span>
            <span className="meta">
              <svg className="ic" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
              {product.leadTime}
            </span>
          </div>
          {minOrder && (
            <p className="meta">
              <svg className="ic" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
                <path d="M4 8l8 4 8-4M12 12v8" />
              </svg>
              <span>
                <span className="hide-m">Mínimo</span>
                <span className="show-m">Mín.</span> {minOrder}
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="card-foot">
        <button
          type="button"
          className="btn btn-secondary btn-block"
          aria-label={`Personalizar ${product.name}`}
          onClick={() => onConfigure?.(product)}
        >
          Personalizar
        </button>
      </div>
    </article>
  )
}

export default ProductCard

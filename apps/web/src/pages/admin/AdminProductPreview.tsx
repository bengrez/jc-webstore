import { useState } from 'react'
import ProductCard from '../../components/catalog/ProductCard'
import ProductConfiguratorModal from '../../components/catalog/ProductConfiguratorModal'
import type { Product } from '../../data/types'

export type PreviewState = 'new' | 'draft' | 'unsaved' | 'published' | 'inactive'

const STATE_LABELS: Record<PreviewState, string> = {
  new: 'Nuevo producto',
  draft: 'Borrador: aún no está publicado',
  unsaved: 'Cambios sin guardar',
  published: 'Publicado',
  inactive: 'Inactivo: no aparece en el catálogo',
}

const CATEGORY_LABELS: Record<Product['category'], string> = {
  graduaciones: 'Graduaciones',
  marketing: 'Artículos publicitarios',
}

type Props = {
  product: Product
  state: PreviewState
  missing: string[]
  warnings: string[]
  includesDraftOption: boolean
}

const AdminProductPreview = ({ product, state, missing, warnings, includesDraftOption }: Props) => {
  const [showFull, setShowFull] = useState(false)

  return (
    <aside className="admin-card admin-preview" aria-label="Vista previa del producto">
      <div className="admin-preview__header">
        <h2 style={{ margin: 0 }}>Vista previa</h2>
        <span className="admin-preview__state" data-state={state}>
          {STATE_LABELS[state]}
        </span>
      </div>
      <p className="admin-preview__hint">
        Así se verá en el catálogo, en la pestaña <strong>{CATEGORY_LABELS[product.category]}</strong>.
        Nada cambia en el sitio hasta que guardes.
      </p>

      <div className="admin-preview__card">
        <ProductCard product={product} onConfigure={() => setShowFull(true)} />
      </div>

      <button
        type="button"
        className="button button--ghost admin-preview__full"
        onClick={() => setShowFull(true)}
      >
        Ver ficha completa
      </button>
      {includesDraftOption && (
        <p className="admin-preview__hint">
          La ficha incluye la opción que estás editando, aunque aún no la guardes.
        </p>
      )}

      {missing.length > 0 && (
        <div className="admin-preview__checklist" data-variant="error">
          <strong>Para poder guardar falta:</strong>
          <ul>
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="admin-preview__checklist" data-variant="warning">
          <strong>Revisa:</strong>
          <ul>
            {warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {showFull && (
        <ProductConfiguratorModal
          product={product}
          onClose={() => setShowFull(false)}
          onAdd={() => undefined}
          preview
        />
      )}
    </aside>
  )
}

export default AdminProductPreview

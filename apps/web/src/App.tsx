import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AboutPage from './pages/AboutPage'
import CartPage from './pages/CartPage'
import CatalogPage from './pages/CatalogPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import ModeLandingPage from './pages/ModeLandingPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminQuoteDetailPage from './pages/admin/AdminQuoteDetailPage'
import AdminQuotesPage from './pages/admin/AdminQuotesPage'

const App = () => {
  return (
    <Routes>
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/products" replace />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="quotes" element={<AdminQuotesPage />} />
        <Route path="quotes/:id" element={<AdminQuoteDetailPage />} />
      </Route>
      {/* El selector de modo deja de ser un peaje en "/": la mayor parte de la
          demanda es de graduación, así que la home entra directo con el modo
          guardado (graduación por defecto). El selector queda en /modo. */}
      <Route path="modo" element={<ModeLandingPage />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="inicio" element={<Navigate to="/" replace />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="sobre-nosotros" element={<AboutPage />} />
        <Route path="contacto" element={<ContactPage />} />
        <Route path="carrito" element={<CartPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App

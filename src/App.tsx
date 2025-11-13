import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AboutPage from './pages/AboutPage'
import CartPage from './pages/CartPage'
import CatalogPage from './pages/CatalogPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
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

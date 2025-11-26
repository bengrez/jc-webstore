import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AboutPage from './pages/AboutPage'
import CartPage from './pages/CartPage'
import CatalogPage from './pages/CatalogPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ModeLandingPage from './pages/ModeLandingPage'

const App = () => {
  return (
    <Routes>
      <Route index element={<ModeLandingPage />} />
      <Route element={<Layout />}>
        <Route path="inicio" element={<HomePage />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="sobre-nosotros" element={<AboutPage />} />
        <Route path="contacto" element={<ContactPage />} />
        <Route path="carrito" element={<CartPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App

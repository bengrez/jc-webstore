import crypto from 'node:crypto'

// 32 bytes aleatorios. Ya no hay portal público que lo exija; se conserva en cada cotización
// porque el panel de administración muestra el link del cliente.
export const generatePublicToken = () => crypto.randomBytes(32).toString('base64url')

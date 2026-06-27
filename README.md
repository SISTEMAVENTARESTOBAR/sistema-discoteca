# 🌙 Sistema Discoteca

Sistema de Punto de Venta (POS) diseñado para restobares y discotecas. Gestiona pedidos, mesas, cocina, barra y caja en tiempo real con una interfaz moderna y responsiva.

## 📋 Descripción

Sistema integral de ventas que permite administrar todas las operaciones de un restobar:

- **Gestión de mesas** y asignación de garzones
- **Toma de pedidos** con menú digital
- **Pantalla de cocina** para preparación de alimentos
- **Pantalla de barra** para preparación de bebidas
- **Módulo de caja** para cobros y cierre de turno
- **Panel de administración** con reportes y configuración

## 👥 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| **Admin** | Acceso completo al sistema, gestión de usuarios, reportes y configuración |
| **Garzón** | Toma de pedidos, gestión de mesas asignadas |
| **Cajero** | Cobro de cuentas, apertura/cierre de caja |
| **Bartender** | Visualización y preparación de pedidos de barra |
| **Cocinero** | Visualización y preparación de pedidos de cocina |

## 🚀 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/sistema-discoteca.git

# Entrar al directorio
cd sistema-discoteca

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

El sistema estará disponible en `http://localhost:3000`

## ☁️ Deploy en Render

1. Sube tu proyecto a un repositorio de **GitHub**
2. Ve a [render.com](https://render.com) y crea una cuenta
3. Haz clic en **New** → **Web Service**
4. Conecta tu repositorio de GitHub
5. Configura los siguientes valores:

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |

6. Haz clic en **Deploy** y espera a que el servicio esté activo

## 🔑 Credenciales de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `garzon1` | `garzon123` | Garzón |
| `cajero1` | `cajero123` | Cajero |
| `bartender1` | `bar123` | Bartender |
| `cocinero1` | `cocina123` | Cocinero |

> ⚠️ **Importante:** Cambia las credenciales por defecto antes de usar en producción.

## 🛠️ Stack Tecnológico

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express
- **Base de datos:** Firebase (próximamente)
- **Deploy:** Render.com

## 📁 Estructura del Proyecto

```
sistema-discoteca/
├── public/          # Archivos estáticos (HTML, CSS, JS)
│   └── index.html   # Aplicación principal
├── server.js        # Servidor Express
├── package.json     # Configuración del proyecto
├── .gitignore       # Archivos ignorados por Git
└── README.md        # Este archivo
```

## 📄 Licencia

ISC

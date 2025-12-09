# Sistema de Reservas - Higiene Bucodental

Sistema completo de gestión de citas con vista de usuario y panel de administrador.

---

## 📁 Archivos del Sistema

```
Limpiezas/
├── index.html          ← Vista de Usuario (con admin integrado)
├── admin.html          ← Panel de Administrador Independiente ⭐
├── styles.css          ← Estilos compartidos
├── app.js              ← Lógica de index.html
├── INSTRUCCIONES.md    ← Guía de personalización
└── README.md           ← Este archivo
```

---

## 🚀 Inicio Rápido

### Para Usuarios (Reservar Citas)

1. Abre **`index.html`** en tu navegador
2. Selecciona un viernes en el calendario
3. Elige un horario y sillón disponible
4. Completa el formulario con tus datos
5. ¡Listo! Tu cita está reservada

### Para Administradores

**Opción 1: Panel Independiente (Recomendado) ⭐**
1. Abre **`admin.html`** en tu navegador
2. Introduce la clave: `admin123`
3. Gestiona todas las reservas desde el panel

**Opción 2: Desde Vista de Usuario**
1. Abre **`index.html`**
2. Haz clic en "🔐 Modo Administrador"
3. Introduce la clave: `admin123`

---

## 🎯 Características Principales

### Vista de Usuario (index.html)

✅ **Calendario interactivo** - Solo viernes seleccionables  
✅ **Horarios dinámicos** - 15:15 a 20:30 (intervalos de 40 min)  
✅ **Tres sillones** - Rojo, azul y amarillo con colores distintivos  
✅ **Reserva fácil** - Formulario simple con nombre y teléfono  
✅ **Cancelación** - Elimina tus citas con tu número de teléfono  
✅ **Estadísticas** - Ve disponibilidad en tiempo real  

### Panel de Administrador (admin.html)

🔐 **Autenticación segura** - Modal de login al cargar  
📊 **Dashboard completo** - 4 tarjetas de estadísticas  
🔍 **Filtros avanzados** - Busca por nombre, teléfono, sillón o fecha  
✏️ **Edición total** - Modifica fecha, hora, sillón, nombre y teléfono  
🗑️ **Eliminación** - Borra reservas individuales  
📥 **Exportar Excel** - Descarga todas las reservas  
⚠️ **Reset flexible** - Por fecha específica o total  

---

## 📊 Comparación de Opciones

| Característica | index.html | admin.html |
|---------------|------------|------------|
| **Vista Usuario** | ✅ | ❌ |
| **Vista Admin** | ✅ Integrada | ✅ Dedicada |
| **Autenticación** | Prompt simple | Modal profesional |
| **Estadísticas** | 2 básicas | 4 completas |
| **Filtros** | ❌ | ✅ 4 filtros |
| **Editar fecha/hora** | ❌ | ✅ |
| **Diseño admin** | Compartido | Profesional |
| **Uso recomendado** | Usuarios finales | Administradores |

---

## 💾 Persistencia de Datos

- **Almacenamiento**: localStorage del navegador
- **Clave**: `bookings_v2`
- **Compartido**: Ambos archivos usan los mismos datos
- **Backup**: Exporta a Excel regularmente

⚠️ **Importante**: Los datos se guardan localmente en el navegador. Si cambias de navegador o computadora, no verás las mismas reservas.

---

## 🔧 Configuración

### Cambiar Clave de Administrador

**En index.html:**
- Edita `app.js`, línea 6
- Cambia `ADMIN_PASSWORD: 'admin123'`

**En admin.html:**
- Edita `admin.html`, línea 296
- Cambia `ADMIN_PASSWORD: 'admin123'`

### Cambiar Horarios

Edita `app.js` (o `admin.html` líneas 298-299):
```javascript
START_TIME: { h: 15, m: 15 },  // Hora inicio
END_TIME: { h: 20, m: 30 },    // Hora fin
```

### Cambiar Duración de Citas

Edita `app.js` (o `admin.html` línea 297):
```javascript
SLOT_DURATION_MIN: 40,  // Minutos por cita
```

---

## 📖 Documentación Completa

- **INSTRUCCIONES.md** - Guía completa de personalización
- **walkthrough.md** - Demostración de funcionalidades
- **admin_walkthrough.md** - Guía del panel de administrador

---

## 🌐 Despliegue

### Servidor Local
Simplemente abre los archivos HTML en tu navegador.

### Servidor Web
Sube todos los archivos a tu servidor (Apache, Nginx, etc.)

### GitHub Pages
1. Sube los archivos a un repositorio
2. Activa GitHub Pages en Settings
3. Accede desde `https://tu-usuario.github.io/repo`

### Netlify
Arrastra la carpeta completa a Netlify.

---

## 🔒 Seguridad

⚠️ **Importante**: Este sistema usa autenticación básica con clave en el código. Para producción, considera:

- Implementar autenticación en servidor
- Usar base de datos real (MySQL, PostgreSQL)
- Añadir HTTPS
- Implementar sesiones seguras
- Hash de contraseñas

---

## 🆘 Solución de Problemas

**Los estilos no se cargan:**
- Verifica que `styles.css` esté en la misma carpeta
- Revisa la consola del navegador (F12)

**El JavaScript no funciona:**
- Verifica que `app.js` esté en la misma carpeta (para index.html)
- Asegúrate de tener conexión a internet (Bootstrap, SheetJS)

**Las reservas no se guardan:**
- Verifica que localStorage esté habilitado
- Evita modo incógnito/privado
- Prueba en otro navegador

**No aparecen viernes en el calendario:**
- Los viernes pasados no son seleccionables
- Navega a meses futuros con las flechas

---

## 📱 Compatibilidad

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  
✅ Móviles (iOS Safari, Chrome Android)  

---

## 🎓 Tecnologías Utilizadas

- HTML5
- CSS3 (Variables, Flexbox, Grid, Animaciones)
- JavaScript ES6+
- Bootstrap 5.3.2
- SheetJS (xlsx.js)
- Google Fonts (Inter)
- localStorage API

---

## 📝 Licencia

Este proyecto es de uso educativo para el módulo de Higiene Bucodental.

---

## ✨ Características Destacadas

### Diseño Moderno
- Gradientes azules corporativos
- Animaciones suaves
- Sombras elevadas
- Responsive design

### Calendario Inteligente
- Solo viernes seleccionables
- Navegación entre meses
- Indicador de fechas con reservas
- Fechas pasadas deshabilitadas

### Sistema de Sillones
- Tres colores distintivos
- Estado visual claro
- Nombres de pacientes visibles
- Botones interactivos

### Panel Profesional
- Dashboard con métricas
- Filtros en tiempo real
- Edición completa
- Exportación profesional

---

## 🎯 Recomendaciones de Uso

**Para Pacientes:**
- Usa `index.html`
- Marca como favorito
- Guarda tu teléfono para cancelaciones

**Para Administradores:**
- Usa `admin.html` ⭐
- Marca como favorito
- Exporta a Excel semanalmente
- Cambia la clave por defecto

**Para Desarrollo:**
- Archivos separados (HTML, CSS, JS)
- Usa la consola del navegador para debug
- Lee INSTRUCCIONES.md para personalizar

---

## 📞 Soporte

Para problemas o dudas:
1. Revisa INSTRUCCIONES.md
2. Consulta la consola del navegador (F12)
3. Verifica que todos los archivos estén presentes
4. Asegúrate de tener conexión a internet

---

**¡Sistema listo para usar!** 🎉

Última actualización: Diciembre 2025

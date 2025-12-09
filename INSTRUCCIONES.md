# Instrucciones de Instalación y Personalización

## 📁 Estructura de Archivos

Tu aplicación ahora consta de tres archivos:

```
Limpiezas/
├── index.html      ← Archivo principal (abrir en navegador)
├── styles.css      ← Estilos personalizados
└── app.js          ← Lógica de la aplicación
```

## 🚀 Cómo Usar la Aplicación

### Opción 1: Archivos Separados (Recomendado)

Los archivos ya están listos para usar. Simplemente:

1. Abre `index.html` en tu navegador favorito (Chrome, Firefox, Edge, etc.)
2. La aplicación funcionará inmediatamente

**Ventajas:**
- Código más organizado y fácil de mantener
- Archivos más pequeños y fáciles de editar
- Mejor para desarrollo y futuras modificaciones

### Opción 2: Un Solo Archivo HTML

Si prefieres tener todo en un solo archivo, sigue estos pasos:

1. Abre `index.html` en un editor de texto
2. Reemplaza la línea `<link rel="stylesheet" href="styles.css">` con:
   ```html
   <style>
   [COPIAR TODO EL CONTENIDO DE styles.css AQUÍ]
   </style>
   ```
3. Reemplaza la línea `<script src="app.js"></script>` con:
   ```html
   <script>
   [COPIAR TODO EL CONTENIDO DE app.js AQUÍ]
   </script>
   ```

**Ventajas:**
- Un solo archivo para compartir
- Más fácil de enviar por email o subir a un servidor

## 🔧 Personalización

### Cambiar la Clave de Administrador

1. Abre `app.js`
2. Busca la línea 6:
   ```javascript
   ADMIN_PASSWORD: 'admin123',
   ```
3. Cambia `'admin123'` por tu clave deseada
4. Guarda el archivo

### Cambiar los Horarios

1. Abre `app.js`
2. Busca las líneas 8-9:
   ```javascript
   START_TIME: { h: 15, m: 15 },
   END_TIME: { h: 20, m: 30 },
   ```
3. Modifica las horas según necesites
4. Guarda el archivo

Ejemplo para horario de 9:00 a 14:00:
```javascript
START_TIME: { h: 9, m: 0 },
END_TIME: { h: 14, m: 0 },
```

### Cambiar la Duración de las Citas

1. Abre `app.js`
2. Busca la línea 7:
   ```javascript
   SLOT_DURATION_MIN: 40,
   ```
3. Cambia `40` por los minutos que desees (ej: 30, 45, 60)
4. Guarda el archivo

### Cambiar los Colores Corporativos

1. Abre `styles.css`
2. Busca las líneas 5-7:
   ```css
   --brand-blue: #0b66d6;
   --brand-blue-dark: #094fa8;
   --brand-blue-light: #3d8ae6;
   ```
3. Cambia los códigos de color hexadecimales
4. Guarda el archivo

Puedes usar herramientas como [Coolors](https://coolors.co/) para generar paletas de colores.

### Cambiar los Nombres de los Sillones

1. Abre `app.js`
2. Busca la línea 5:
   ```javascript
   CHAIRS: ['rojo', 'azul', 'amarillo'],
   ```
3. Cambia los nombres (mantén el mismo número de sillones)
4. Actualiza también los colores en `styles.css` si es necesario

### Permitir Otros Días (No Solo Viernes)

1. Abre `app.js`
2. Busca la función `isFriday` (línea 34):
   ```javascript
   function isFriday(date) {
     return date.getDay() === 5;
   }
   ```
3. Modifica según tus necesidades:

   **Para permitir lunes a viernes:**
   ```javascript
   function isWeekday(date) {
     const day = date.getDay();
     return day >= 1 && day <= 5; // 1=Lunes, 5=Viernes
   }
   ```

   **Para permitir días específicos (ej: martes y jueves):**
   ```javascript
   function isAllowedDay(date) {
     const day = date.getDay();
     return day === 2 || day === 4; // 2=Martes, 4=Jueves
   }
   ```

4. Actualiza también la línea 177 en `renderCalendar()`:
   ```javascript
   const friday = isFriday(date);
   ```
   Cámbiala por:
   ```javascript
   const friday = isWeekday(date); // o isAllowedDay(date)
   ```

## 🌐 Subir a un Servidor Web

### Opción 1: GitHub Pages (Gratis)

1. Crea una cuenta en [GitHub](https://github.com)
2. Crea un nuevo repositorio
3. Sube los tres archivos (index.html, styles.css, app.js)
4. Ve a Settings → Pages
5. Selecciona la rama "main" y guarda
6. Tu aplicación estará disponible en `https://tu-usuario.github.io/nombre-repositorio`

### Opción 2: Netlify (Gratis)

1. Crea una cuenta en [Netlify](https://www.netlify.com)
2. Arrastra la carpeta con los tres archivos a Netlify
3. Tu aplicación estará disponible en una URL automática

### Opción 3: Servidor Propio

Simplemente copia los tres archivos a tu servidor web (Apache, Nginx, etc.) y accede a través de tu dominio.

## 💾 Gestión de Datos

### Exportar Datos

Los datos se guardan automáticamente en el navegador (localStorage). Para hacer una copia de seguridad:

1. Accede al modo administrador
2. Haz clic en "📥 Exportar Excel"
3. Se descargará un archivo con todas las reservas

### Importar Datos

Actualmente no hay función de importación automática. Si necesitas restaurar datos:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Application" → "Local Storage"
3. Busca la clave `bookings_v2`
4. Pega el JSON con tus datos guardados

### Limpiar Datos

**Desde la aplicación:**
- Modo administrador → "⚠️ Reset Total"

**Manualmente:**
1. Abre la consola del navegador (F12)
2. Escribe: `localStorage.removeItem('bookings_v2')`
3. Recarga la página

## 🔍 Solución de Problemas

### Los estilos no se cargan

- Verifica que `styles.css` esté en la misma carpeta que `index.html`
- Verifica que el nombre del archivo sea exactamente `styles.css` (sin espacios)
- Abre la consola del navegador (F12) para ver errores

### El JavaScript no funciona

- Verifica que `app.js` esté en la misma carpeta que `index.html`
- Verifica que el nombre del archivo sea exactamente `app.js`
- Abre la consola del navegador (F12) para ver errores
- Asegúrate de que SheetJS se cargue correctamente (requiere conexión a internet)

### Las reservas no se guardan

- Verifica que el navegador permita localStorage
- Algunos navegadores en modo incógnito no guardan datos
- Prueba en un navegador diferente

### El calendario no muestra viernes

- Verifica que la fecha actual sea correcta en tu sistema
- Los viernes pasados no se muestran como seleccionables
- Navega a meses futuros usando las flechas

## 📱 Compatibilidad

La aplicación funciona en:

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  
✅ Opera 76+  

**Dispositivos móviles:**
✅ iOS Safari 14+  
✅ Chrome Android 90+  

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la consola del navegador (F12) para ver errores
2. Verifica que todos los archivos estén en la misma carpeta
3. Asegúrate de tener conexión a internet (para Bootstrap y SheetJS)
4. Prueba en un navegador diferente

## 📝 Notas Importantes

- **Los datos se guardan localmente**: Si cambias de navegador o computadora, no verás las mismas reservas
- **Requiere conexión a internet**: Para cargar Bootstrap, Google Fonts y SheetJS
- **Clave de administrador**: Por defecto es `admin123`, cámbiala por seguridad
- **Backup regular**: Exporta a Excel regularmente para tener copias de seguridad

## 🎓 Próximos Pasos Sugeridos

Si quieres mejorar la aplicación:

1. **Base de datos real**: Conectar a un backend (Node.js, PHP, etc.)
2. **Autenticación avanzada**: Sistema de usuarios con contraseñas seguras
3. **Notificaciones**: Enviar emails o SMS de confirmación
4. **Recordatorios**: Sistema de recordatorios automáticos
5. **Historial**: Mantener registro de citas pasadas
6. **Reportes**: Gráficos y estadísticas avanzadas
7. **Multi-idioma**: Soporte para varios idiomas
8. **Temas**: Modo oscuro y otros temas visuales

---

¡Tu aplicación está lista para usar! 🎉

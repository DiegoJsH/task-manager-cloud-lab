# Task Manager Cloud Lab
# 📌 Descripción del proyecto
Este proyecto consiste en una aplicación web sencilla para la gestión de tareas (Task Manager), desarrollada en equipo y desplegada en la nube.
El objetivo es aplicar el uso de GitHub como repositorio colaborativo, implementar control de versiones y configurar un flujo de CI/CD que permita que cada cambio en la rama principal se refleje automáticamente en la aplicación desplegada.

La aplicación incluye:

📋 Visualización de lista de tareas

➕ Registro de nuevas tareas

❌ Eliminación de tareas

💾 Persistencia básica en JSON o memoria local

# 🌐 URL de la aplicación en la nube
La aplicación está desplegada en Azure App Service.
🔗 URL pública: task-manager-1-g9gjh9d6bqdsgwdp.canadacentral-01.azurewebsites.net

# ⚙️ Proceso de despliegue
Creación del repositorio en GitHub con ramas por integrante.

Desarrollo de la aplicación en Node.js/Python con frontend básico en HTML/CSS/JS.

Configuración de Azure App Service como plataforma de despliegue.

Integración con GitHub Actions para CI/CD automático.

Cada push a main actualiza la aplicación en la nube.

# 📝 Problemas encontrados y soluciones
Error de dependencias → se resolvió reinstalando con npm install --force.

Conflictos en pull requests → solucionados con revisiones en equipo y git merge.

Configuración de CI/CD → se resolvió agregando el secreto AZURE_WEBAPP_PUBLISH_PROFILE en GitHub.

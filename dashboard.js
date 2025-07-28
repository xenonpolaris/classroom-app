// Configuración del cliente de Appwrite para dashboard
const dashboardClient = new Appwrite.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('688733b70004aba4f8f1');

const dashboardDatabase = new Appwrite.Databases(dashboardClient);

// IMPORTANTE: Necesitas verificar estos IDs en tu consola de Appwrite
const PROJECT_ID = '688733b70004aba4f8f1';
const DATABASE_ID = 'main'; // Cambia esto por tu Database ID real
const COLLECTION_ID = 'estudiantes'; // Verifica que esta colección existe

async function verificarConfiguracion() {
  try {
    console.log('Verificando configuración de Appwrite...');
    console.log('Project ID:', PROJECT_ID);
    console.log('Database ID:', DATABASE_ID);
    console.log('Collection ID:', COLLECTION_ID);
    
    // Intentar listar las bases de datos disponibles
    const databases = await dashboardDatabase.list();
    console.log('Bases de datos disponibles:', databases);
    
    return true;
  } catch (error) {
    console.error('Error de configuración:', error);
    
    // Mostrar mensaje de error específico
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = `
      <div class="card" style="background-color: #ffebee; border-color: #f44336;">
        <h3 style="color: #d32f2f;">Error de Configuración</h3>
        <p><strong>Problema:</strong> ${error.message}</p>
        <p><strong>Código:</strong> ${error.code || 'N/A'}</p>
        <h4>Pasos para solucionarlo:</h4>
        <ol>
          <li>Ve a tu <a href="https://cloud.appwrite.io/console" target="_blank">Consola de Appwrite</a></li>
          <li>Selecciona tu proyecto: <code>${PROJECT_ID}</code></li>
          <li>Ve a <strong>Settings → Platforms</strong></li>
          <li>Agrega una nueva plataforma Web con la URL: <code>https://classroom-app-delta.vercel.app</code></li>
          <li>Ve a <strong>Databases</strong> y verifica que existe una base de datos</li>
          <li>Dentro de la base de datos, verifica que existe la colección <code>${COLLECTION_ID}</code></li>
          <li>Copia el <strong>Database ID</strong> real y actualiza el código</li>
        </ol>
      </div>
    `;
    return false;
  }
}

async function obtenerEstudiantes() {
  try {
    const res = await dashboardDatabase.listDocuments(DATABASE_ID, COLLECTION_ID);
    return res.documents;
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    throw error;
  }
}

async function renderDashboard() {
  const dashboard = document.getElementById('dashboard');
  
  // Primero verificar la configuración
  const configOk = await verificarConfiguracion();
  if (!configOk) {
    return; // El error ya se mostró en verificarConfiguracion
  }
  
  dashboard.innerHTML = '';

  try {
    // Mostrar información del banco
    const bancoCard = document.createElement('div');
    bancoCard.className = 'card banco';
    bancoCard.innerHTML = `
      <h3>Banco Central</h3>
      <p>Balance: $0</p>
      <p style="color: #4caf50; font-size: 12px;">✓ Conectado a Appwrite</p>
    `;
    dashboard.appendChild(bancoCard);

    // Obtener y mostrar estudiantes
    const estudiantes = await obtenerEstudiantes();
    
    if (estudiantes.length === 0) {
      const noData = document.createElement('div');
      noData.className = 'card';
      noData.innerHTML = `
        <p>No hay estudiantes registrados</p>
        <p style="font-size: 12px; color: #666;">
          Ve a la página de <a href="estudiante.html">Estudiante</a> para agregar uno.
        </p>
      `;
      dashboard.appendChild(noData);
      return;
    }

    // Mostrar cada estudiante
    estudiantes.forEach(est => {
      const card = document.createElement('div');
      card.className = 'card estudiante';
      card.innerHTML = `
        <h3>${est.nombre}</h3>
        <p>Balance: $${est.balance?.toLocaleString() || 0}</p>
        <p>Net Worth: $${est.netWorth?.toLocaleString() || 0}</p>
        <p style="font-size: 10px; color: #999;">ID: ${est.$id}</p>
      `;
      dashboard.appendChild(card);
    });

  } catch (error) {
    console.error('Error al renderizar dashboard:', error);
    const errorCard = document.createElement('div');
    errorCard.className = 'card';
    errorCard.style.backgroundColor = '#ffebee';
    errorCard.style.borderColor = '#f44336';
    errorCard.innerHTML = `
      <h3 style="color: #d32f2f;">Error al cargar datos</h3>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Tipo:</strong> ${error.type || 'Desconocido'}</p>
      <p style="font-size: 12px;">Revisa la consola para más detalles.</p>
    `;
    dashboard.appendChild(errorCard);
  }
}

// Intentar suscripción en tiempo real (opcional)
try {
  dashboardClient.subscribe(`databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`, (response) => {
    console.log('Actualización en tiempo real:', response);
    renderDashboard();
  });
} catch (error) {
  console.log('Suscripción en tiempo real no disponible:', error.message);
}

// Cargar dashboard al inicio
document.addEventListener('DOMContentLoaded', () => {
  console.log('Iniciando dashboard...');
  renderDashboard();
});

// También cargar inmediatamente por si el DOM ya está listo
renderDashboard();
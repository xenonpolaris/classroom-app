const dashboardClient = new Appwrite.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6887335f0033b38b7bd2');

const dashboardDatabase = new Appwrite.Databases(dashboardClient);

const DATABASE_ID = '688733b70004aba4f8f1';
const COLLECTION_ID = '688733d300186c50067b';

// Verificar conexión usando una lectura válida
async function verificarConfiguracion() {
  try {
    await dashboardDatabase.listDocuments(DATABASE_ID, COLLECTION_ID, [], 1);
    console.log('✅ Conexión con Appwrite verificada');
    return true;
  } catch (error) {
    console.error('❌ Error de configuración:', error);
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = `
      <div class="card" style="background-color: #ffebee;">
        <h3 style="color: #d32f2f;">Error de Configuración</h3>
        <p><strong>Problema:</strong> ${error.message}</p>
        <p><strong>Código:</strong> ${error.code || 'N/A'}</p>
        <ol style="text-align: left; font-size: 13px;">
          <li>Confirma que el <strong>Database ID</strong> y <strong>Collection ID</strong> están bien escritos</li>
          <li>Agrega tu dominio en Appwrite → Platforms → Web</li>
          <li>Verifica permisos en la colección “estudiantes” (lectura pública o por sesión)</li>
        </ol>
      </div>
    `;
    return false;
  }
}

// Cargar estudiantes
async function obtenerEstudiantes() {
  const res = await dashboardDatabase.listDocuments(DATABASE_ID, COLLECTION_ID);
  return res.documents;
}

// Generar resumen del banco
function generarResumen(estudiantes) {
  const total = estudiantes.length;
  const saldoTotal = estudiantes.reduce((acc, est) => acc + (est.balance || 0), 0);
  return { total, saldoTotal };
}

// Renderizar vista
async function renderDashboard() {
  const dashboard = document.getElementById('dashboard');
  const configOk = await verificarConfiguracion();
  if (!configOk) return;

  const estudiantes = await obtenerEstudiantes();
  const resumen = generarResumen(estudiantes);
  dashboard.innerHTML = '';

  // Banco Central
  dashboard.innerHTML += `
    <div class="card banco">
      <h3>Banco Central</h3>
      <p>Estudiantes: ${resumen.total}</p>
      <p>Balance total: $${resumen.saldoTotal.toLocaleString()}</p>
      <p style="color: #4caf50;">✓ Conectado a Appwrite</p>
    </div>
  `;

  if (estudiantes.length === 0) {
    dashboard.innerHTML += `
      <div class="card">
        <p>No hay estudiantes registrados</p>
        <a href="estudiante.html">Agregar uno</a>
      </div>
    `;
    return;
  }

  estudiantes.forEach(est => {
    dashboard.innerHTML += `
      <div class="card estudiante">
        <h3>${est.nombre}</h3>
        <p>Balance: $${est.balance?.toLocaleString() || 0}</p>
        <p>Net Worth: $${est.netWorth?.toLocaleString() || 0}</p>
        <p style="font-size: 10px; color: #999;">ID: ${est.$id}</p>
      </div>
    `;
  });
}

// Suscripción en tiempo real
dashboardClient.subscribe(
  `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
  () => renderDashboard()
);

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', renderDashboard);
// Cargar al iniciar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', renderDashboard);

// También ejecutar inmediatamente por si el DOM ya fue cargado
if (document.readyState !== 'loading') {
  renderDashboard();
}

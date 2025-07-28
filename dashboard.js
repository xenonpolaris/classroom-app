// Configuración única del cliente de Appwrite para dashboard
const dashboardClient = new Appwrite.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('688733b70004aba4f8f1');

const dashboardDatabase = new Appwrite.Databases(dashboardClient);

// Configuración corregida
const DB_ID = '688733b70004aba4f8f1';
const COLLECTION_ID = 'estudiantes';

async function obtenerEstudiantes() {
  try {
    const res = await dashboardDatabase.listDocuments(DB_ID, COLLECTION_ID);
    return res.documents;
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    return [];
  }
}

async function renderDashboard() {
  const dashboard = document.getElementById('dashboard');
  dashboard.innerHTML = '';

  try {
    // Mostrar información del banco (simulado)
    const banco = { nombre: 'Banco Central', balance: 0 };
    const bancoCard = document.createElement('div');
    bancoCard.className = 'card banco';
    bancoCard.innerHTML = `
      <h3>${banco.nombre}</h3>
      <p>Balance: $${banco.balance.toLocaleString()}</p>
    `;
    dashboard.appendChild(bancoCard);

    // Obtener y mostrar estudiantes
    const estudiantes = await obtenerEstudiantes();
    
    if (estudiantes.length === 0) {
      const noData = document.createElement('div');
      noData.className = 'card';
      noData.innerHTML = '<p>No hay estudiantes registrados</p>';
      dashboard.appendChild(noData);
      return;
    }

    estudiantes.forEach(est => {
      const card = document.createElement('div');
      card.className = 'card estudiante';
      card.innerHTML = `
        <h3>${est.nombre}</h3>
        <p>Balance: $${est.balance}</p>
        <p>Net Worth: $${est.netWorth}</p>
      `;
      dashboard.appendChild(card);
    });
  } catch (error) {
    console.error('Error al renderizar dashboard:', error);
    const errorCard = document.createElement('div');
    errorCard.className = 'card';
    errorCard.innerHTML = '<p>Error al cargar datos</p>';
    dashboard.appendChild(errorCard);
  }
}

// Suscripción en tiempo real (opcional, puede causar errores CORS)
try {
  dashboardClient.subscribe(`databases.${DB_ID}.collections.${COLLECTION_ID}.documents`, () => {
    console.log('Actualizando dashboard...');
    renderDashboard();
  });
} catch (error) {
  console.log('Suscripción en tiempo real no disponible:', error);
}

// Cargar dashboard al inicio
renderDashboard();
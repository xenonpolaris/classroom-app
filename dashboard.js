const cliente = new Appwrite.Cliente();

cliente
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('688733b70004aba4f8f1');

const database = new Appwrite.Databases(cliente);
const DB_ID = 'TU_DATABASE_ID'; // ← Actualízalo con tu ID real
const COLLECTION_ID = 'estudiantes';

async function obtenerEstudiantes() {
  const res = await database.listDocuments(DB_ID, COLLECTION_ID);
  return res.documents;
}

async function renderDashboard() {
  const dashboard = document.getElementById('dashboard');
  dashboard.innerHTML = '';

  // Si tienes un documento de banco, puedes cargarlo aquí
  const banco = { nombre: 'Banco Central', balance: 0 }; // Puedes cargarlo de Appwrite si lo tienes
  const bancoCard = document.createElement('div');
  bancoCard.className = 'card banco';
  bancoCard.innerHTML = `
    <h3>${banco.nombre}</h3>
    <p>Balance: $${banco.balance.toLocaleString()}</p>
  `;
  dashboard.appendChild(bancoCard);

  const estudiantes = await obtenerEstudiantes();
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
}

async function ingresarEstudiante() {
  const nombre = document.getElementById('student-name').value.trim();
  if (!nombre) return;

  const existentes = await database.listDocuments(DB_ID, COLLECTION_ID, [
    Appwrite.Query.equal('nombre', nombre)
  ]);

  if (existentes.total === 0) {
    await database.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
      nombre,
      balance: 1500,
      netWorth: 0
    });
  }

  renderStudentCard(nombre);
}

async function renderStudentCard(nombre) {
  const res = await database.listDocuments(DB_ID, COLLECTION_ID, [
    Appwrite.Query.equal('nombre', nombre)
  ]);
  const estudiante = res.documents[0];

  const container = document.getElementById('student-card');
  container.innerHTML = `
    <div class="card estudiante">
      <h3>${estudiante.nombre}</h3>
      <p>Balance: $${estudiante.balance}</p>
      <p>Net Worth: $${estudiante.netWorth}</p>
    </div>
    <button onclick="mostrarTransferencia('${estudiante.$id}')">Transferir</button>
    <button onclick="eliminarEstudiante('${estudiante.$id}')">Eliminar</button>
  `;
}

// 🔄 Suscripción en tiempo real
const realtime = new Appwrite.Realtime(cliente);
realtime.subscribe(`databases.${DB_ID}.collections.${COLLECTION_ID}.documents`, () => {
  renderDashboard();
});

renderDashboard();


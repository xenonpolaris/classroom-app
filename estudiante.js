// Configuración única del cliente de Appwrite para estudiantes
const estudianteClient = new Appwrite.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('688733b70004aba4f8f1');

const estudianteDatabase = new Appwrite.Databases(estudianteClient);

// Configuración corregida - usando el project ID como database ID
const DB_ID = '688733b70004aba4f8f1';
const COLLECTION_ID = 'estudiantes';

async function ingresarEstudiante() {
  const nombre = document.getElementById('student-name').value.trim();
  if (!nombre || nombre.length < 3) {
    alert('Nombre inválido - debe tener al menos 3 caracteres');
    return;
  }

  try {
    // Verificar si el estudiante ya existe
    const existe = await estudianteDatabase.listDocuments(DB_ID, COLLECTION_ID, [
      Appwrite.Query.equal('nombre', nombre)
    ]);

    let estudiante;
    if (existe.total === 0) {
      // Crear nuevo estudiante
      estudiante = await estudianteDatabase.createDocument(
        DB_ID, 
        COLLECTION_ID, 
        Appwrite.ID.unique(), 
        {
          nombre,
          balance: 1500,
          netWorth: 0
        }
      );
    } else {
      estudiante = existe.documents[0];
    }

    // Ocultar elementos de entrada
    document.getElementById('student-name').style.display = 'none';
    const botonIngresar = document.querySelector('button[onclick="ingresarEstudiante()"]');
    if (botonIngresar) {
      botonIngresar.style.display = 'none';
    }

    renderStudentCard(estudiante);
  } catch (error) {
    console.error('Error al ingresar estudiante:', error);
    alert('Error al conectar con la base de datos. Verifica la configuración.');
  }
}

function renderStudentCard(estudiante) {
  const container = document.getElementById('student-card');
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card estudiante';

  const nombre = document.createElement('h3');
  nombre.textContent = estudiante.nombre;

  const balance = document.createElement('p');
  balance.textContent = `Balance: $${estudiante.balance}`;

  const netWorth = document.createElement('p');
  netWorth.textContent = `Net Worth: $${estudiante.netWorth}`;

  const transferBtn = document.createElement('button');
  transferBtn.textContent = 'Transferir';
  transferBtn.onclick = () => mostrarTransferencia(estudiante.$id);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.onclick = () => eliminarEstudiante(estudiante.$id);

  card.append(nombre, balance, netWorth, transferBtn, deleteBtn);
  container.appendChild(card);
}

async function mostrarTransferencia(remitenteId) {
  try {
    const container = document.getElementById('student-card');

    const todos = await estudianteDatabase.listDocuments(DB_ID, COLLECTION_ID);
    const remitente = todos.documents.find(e => e.$id === remitenteId);

    const opciones = todos.documents
      .filter(e => e.$id !== remitenteId)
      .map(e => `<option value="${e.$id}">${e.nombre}</option>`)
      .join('');

    if (opciones === '') {
      alert('No hay otros estudiantes para transferir');
      return;
    }

    const html = `
      <div class="card">
        <h4>Transferir fondos</h4>
        <select id="destinatario">${opciones}</select>
        <input type="number" id="monto" placeholder="Monto a transferir" min="1" />
        <button onclick="ejecutarTransferencia('${remitenteId}')">Enviar</button>
        <button onclick="cancelarTransferencia('${remitenteId}')">Cancelar</button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
  } catch (error) {
    console.error('Error al mostrar transferencia:', error);
    alert('Error al cargar estudiantes');
  }
}

async function ejecutarTransferencia(remitenteId) {
  const monto = parseFloat(document.getElementById('monto').value);
  const destinatarioId = document.getElementById('destinatario').value;

  if (isNaN(monto) || monto <= 0) {
    alert('Monto inválido');
    return;
  }

  try {
    const remitente = await estudianteDatabase.getDocument(DB_ID, COLLECTION_ID, remitenteId);
    if (remitente.balance < monto) {
      alert('Fondos insuficientes');
      return;
    }

    const destinatario = await estudianteDatabase.getDocument(DB_ID, COLLECTION_ID, destinatarioId);

    // Actualizar balances
    await estudianteDatabase.updateDocument(DB_ID, COLLECTION_ID, remitenteId, {
      balance: remitente.balance - monto
    });

    await estudianteDatabase.updateDocument(DB_ID, COLLECTION_ID, destinatarioId, {
      balance: destinatario.balance + monto
    });

    // Actualizar la vista
    const estudianteActualizado = await estudianteDatabase.getDocument(DB_ID, COLLECTION_ID, remitenteId);
    renderStudentCard(estudianteActualizado);

    alert(`Transferencia exitosa: $${monto} enviados a ${destinatario.nombre}`);
  } catch (error) {
    console.error('Error en transferencia:', error);
    alert('Error al realizar la transferencia');
  }
}

async function cancelarTransferencia(estudianteId) {
  try {
    const estudiante = await estudianteDatabase.getDocument(DB_ID, COLLECTION_ID, estudianteId);
    renderStudentCard(estudiante);
  } catch (error) {
    console.error('Error al cancelar:', error);
  }
}

async function eliminarEstudiante(estudianteId) {
  if (confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
    try {
      await estudianteDatabase.deleteDocument(DB_ID, COLLECTION_ID, estudianteId);
      document.getElementById('student-card').innerHTML = '';
      
      // Mostrar elementos de entrada nuevamente
      document.getElementById('student-name').style.display = 'block';
      document.getElementById('student-name').value = '';
      const botonIngresar = document.querySelector('button[onclick="ingresarEstudiante()"]');
      if (botonIngresar) {
        botonIngresar.style.display = 'block';
      }
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      alert('Error al eliminar estudiante');
    }
  }
}
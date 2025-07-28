// Configuración del cliente de Appwrite para estudiantes
const estudianteClient = new Appwrite.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('688733b70004aba4f8f1');

const estudianteDatabase = new Appwrite.Databases(estudianteClient);

// IMPORTANTE: Verifica estos IDs en tu consola de Appwrite
const PROJECT_ID = '688733b70004aba4f8f1';
const DATABASE_ID = 'main'; // Cambia esto por tu Database ID real
const COLLECTION_ID = 'estudiantes'; // Verifica que esta colección existe

async function ingresarEstudiante() {
  const nombre = document.getElementById('student-name').value.trim();
  
  // Validación de entrada
  if (!nombre || nombre.length < 2) {
    alert('Por favor ingresa un nombre válido (mínimo 2 caracteres)');
    return;
  }

  // Mostrar estado de carga
  const botonIngresar = document.querySelector('button[onclick="ingresarEstudiante()"]');
  const textoOriginal = botonIngresar.textContent;
  botonIngresar.textContent = 'Conectando...';
  botonIngresar.disabled = true;

  try {
    console.log('Intentando conectar con Appwrite...');
    console.log('Database ID:', DATABASE_ID);
    console.log('Collection ID:', COLLECTION_ID);

    // Verificar si el estudiante ya existe
    const existe = await estudianteDatabase.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Appwrite.Query.equal('nombre', nombre)
    ]);

    let estudiante;
    if (existe.total === 0) {
      console.log('Creando nuevo estudiante...');
      // Crear nuevo estudiante
      estudiante = await estudianteDatabase.createDocument(
        DATABASE_ID, 
        COLLECTION_ID, 
        Appwrite.ID.unique(), 
        {
          nombre: nombre,
          balance: 1500,
          netWorth: 0
        }
      );
      console.log('Estudiante creado:', estudiante);
    } else {
      console.log('Estudiante existente encontrado');
      estudiante = existe.documents[0];
    }

    // Ocultar elementos de entrada
    document.getElementById('student-name').style.display = 'none';
    botonIngresar.style.display = 'none';

    // Mostrar tarjeta del estudiante
    renderStudentCard(estudiante);

  } catch (error) {
    console.error('Error detallado:', error);
    
    // Restaurar botón
    botonIngresar.textContent = textoOriginal;
    botonIngresar.disabled = false;
    
    // Mostrar error específico
    let mensajeError = 'Error desconocido';
    
    if (error.code === 1008) {
      mensajeError = 'ID de proyecto inválido. Verifica la configuración.';
    } else if (error.code === 404) {
      mensajeError = 'Base de datos o colección no encontrada. Verifica que existan en Appwrite.';
    } else if (error.message.includes('CORS')) {
      mensajeError = 'Error de CORS. Agrega tu dominio en la configuración de Appwrite.';
    } else if (error.message) {
      mensajeError = error.message;
    }
    
    // Mostrar error en la interfaz
    const container = document.getElementById('student-card');
    container.innerHTML = `
      <div class="card" style="background-color: #ffebee; border-color: #f44336;">
        <h3 style="color: #d32f2f;">Error de Conexión</h3>
        <p><strong>Problema:</strong> ${mensajeError}</p>
        <p><strong>Código:</strong> ${error.code || 'N/A'}</p>
        <h4>Pasos para solucionarlo:</h4>
        <ol style="text-align: left; font-size: 14px;">
          <li>Ve a <a href="https://cloud.appwrite.io/console" target="_blank">Appwrite Console</a></li>
          <li>Selecciona tu proyecto: <code>${PROJECT_ID}</code></li>
          <li>Ve a <strong>Settings → Platforms → Add Platform → Web</strong></li>
          <li>Agrega: <code>https://classroom-app-delta.vercel.app</code></li>
          <li>Ve a <strong>Databases</strong> y crea una base de datos si no existe</li>
          <li>Crea una colección llamada <code>${COLLECTION_ID}</code></li>
          <li>Agrega estos atributos a la colección:
            <ul>
              <li><code>nombre</code> (String, required)</li>
              <li><code>balance</code> (Integer, default: 1500)</li>
              <li><code>netWorth</code> (Integer, default: 0)</li>
            </ul>
          </li>
        </ol>
        <button onclick="location.reload()" style="margin-top: 10px;">Reintentar</button>
      </div>
    `;
  }
}

function renderStudentCard(estudiante) {
  const container = document.getElementById('student-card');
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card estudiante';

  card.innerHTML = `
    <h3>${estudiante.nombre}</h3>
    <p>Balance: $${estudiante.balance?.toLocaleString() || 0}</p>
    <p>Net Worth: $${estudiante.netWorth?.toLocaleString() || 0}</p>
    <p style="font-size: 10px; color: #999;">ID: ${estudiante.$id}</p>
    <div style="margin-top: 15px;">
      <button onclick="mostrarTransferencia('${estudiante.$id}')" style="margin-right: 10px;">Transferir</button>
      <button onclick="eliminarEstudiante('${estudiante.$id}')" style="background-color: #ffcdd2;">Eliminar</button>
    </div>
  `;
  
  container.appendChild(card);
}

async function mostrarTransferencia(remitenteId) {
  try {
    const container = document.getElementById('student-card');
    
    // Obtener todos los estudiantes
    const todos = await estudianteDatabase.listDocuments(DATABASE_ID, COLLECTION_ID);
    const remitente = todos.documents.find(e => e.$id === remitenteId);

    // Filtrar otros estudiantes
    const otrosEstudiantes = todos.documents.filter(e => e.$id !== remitenteId);
    
    if (otrosEstudiantes.length === 0) {
      alert('No hay otros estudiantes disponibles para transferir');
      return;
    }

    const opciones = otrosEstudiantes
      .map(e => `<option value="${e.$id}">${e.nombre} ($${e.balance})</option>`)
      .join('');

    const transferCard = document.createElement('div');
    transferCard.className = 'card';
    transferCard.style.backgroundColor = '#e8f5e8';
    transferCard.innerHTML = `
      <h4>Transferir fondos desde ${remitente.nombre}</h4>
      <p>Balance disponible: $${remitente.balance}</p>
      <select id="destinatario" style="width: 100%; margin-bottom: 10px;">${opciones}</select>
      <input type="number" id="monto" placeholder="Monto a transferir" min="1" max="${remitente.balance}" style="width: 100%; margin-bottom: 10px;" />
      <div>
        <button onclick="ejecutarTransferencia('${remitenteId}')" style="background-color: #4caf50; margin-right: 10px;">Enviar</button>
        <button onclick="cancelarTransferencia('${remitenteId}')">Cancelar</button>
      </div>
    `;
    
    container.appendChild(transferCard);
  } catch (error) {
    console.error('Error al mostrar transferencia:', error);
    alert('Error al cargar estudiantes: ' + error.message);
  }
}

async function ejecutarTransferencia(remitenteId) {
  const monto = parseFloat(document.getElementById('monto').value);
  const destinatarioId = document.getElementById('destinatario').value;

  // Validaciones
  if (isNaN(monto) || monto <= 0) {
    alert('Por favor ingresa un monto válido mayor a 0');
    return;
  }

  try {
    // Obtener datos actuales
    const remitente = await estudianteDatabase.getDocument(DATABASE_ID, COLLECTION_ID, remitenteId);
    const destinatario = await estudianteDatabase.getDocument(DATABASE_ID, COLLECTION_ID, destinatarioId);

    // Verificar fondos suficientes
    if (remitente.balance < monto) {
      alert(`Fondos insuficientes. Balance disponible: $${remitente.balance}`);
      return;
    }

    // Confirmar transferencia
    if (!confirm(`¿Confirmar transferencia de $${monto} a ${destinatario.nombre}?`)) {
      return;
    }

    // Actualizar balances
    await estudianteDatabase.updateDocument(DATABASE_ID, COLLECTION_ID, remitenteId, {
      balance: remitente.balance - monto
    });

    await estudianteDatabase.updateDocument(DATABASE_ID, COLLECTION_ID, destinatarioId, {
      balance: destinatario.balance + monto
    });

    // Actualizar la vista
    const estudianteActualizado = await estudianteDatabase.getDocument(DATABASE_ID, COLLECTION_ID, remitenteId);
    renderStudentCard(estudianteActualizado);

    alert(`✅ Transferencia exitosa!\n$${monto} enviados a ${destinatario.nombre}`);
    
  } catch (error) {
    console.error('Error en transferencia:', error);
    alert('Error al realizar la transferencia: ' + error.message);
  }
}

async function cancelarTransferencia(estudianteId) {
  try {
    const estudiante = await estudianteDatabase.getDocument(DATABASE_ID, COLLECTION_ID, estudianteId);
    renderStudentCard(estudiante);
  } catch (error) {
    console.error('Error al cancelar:', error);
    alert('Error: ' + error.message);
  }
}

async function eliminarEstudiante(estudianteId) {
  if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar este estudiante?\nEsta acción no se puede deshacer.')) {
    return;
  }

  try {
    await estudianteDatabase.deleteDocument(DATABASE_ID, COLLECTION_ID, estudianteId);
    
    // Limpiar la interfaz
    document.getElementById('student-card').innerHTML = `
      <div class="card" style="background-color: #e8f5e8;">
        <p>✅ Estudiante eliminado correctamente</p>
      </div>
    `;
    
    // Mostrar elementos de entrada nuevamente
    setTimeout(() => {
      document.getElementById('student-name').style.display = 'block';
      document.getElementById('student-name').value = '';
      const botonIngresar = document.querySelector('button[onclick="ingresarEstudiante()"]');
      if (botonIngresar) {
        botonIngresar.style.display = 'block';
        botonIngresar.disabled = false;
      }
      document.getElementById('student-card').innerHTML = '';
    }, 2000);
    
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    alert('Error al eliminar estudiante: ' + error.message);
  }
}

// Permitir envío con Enter
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('student-name');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        ingresarEstudiante();
      }
    });
  }
});
// IMPORTANTE: Esto solo funciona si estás usando un entorno tipo Vite, Webpack o similar.
// Si lo usas en navegador directo, necesitarás incluir el SDK desde CDN (puedo ayudarte con eso también).

import { Client, Databases, ID, Query } from 'appwrite';

// Configuración del cliente
const client = new Client()
  //.setEndpoint('https://cloud.appwrite.io/v1') // Descomenta si es necesario
  .setProject('688733b70004aba4f8f1');

// Inicializar base de datos
const database = new Databases(client);
const DB_ID = '688733b70004aba4f8f1';
const COLLECTION_ID = 'estudiantes';

// Función para ingresar estudiante
async function ingresarEstudiante() {
  const nombre = document.getElementById('student-name').value.trim();
  if (!nombre || nombre.length < 3) return alert('Nombre inválido');

  const existe = await database.listDocuments(DB_ID, COLLECTION_ID, [
    Query.equal('nombre', nombre)
  ]);

  let estudiante;
  if (existe.total === 0) {
    estudiante = await database.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
      nombre,
      balance: 1500,
      netWorth: 0
    });
  } else {
    estudiante = existe.documents[0];
  }

  document.getElementById('student-name').style.display = 'none';
  document.querySelector('#botonIngresar').style.display = 'none';

  renderStudentCard(estudiante);
}

// Renderizar tarjeta del estudiante
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

// Mostrar formulario de transferencia
async function mostrarTransferencia(remitenteId) {
  const container = document.getElementById('student-card');

  const todos = await database.listDocuments(DB_ID, COLLECTION_ID);
  const remitente = todos.documents.find(e => e.$id === remitenteId);

  const opciones = todos.documents
    .filter(e => e.$id !== remitenteId)
    .map(e => `<option value="${e.$id}">${e.nombre}</option>`)
    .join('');

  const html = `
    <h4>Transferir fondos</h4>
    <select id="destinatario">${opciones}</select>
    <input type="number" id="monto" placeholder="Monto a transferir" min="1" />
    <button id="btnTransferir" onclick="ejecutarTransferencia('${remitenteId}')">Enviar</button>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

// Ejecutar la transferencia
async function ejecutarTransferencia(remitenteId) {
  const btn = document.getElementById('btnTransferir');
  btn.disabled = true;

  const monto = parseFloat(document.getElementById('monto').value);
  const destinatarioId = document.getElementById('destinatario').value;

  if (isNaN(monto) || monto <= 0) {
    btn.disabled = false;
    return alert('Monto inválido');
  }

  const remitente = await database.getDocument(DB_ID, COLLECTION_ID, remitenteId);
  if (remitente.balance < monto) {
    btn.disabled = false;
    return alert('Fondos insuficientes');
  }

  const destinatario = await database.getDocument(DB_ID, COLLECTION_ID, destinatarioId);

  await database.updateDocument(DB_ID, COLLECTION_ID, remitenteId, {
    balance: remitente.balance - monto
  });

  await database.updateDocument(DB_ID, COLLECTION_ID, destinatarioId, {
    balance: destinatario.balance + monto
  });

  const estudianteActualizado = await database.getDocument(DB_ID, COLLECTION_ID, remitenteId);
  renderStudentCard(estudianteActualizado);
}

// Eliminar estudiante
async function eliminarEstudiante(estudianteId) {
  await database.deleteDocument(DB_ID, COLLECTION_ID, estudianteId);
  document.getElementById('student-card').innerHTML = '';
}

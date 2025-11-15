const API_BASE_URL = 'https://urco-backend.vercel.app'; // URL del backend

let currentUser = null;
let materialsData = []; // Variable global para materiales en calculadora

// Función para decodificar token JWT (payload solo, sin verificar firma)
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch (error) {
        console.error('Error decodificando token:', error);
        return null;
    }
}

// Evento para mostrar/ocultar campo de clave en registro
document.getElementById('reg-role').addEventListener('change', (e) => {
    const keyField = document.getElementById('key-field');
    keyField.style.display = e.target.value !== 'user' ? 'block' : 'none';
});

// Evento para cambiar modo de asignación en gestor
document.getElementById('assign-mode').addEventListener('change', (e) => {
    const manual = document.getElementById('manual-fields');
    const calculate = document.getElementById('calculate-fields');
    if (e.target.value === 'manual') {
        manual.style.display = 'block';
        calculate.style.display = 'none';
    } else {
        manual.style.display = 'none';
        calculate.style.display = 'block';
        loadMaterialsForCalc();
    }
});

// Eventos para filtros en tabla de usuarios (gestor)
document.getElementById('filter-name').addEventListener('input', filterUsersTable);
document.getElementById('filter-email').addEventListener('input', filterUsersTable);
document.getElementById('filter-address').addEventListener('input', filterUsersTable);
document.getElementById('filter-phone').addEventListener('input', filterUsersTable);
document.getElementById('filter-role').addEventListener('change', filterUsersTable);
document.getElementById('filter-points').addEventListener('input', filterUsersTable);

// Eventos para filtros en tabla de usuarios (admin)
document.getElementById('admin-filter-name').addEventListener('input', filterAdminUsersTable);
document.getElementById('admin-filter-email').addEventListener('input', filterAdminUsersTable);
document.getElementById('admin-filter-address').addEventListener('input', filterAdminUsersTable);
document.getElementById('admin-filter-phone').addEventListener('input', filterAdminUsersTable);
document.getElementById('admin-filter-role').addEventListener('change', filterAdminUsersTable);
document.getElementById('admin-filter-points').addEventListener('input', filterAdminUsersTable);

// Eventos para búsqueda global (gestor)
document.getElementById('search-name').addEventListener('input', searchUser);

// Eventos para búsqueda global (admin)
document.getElementById('admin-search-name').addEventListener('input', searchAdminUser);

// Evento para calcular puntos en tiempo real
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('calc-input')) {
        const total = calculatePointsFromMaterials();
        document.getElementById('total-points').textContent = `Puntos totales: ${total}`;
    }
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user || { email, points: 0, role: 'user' };
            console.log('Login success, user:', data.user);
            console.log('currentUser set to:', currentUser);
            showMainContent();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Registro con dirección y teléfono opcionales
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const registrationKey = document.getElementById('reg-key').value;
    const address = document.getElementById('reg-address').value;
    const phone = document.getElementById('reg-phone').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role, registrationKey, address, phone })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Registro exitoso');
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Perfil editable con dirección, teléfono, tienda, contraseña y clave personal solo para 'user'
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('edit-email').value;
    const address = document.getElementById('edit-address').value;
    const phone = document.getElementById('edit-phone').value;
    const password = document.getElementById('edit-password').value;
    const key = document.getElementById('edit-key').value;
    const storeName = document.getElementById('edit-store').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/update-profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ email, address, phone, password, key, storeName })
        });
        if (response.ok) {
            alert('Perfil actualizado');
            currentUser.email = email;
            currentUser.address = address;
            currentUser.phone = phone;
            currentUser.key = key;
            currentUser.storeName = storeName;
            bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
        } else {
            alert('Error al actualizar');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Asignar puntos (gestor/admin) con modo manual/calculado y descripción
document.getElementById('assign-points-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulario enviado');
    const mode = document.getElementById('assign-mode').value;
    console.log('Modo:', mode);
    const description = document.getElementById('assign-description').value;
    let username, points;

    if (mode === 'manual') {
        username = document.getElementById('user-name').value;
        points = document.getElementById('points-to-add').value;
        console.log('Manual: username:', username, 'points:', points);
        if (!username || !points) {
            alert('Completa todos los campos');
            return;
        }
    } else {
        username = document.getElementById('calc-user-name').value;
        console.log('Calculate: username:', username);
        if (!username) {
            alert('Completa el nombre del beneficiario');
            return;
        }
        points = calculatePointsFromMaterials();
        console.log('Puntos calculados:', points);
        if (points === 0) {
            alert('Ingresa al menos un material con cantidad');
            return;
        }
    }

    console.log('Enviando request: username:', username, 'points:', points, 'description:', description);
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/add-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ username, points, description })
        });
        console.log('Response status:', response.status);
        if (response.ok) {
            alert(`Puntos asignados: ${points}. Descripción: ${description}`);
        } else {
            const data = await response.json();
            console.log('Error response:', data);
            alert('Error: ' + (data.message || 'Desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Descontar puntos (aliado o user) con aviso
document.getElementById('deduct-points-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Inicio de deduct-points-form'); // Log 1: Ver si entra al evento
    const username = document.getElementById('deduct-name').value;
    const points = document.getElementById('points-to-deduct').value;
    const description = document.getElementById('deduct-description').value;
    const keyOrPassword = document.getElementById('deduct-key').value;

    console.log('Valores obtenidos:', { username, points, description, keyOrPassword }); // Log 2: Ver valores
    if (!username || !points) {
        alert('Completa todos los campos');
        return;
    }

    console.log('Antes de definir body'); // Log 3: Antes de definir body
    // Enviar el campo correcto según el rol
    const body = { username, points, description };
    if (currentUser.role === 'aliado') {
        body.key = keyOrPassword; // Para aliado, enviar key
    } else if (currentUser.role === 'user') {
        body.password = keyOrPassword; // Para user, enviar password
    }

    console.log('Enviando deduct-points:', body); // Log 4: El que ya tienes
    console.log('Antes del fetch'); // Log 5: Antes del fetch

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/deduct-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(body)
        });
        console.log('Después del fetch, response status:', response.status); // Log 6: Después del fetch
        if (response.ok) {
            alert('Puntos descontados');
        } else {
            const data = await response.json();
            alert(data.message || 'Error');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});


// Actualizar valores de reciclaje (gestor/admin)
document.getElementById('update-values-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const material = document.getElementById('update-material').value;
    const points = document.getElementById('update-points').value;
    const value = points;
    const description = 'Valor por kg';

    try {
        const response = await fetch(`${API_BASE_URL}/api/recycling-values`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ material, value, description })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Valores actualizados exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('updateValuesModal')).hide();
            loadRecyclingValuesTable(); // Recarga tabla
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Reciclaje (beneficiario)
document.getElementById('recycle-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const material = document.getElementById('material').value;
    const quantity = document.getElementById('quantity').value;

    const select = document.getElementById('material');
    const selectedOption = select.options[select.selectedIndex];
    const pointsPerKg = parseFloat(selectedOption.textContent.split(' - ')[1].split(' ')[0]);
    const pointsEarned = pointsPerKg * quantity;

    currentUser.points += pointsEarned;
    document.getElementById('user-points').textContent = currentUser.points;
    alert(`Reciclaje registrado. Puntos ganados: ${pointsEarned}`);
    bootstrap.Modal.getInstance(document.getElementById('recycleModal')).hide();
});

// Funciones de modales
function showRegisterModal() {
    new bootstrap.Modal(document.getElementById('registerModal')).show();
}

function showProfileModal() {
    console.log('Abriendo modal de perfil, rol:', currentUser.role);
    document.getElementById('edit-email').value = currentUser.email;
    document.getElementById('edit-address').value = currentUser.address || '';
    document.getElementById('edit-phone').value = currentUser.phone || '';
    document.getElementById('edit-password').value = '';
    const keyField = document.getElementById('key-field');
    console.log('keyField encontrado:', keyField);
    if (currentUser.role === 'user') {
        console.log('Mostrando clave personal para user');
        keyField.style.display = 'block';
        document.getElementById('edit-key').value = currentUser.key || '';
    } else {
        console.log('Ocultando clave personal, rol no es user');
        keyField.style.display = 'none';
    }
    const storeField = document.getElementById('store-field');
    if (currentUser.role === 'aliado') {
        storeField.style.display = 'block';
        document.getElementById('edit-store').value = currentUser.storeName || '';
    } else {
        storeField.style.display = 'none';
    }
    new bootstrap.Modal(document.getElementById('profileModal')).show();
}

function showRecycleModal() {
    loadMaterials();
    new bootstrap.Modal(document.getElementById('recycleModal')).show();
}

function showRedeemModal() {
    document.getElementById('redeem-points').textContent = currentUser.points;
    new bootstrap.Modal(document.getElementById('redeemModal')).show();
}

function showUpdateValuesModal() {
    new bootstrap.Modal(document.getElementById('updateValuesModal')).show();
}

function showUserManagementModal() {
    loadUsers();
    new bootstrap.Modal(document.getElementById('userManagementModal')).show();
}

// Cargar materiales
async function loadMaterials() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/recycling-values`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const materials = await response.json();
        const select = document.getElementById('material');
        select.innerHTML = '';
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.material;
            option.textContent = `${material.material} - ${material.value} puntos/kg`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading materials:', error);
    }
}

// Cargar materiales para cálculo en asignación
async function loadMaterialsForCalc() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/recycling-values`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        materialsData = await response.json(); // Guarda en variable global
        const container = document.getElementById('material-inputs');
        container.innerHTML = '';
        materialsData.forEach(material => {
            const div = document.createElement('div');
            div.className = 'mb-2';
            div.innerHTML = `
                <label>${material.material} (kg)</label>
                <input type="number" class="form-control calc-input" id="calc-${material.material}" placeholder="0">
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading materials for calc:', error);
    }
}

// Calcular puntos totales de materiales
function calculatePointsFromMaterials() {
    let totalPoints = 0;
    materialsData.forEach(material => {
        const input = document.getElementById(`calc-${material.material}`);
        if (input) {
            const quantity = parseFloat(input.value) || 0;
            totalPoints += material.value * quantity;
        }
    });
    return totalPoints;
}

// Cargar tabla global de valores de reciclaje
async function loadRecyclingValuesTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/recycling-values`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const values = await response.json();
        const tbody = document.querySelector('#recycling-values-table tbody');
        tbody.innerHTML = '';
        values.forEach(value => {
            const actions = (currentUser.role === 'gestor' || currentUser.role === 'admin') 
                ? `<button onclick="editValue('${value._id}', '${value.material}', ${value.value})">Editar</button> <button onclick="deleteValue('${value._id}')">Eliminar</button>` 
                : '';
            const row = `<tr><td>${value.material}</td><td>${value.value}</td><td>${actions}</td></tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading values:', error);
    }
}

// Editar valor (abre modal con datos pre-llenados)
function editValue(id, material, value) {
    document.getElementById('update-material').value = material;
    document.getElementById('update-points').value = value;
    showUpdateValuesModal();
}

// Eliminar valor
async function deleteValue(id) {
    if (confirm('¿Eliminar este valor?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/recycling-values/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                alert('Valor eliminado');
                loadRecyclingValuesTable();
            } else {
                alert('Error');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Cargar tabla de usuarios para gestor/admin
async function loadUsersTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const row = `<tr><td>${user.username}</td><td>${user.email}</td><td>${user.address || ''}</td><td>${user.phone || ''}</td><td>${user.role}</td><td>${user.points}</td></tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading users table:', error);
    }
}

// Filtrar tabla de usuarios (gestor)
function filterUsersTable() {
    const nameFilter = document.getElementById('filter-name').value.toLowerCase();
    const emailFilter = document.getElementById('filter-email').value.toLowerCase();
    const addressFilter = document.getElementById('filter-address').value.toLowerCase();
    const phoneFilter = document.getElementById('filter-phone').value.toLowerCase();
    const roleFilter = document.getElementById('filter-role').value;
    const pointsFilter = document.getElementById('filter-points').value;

    const rows = document.querySelectorAll('#users-table tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0].textContent.toLowerCase();
        const email = cells[1].textContent.toLowerCase();
        const address = cells[2].textContent.toLowerCase();
        const phone = cells[3].textContent.toLowerCase();
        const role = cells[4].textContent;
        const points = cells[5].textContent;

        const matches = (!nameFilter || name.includes(nameFilter)) &&
                        (!emailFilter || email.includes(emailFilter)) &&
                        (!addressFilter || address.includes(addressFilter)) &&
                        (!phoneFilter || phone.includes(phoneFilter)) &&
                        (!roleFilter || role === roleFilter) &&
                        (!pointsFilter || points === pointsFilter);
        row.style.display = matches ? '' : 'none';
    });
}

// Buscar usuario por nombre (gestor)
function searchUser() {
    const searchValue = document.getElementById('search-name').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table tbody tr');
    rows.forEach(row => {
        const name = row.querySelector('td').textContent.toLowerCase();
        row.style.display = name.includes(searchValue) ? '' : 'none';
    });
}

// Cargar tabla de usuarios para admin
async function loadAdminUsersTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        const tbody = document.querySelector('#admin-users-table tbody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const actions = (currentUser.role === 'admin') ? `<button onclick="deleteAdminUser('${user._id}')">Eliminar</button>` : '';
            const row = `<tr><td>${user.username}</td><td>${user.email}</td><td>${user.address || ''}</td><td>${user.phone || ''}</td><td>${user.role}</td><td>${user.points}</td><td>${actions}</td></tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading admin users table:', error);
    }
}

// Filtrar tabla de usuarios (admin)
function filterAdminUsersTable() {
    const nameFilter = document.getElementById('admin-filter-name').value.toLowerCase();
    const emailFilter = document.getElementById('admin-filter-email').value.toLowerCase();
    const addressFilter = document.getElementById('admin-filter-address').value.toLowerCase();
    const phoneFilter = document.getElementById('admin-filter-phone').value.toLowerCase();
    const roleFilter = document.getElementById('admin-filter-role').value;
    const pointsFilter = document.getElementById('admin-filter-points').value;

    const rows = document.querySelectorAll('#admin-users-table tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0].textContent.toLowerCase();
        const email = cells[1].textContent.toLowerCase();
        const address = cells[2].textContent.toLowerCase();
        const phone = cells[3].textContent.toLowerCase();
        const role = cells[4].textContent;
        const points = cells[5].textContent;

        const matches = (!nameFilter || name.includes(nameFilter)) &&
                        (!emailFilter || email.includes(emailFilter)) &&
                        (!addressFilter || address.includes(addressFilter)) &&
                        (!phoneFilter || phone.includes(phoneFilter)) &&
                        (!roleFilter || role === roleFilter) &&
                        (!pointsFilter || points === pointsFilter);
        row.style.display = matches ? '' : 'none';
    });
}

// Buscar usuario por nombre (admin)
function searchAdminUser() {
    const searchValue = document.getElementById('admin-search-name').value.toLowerCase();
    const rows = document.querySelectorAll('#admin-users-table tbody tr');
    rows.forEach(row => {
        const name = row.querySelector('td').textContent.toLowerCase();
        row.style.display = name.includes(searchValue) ? '' : 'none';
    });
}

// Eliminar usuario (admin)
async function deleteAdminUser(userId) {
    if (confirm('¿Eliminar este usuario?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                alert('Usuario eliminado');
                loadAdminUsersTable();
            } else {
                alert('Error al eliminar');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Toggle tabla de usuarios para admin
function toggleUsersTable() {
    const list = document.getElementById('admin-users-list');
    if (!list) {
        console.error('Elemento admin-users-list no encontrado');
        return;
    }
    if (list.style.display === 'none') {
        list.style.display = 'block';
        loadAdminUsersTable();
    } else {
        list.style.display = 'none';
    }
}

// Cargar claves de registro (admin)
async function loadRegistrationKeys() {
    console.log('loadRegistrationKeys ejecutado');
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/registration-keys`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        console.log('Response status:', response.status);
        const keys = await response.json();
        console.log('Keys received:', keys);
        const list = document.getElementById('keys-list');
        if (!list) {
            console.error('Elemento keys-list no encontrado');
            return;
        }
        list.innerHTML = '<h4>Claves de Registro</h4>';
        keys.forEach(key => {
            list.innerHTML += `<p>${key.role}: <input type="password" id="key-${key.role}" value="${key.key}"> <button onclick="updateKey('${key.role}')">Actualizar</button></p>`;
        });
        console.log('Keys list updated');
    } catch (error) {
        console.error('Error loading keys:', error);
    }
}

// Actualizar clave (admin)
async function updateKey(role) {
    const key = document.getElementById(`key-${key.role}`).value;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/registration-keys`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ role, key })
        });
        if (response.ok) {
            alert('Clave actualizada');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Generar reporte
function generateReport() {
    const data = [['Material', 'Puntos', 'Dinero'], ['Plástico', 10, 0.5]];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, 'reporte_reciclaje.xlsx');
}

// Logout
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

// Mostrar contenido principal con vistas restringidas por rol
function showMainContent() {
    console.log('Antes de ocultar login');
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    console.log('Después de mostrar main-content');
    if (!currentUser) {
        console.log('currentUser es null, redirigiendo a login');
        logout();
        return;
    }

    // Cambiar placeholder del campo deduct-key según rol
    const deductKeyField = document.getElementById('deduct-key');
    if (currentUser.role === 'aliado') {
        deductKeyField.placeholder = 'Clave del beneficiario';
    } else if (currentUser.role === 'user') {
        deductKeyField.placeholder = 'Contraseña del beneficiario';
    }

    console.log('showMainContent ejecutado, rol:', currentUser.role);
    console.log('showMainContent ejecutado, currentUser:', currentUser);
    document.getElementById('user-role-display').textContent = `Tipo de Usuario: ${currentUser.role}`;
    document.getElementById('user-points').textContent = currentUser.points;
    document.getElementById('welcome-message').textContent = `Bienvenido ${currentUser.username}`;

    // Ocultar todas las tabs primero
    const tabs = document.querySelectorAll('#roleTabs .nav-item');
    tabs.forEach(tab => tab.style.display = 'none');

    // Ocultar todos los panes de contenido
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(pane => {
        pane.classList.remove('show', 'active');
    });

    // Mostrar solo el panel correspondiente al rol
    if (currentUser.role === 'user') {
        document.getElementById('beneficiario-tab').style.display = 'block';
        document.getElementById('beneficiario').classList.add('show', 'active');
        loadPointsHistory();
    } else if (currentUser.role === 'gestor') {
        document.getElementById('gestor-tab').style.display = 'block';
        document.getElementById('gestor').classList.add('show', 'active');
        loadUsersTable();
    } else if (currentUser.role === 'aliado') {
        document.getElementById('aliado-tab').style.display = 'block';
        document.getElementById('aliado').classList.add('show', 'active');
    } else if (currentUser.role === 'admin') {
        document.getElementById('gestor-tab').style.display = 'block';
        document.getElementById('admin-tab').style.display = 'block';
        document.getElementById('admin').classList.add('show', 'active');
    }

    // Cargar tabla global para todos
    loadRecyclingValuesTable();
}
// Cargar historial de puntos (beneficiario)
async function loadPointsHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/points-history`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const history = await response.json();
        const tbody = document.querySelector('#points-history tbody');
        tbody.innerHTML = '';
        history.forEach(entry => {
            const date = new Date(entry.date).toLocaleDateString('es-ES'); // Día/mes/año
            const row = `<tr><td>${date}</td><td>${entry.type}</td><td>${entry.points}</td><td>${entry.description}</td><td>${entry.performedBy || ''}</td><td>${entry.storeName || ''}</td></tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Inicializar
window.onload = () => {
    const token = localStorage.getItem('token');
    console.log('Token en onload:', token);
    if (token) {
        const decoded = decodeToken(token);
        if (decoded) {
            currentUser = { _id: decoded._id, role: decoded.role, email: decoded.email }; // Setear básico desde token
            showMainContent();
        } else {
            logout();
        }
    }
};
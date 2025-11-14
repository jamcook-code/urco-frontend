const API_BASE_URL = 'https://urco-backend.vercel.app'; // URL del backend

let currentUser = null;

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
            showMainContent();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Registro con validación de clave
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const registrationKey = document.getElementById('reg-key').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role, registrationKey })
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

// Perfil editable
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const key = document.getElementById('edit-key').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/update-profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ username, email, key })
        });
        if (response.ok) {
            alert('Perfil actualizado');
            currentUser.username = username;
            currentUser.email = email;
            currentUser.key = key;
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
    const mode = document.getElementById('assign-mode').value;
    const description = document.getElementById('assign-description').value;
    let email, points;

    if (mode === 'manual') {
        email = document.getElementById('user-email').value;
        points = document.getElementById('points-to-add').value;
        if (!email || !points) {
            alert('Completa todos los campos');
            return;
        }
    } else {
        email = document.getElementById('calc-user-email').value;
        const quantity = document.getElementById('calc-quantity').value;
        if (!email || !quantity) {
            alert('Completa todos los campos');
            return;
        }
        const select = document.getElementById('calc-material');
        const selectedOption = select.options[select.selectedIndex];
        const pointsPerKg = parseFloat(selectedOption.textContent.split(' - ')[1].split(' ')[0]);
        points = pointsPerKg * quantity;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/add-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ email, points, description })
        });
        if (response.ok) {
            alert(`Puntos asignados: ${points}. Descripción: ${description}`);
        } else {
            alert('Error');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Descontar puntos (aliado)
document.getElementById('deduct-points-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('deduct-email').value;
    const points = document.getElementById('points-to-deduct').value;
    const description = document.getElementById('deduct-description').value;
    const key = document.getElementById('user-key').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/deduct-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ email, points, description, key })
        });
        if (response.ok) {
            alert('Puntos descontados');
        } else {
            alert('Error o clave incorrecta');
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
    document.getElementById('edit-name').value = currentUser.username || '';
    document.getElementById('edit-email').value = currentUser.email;
    document.getElementById('edit-key').value = currentUser.key || '';
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
        const materials = await response.json();
        const select = document.getElementById('calc-material');
        select.innerHTML = '';
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.material;
            option.textContent = `${material.material} - ${material.value} puntos/kg`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading materials for calc:', error);
    }
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

// Cargar tabla de usuarios (gestor/admin)
async function loadUsersTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const row = `<tr><td>${user.username}</td><td>${user.email}</td><td>${user.role}</td><td>${user.points}</td></tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading users table:', error);
    }
}

// Cargar usuarios (admin)
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        const list = document.getElementById('users-list');
        list.innerHTML = '<h4>Usuarios Registrados</h4><button onclick="exportUsers()">Exportar a Excel</button>';
        users.forEach(user => {
            list.innerHTML += `<p>${user.username} - ${user.email} - ${user.role} - Puntos: ${user.points} <button onclick="deleteUser('${user._id}')">Eliminar</button></p>`;
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Eliminar usuario (admin)
async function deleteUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            alert('Usuario eliminado');
            loadUsers();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Exportar usuarios a Excel (admin)
function exportUsers() {
    const data = [['Nombre', 'Email', 'Rol', 'Puntos']];
    // Aquí agregarías los datos reales de usuarios
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios.xlsx');
}

// Cargar claves de registro (admin)
async function loadRegistrationKeys() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/registration-keys`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const keys = await response.json();
        const list = document.getElementById('keys-list');
        list.innerHTML = '<h4>Claves de Registro</h4>';
        keys.forEach(key => {
            list.innerHTML += `<p>${key.role}: <input type="password" id="key-${key.role}" value="${key.key}"> <button onclick="updateKey('${key.role}')">Actualizar</button></p>`;
        });
    } catch (error) {
        console.error('Error loading keys:', error);
    }
}

// Actualizar clave (admin)
async function updateKey(role) {
    const key = document.getElementById(`key-${role}`).value;
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
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('user-role-display').textContent = `Tipo de Usuario: ${currentUser.role}`;
    document.getElementById('user-points').textContent = currentUser.points;

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
    loadUsersTable(); // Cargar tabla de usuarios para gestor
} else if (currentUser.role === 'aliado') {
    document.getElementById('aliado-tab').style.display = 'block';
    document.getElementById('aliado').classList.add('show', 'active');
} else if (currentUser.role === 'admin') {
    tabs.forEach(tab => tab.style.display = 'block'); // Admin ve todas
    document.getElementById('admin').classList.add('show', 'active');
    loadUsersTable(); // Cargar tabla de usuarios para admin
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
            const row = `<tr><td>${entry.date}</td><td>${entry.type}</td><td>${entry.points}</td><td>${entry.description}</td></tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading history:', error);
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
            const row = `<tr><td>${user.username}</td><td>${user.email}</td><td>${user.role}</td><td>${user.points}</td></tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading users table:', error);
    }
}

// Inicializar
window.onload = () => {
    const token = localStorage.getItem('token');
    if (token) {
        showMainContent();
    }
};
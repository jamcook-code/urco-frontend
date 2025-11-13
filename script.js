const API_BASE_URL = 'https://urco-backend.vercel.app'; // URL del backend

let currentUser = null;

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

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const key = document.getElementById('reg-key').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, key, role: 'user' }) // Siempre registra como user
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

function showRegisterModal() {
    new bootstrap.Modal(document.getElementById('registerModal')).show();
}

function showProfileModal() {
    document.getElementById('edit-name').value = currentUser.username || '';
    document.getElementById('edit-email').value = currentUser.email;
    document.getElementById('edit-key').value = currentUser.key || '';
    new bootstrap.Modal(document.getElementById('profileModal')).show();
}

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

document.getElementById('recycle-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const material = document.getElementById('material').value;
    const quantity = document.getElementById('quantity').value;

    // Calcular puntos localmente
    const select = document.getElementById('material');
    const selectedOption = select.options[select.selectedIndex];
    const pointsPerKg = parseFloat(selectedOption.textContent.split(' - ')[1].split(' ')[0]);
    const pointsEarned = pointsPerKg * quantity;

    currentUser.points += pointsEarned;
    document.getElementById('user-points').textContent = currentUser.points;
    alert(`Reciclaje registrado. Puntos ganados: ${pointsEarned}`);
    bootstrap.Modal.getInstance(document.getElementById('recycleModal')).hide();
});

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
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById('assign-points-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('user-email').value;
    const points = document.getElementById('points-to-add').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/add-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ email, points })
        });
        if (response.ok) {
            alert('Puntos asignados');
        } else {
            alert('Error');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

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

function exportUsers() {
    // Lógica para exportar usuarios a Excel (usando XLSX)
    const data = [['Nombre', 'Email', 'Rol', 'Puntos']];
    // Agrega datos de usuarios
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios.xlsx');
}

function generateReport() {
    const data = [['Material', 'Puntos', 'Dinero'], ['Plástico', 10, 0.5]];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, 'reporte_reciclaje.xlsx');
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

function showMainContent() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('user-role-display').textContent = `Tipo de Usuario: ${currentUser.role}`;
    document.getElementById('user-points').textContent = currentUser.points;

    // Ocultar tabs según rol
    if (currentUser.role === 'user') {
        document.getElementById('gestor-tab').style.display = 'none';
        document.getElementById('aliado-tab').style.display = 'none';
        document.getElementById('admin-tab').style.display = 'none';
        loadPointsHistory();
    } else if (currentUser.role === 'admin') {
        // Mostrar todas
    } else {
        document.getElementById('admin-tab').style.display = 'none';
    }
}

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

// Inicializar al cargar la página
window.onload = () => {
    const token = localStorage.getItem('token');
    if (token) {
        showMainContent();
    }
};
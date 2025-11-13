const API_BASE_URL = 'https://urco-backend.vercel.app'; // URL corregida del backend

let currentUser = null;

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/login`, { // Ruta corregida
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            // El backend devuelve solo { token }, no { user, token }
            localStorage.setItem('token', data.token);
            // Asigna un usuario básico (puedes obtener datos del token o backend si agregas ruta)
            currentUser = { email, points: 0, role: 'user' }; // Ajusta según necesidad
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
    const username = document.getElementById('reg-name').value; // Cambiado a username
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    // Ignorar phone y address por ahora (backend no los usa)
    const roleInput = document.getElementById('reg-role').value;
    // Mapear roles del frontend al backend
    const roleMap = {
        'Beneficiario': 'user',
        'Gestor URCO': 'user',
        'Aliado': 'user',
        'Administrador': 'admin'
    };
    const role = roleMap[roleInput] || 'user';

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/register`, { // Ruta corregida
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role }) // Campos corregidos
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
    document.getElementById('profile-name').textContent = currentUser.username || currentUser.email; // Ajusta si no hay username
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-role').textContent = currentUser.role;
    document.getElementById('profile-points').textContent = currentUser.points;
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
            option.textContent = `${material.material} - ${material.value} puntos/kg`; // Muestra value como puntos
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

    // Calcular puntos localmente (ya que no hay ruta /api/recycle en backend)
    // Obtener valor del material seleccionado
    const select = document.getElementById('material');
    const selectedOption = select.options[select.selectedIndex];
    const pointsPerKg = parseFloat(selectedOption.textContent.split(' - ')[1].split(' ')[0]); // Extraer puntos
    const pointsEarned = pointsPerKg * quantity;

    // Actualizar puntos del usuario localmente
    currentUser.points += pointsEarned;
    document.getElementById('user-points').textContent = currentUser.points;
    alert(`Reciclaje registrado. Puntos ganados: ${pointsEarned}`);
    bootstrap.Modal.getInstance(document.getElementById('recycleModal')).hide();

    // Nota: Si quieres enviar al backend, agrega una ruta /api/recycle en server.js
});

document.getElementById('update-values-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const material = document.getElementById('update-material').value;
    const points = document.getElementById('update-points').value;
    // Ignorar money, usar points como value
    const value = points;
    const description = 'Valor por kg'; // Descripción fija

    try {
        const response = await fetch(`${API_BASE_URL}/api/recycling-values`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ material, value, description }) // Body corregido
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

function generateReport() {
    // Lógica para generar reporte (usando XLSX)
    const data = [
        ['Material', 'Puntos', 'Dinero'],
        ['Plástico', 10, 0.5],
        ['Papel', 5, 0.2]
    ];
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
    document.getElementById('user-points').textContent = currentUser.points;
}

// Inicializar al cargar la página
window.onload = () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Verificar token (opcional)
        showMainContent();
    }
};
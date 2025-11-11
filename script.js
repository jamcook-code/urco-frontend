const API_BASE_URL = 'https://urco-nu.vercel.app'; // URL del backend

let currentUser = null;

// Función para mostrar secciones
function showSection(sectionId) {
    document.querySelectorAll('.container, .hero-section').forEach(el => el.classList.add('d-none'));
    document.getElementById(sectionId).classList.remove('d-none');
    document.getElementById('navbar').classList.remove('d-none');
}

// Función de login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            showSection('hero-section');
            loadDashboard();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error en login:', error);
    }
});

// Función de registro
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Registro exitoso');
            bootstrap.Modal.getInstance(document.getElementById('register-modal')).hide();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error en registro:', error);
    }
});

// Cargar dashboard
function loadDashboard() {
    if (currentUser) {
        document.getElementById('points-display').textContent = currentUser.points || 0;
        // Cargar materiales, etc. (puedes expandir esto)
    }
}

// Actualizar valores de reciclaje
document.getElementById('update-values-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const material = document.getElementById('material').value;
    const points = document.getElementById('points').value;
    const money = document.getElementById('money').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/recycling-values`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ material, points, money })
        });
        if (response.ok) {
            alert('Valores actualizados');
        } else {
            alert('Error al actualizar');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Generar reporte
function generateReport() {
    // Lógica para generar reporte (placeholder)
    alert('Reporte generado');
}

// Exportar a Excel
function exportToExcel() {
    // Usando XLSX para exportar datos
    const data = [
        ['Material', 'Puntos', 'Dinero'],
        ['Plástico', 10, 5],
        ['Papel', 5, 2]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, 'reporte.xlsx');
}

// Canjear puntos
function redeemPoints() {
    // Lógica para canjear puntos (placeholder)
    alert('Puntos canjeados');
}

// Administrar usuarios
function manageUsers() {
    // Lógica para administrar usuarios (placeholder)
    alert('Administrar usuarios');
}

// Logout
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    document.querySelectorAll('.container, .hero-section, #navbar').forEach(el => el.classList.add('d-none'));
    document.getElementById('login-section').classList.remove('d-none');
}

// Actualizar perfil
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const phone = document.getElementById('profile-phone').value;
    const address = document.getElementById('profile-address').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, email, phone, address })
        });
        if (response.ok) {
            alert('Perfil actualizado');
        } else {
            alert('Error al actualizar perfil');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Inicializar (mostrar login al cargar)
document.addEventListener('DOMContentLoaded', () => {
    showSection('login-section');
});
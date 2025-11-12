const API_BASE_URL = 'https://urco-nu.vercel.app'; // URL del backend

let currentUser = null;

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
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const phone = document.getElementById('reg-phone').value;
    const address = document.getElementById('reg-address').value;
    const role = document.getElementById('reg-role').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, address, role })
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
    document.getElementById('profile-name').textContent = currentUser.name;
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
        const response = await fetch(`${API_BASE_URL}/api/recycling-values`);
        const materials = await response.json();
        const select = document.getElementById('material');
        select.innerHTML = '';
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.material;
            option.textContent = material.material;
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

    try {
        const response = await fetch(`${API_BASE_URL}/api/recycle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ material, quantity })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser.points += data.pointsEarned;
            document.getElementById('user-points').textContent = currentUser.points;
            alert('Reciclaje registrado exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('recycleModal')).hide();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById('update-values-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const material = document.getElementById('update-material').value;
    const points = document.getElementById('update-points').value;
    const money = document.getElementById('update-money').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/recycling-values`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ material, points, money })
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
        // Verificar token y cargar usuario (opcional, dependiendo del backend)
        showMainContent();
    }
};
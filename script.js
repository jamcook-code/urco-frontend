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
        // Cargar materiales, etc.
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
        if (response
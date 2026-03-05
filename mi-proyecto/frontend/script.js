const API = "http://localhost:3000";
let productos = JSON.parse(localStorage.getItem('productos')) || [
    { id: 1, n: "Laptop Pro", pr: 950, owner: "admin@gmail.com" },
    { id: 2, n: "Móvil X", pr: 500, owner: "admin@gmail.com" }
];
let carrito = [];

function switchTab(tab) {
    document.getElementById('login-box').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-box').style.display = tab === 'register' ? 'block' : 'none';
}
// Función para alternar entre Login y Registro
function mostrarTab(tipo) {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const btnLogin = document.getElementById('tab-login');
    const btnRegister = document.getElementById('tab-register');

    if (tipo === 'login') {
        loginBox.style.display = 'block';
        registerBox.style.display = 'none';
        btnLogin.classList.add('active');
        btnRegister.classList.remove('active');
    } else {
        loginBox.style.display = 'none';
        registerBox.style.display = 'block';
        btnLogin.classList.remove('active');
        btnRegister.classList.add('active');
    }
}
function cambiarAuth(tipo) {
    const boxLogin = document.getElementById('box-login');
    const boxRegistro = document.getElementById('box-registro');
    const btnL = document.getElementById('btn-auth-l');
    const btnR = document.getElementById('btn-auth-r');

    if (tipo === 'login') {
        boxLogin.style.display = 'block';
        boxRegistro.style.display = 'none';
        btnL.classList.add('active');
        btnR.classList.remove('active');
    } else {
        boxLogin.style.display = 'none';
        boxRegistro.style.display = 'block';
        btnL.classList.remove('active');
        btnR.classList.add('active');
    }
}
// NUEVO: CREAR CUENTA EN EL SERVIDOR
async function crearCuenta() {
    const u = document.getElementById("regUser").value;
    const p = document.getElementById("regPass").value;
    if(!u.includes('@')) return alert("Email inválido");

    const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ u, p })
    });
    if (res.ok) {
        alert("¡Cuenta creada! Ahora inicia sesión.");
        switchTab('login');
    } else { alert("Error: El usuario ya existe"); }
}

async function login() {
    const u = document.getElementById("loginUser").value;
    const p = document.getElementById("loginPass").value;
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ u, p })
    });
    if (res.ok) {
        sessionStorage.setItem('loggedUser', u);
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("tienda-section").style.display = "block";
        renderizar();
    } else { alert("Usuario o contraseña incorrectos"); }
}

function renderizar() {
    const grid = document.getElementById("productos-grid");
    const user = sessionStorage.getItem('loggedUser');
    grid.innerHTML = productos.map(p => `
        <div class="prod-card">
            <h4>${p.n}</h4>
            <p><strong>${p.pr}€</strong></p>
            <button onclick="añadirAlCarrito('${p.n}', ${p.pr})">🛒 Añadir</button>
            ${p.owner === user ? `<button onclick="eliminarProducto(${p.id}, '${p.owner}')" style="background:#ef4444; margin-top:5px">Eliminar</button>` : ''}
        </div>
    `).join('');
}

function agregarProducto() {
    const n = prompt("Nombre del producto:");
    const pr = parseInt(prompt("Precio (€):"));
    if (n && pr) {
        productos.push({ id: Date.now(), n, pr, owner: sessionStorage.getItem('loggedUser') });
        localStorage.setItem('productos', JSON.stringify(productos));
        renderizar();
    }
}

function añadirAlCarrito(n, pr) {
    carrito.push({ n, pr });
    document.getElementById("total-precio").innerText = carrito.reduce((s, i) => s + i.pr, 0);
    document.getElementById("lista-carrito").innerHTML = carrito.map(i => `<li>${i.n} - ${i.pr}€</li>`).join('');
}

async function procesarPago() {
    const card = document.getElementById("num-tarjeta").value;
    if(card.length !== 16) return alert("La tarjeta debe tener 16 dígitos");
    
    const res = await fetch(`${API}/auth/pay`, {
        method: 'POST',
        body: JSON.stringify({ user: sessionStorage.getItem('loggedUser'), card })
    });
    if (res.ok) {
        alert("💰 Pago procesado con éxito.");
        location.reload();
    }
}

async function eliminarProducto(id, owner) {
    const res = await fetch(`${API}/auth/delete`, {
        method: 'POST',
        body: JSON.stringify({ currentUser: sessionStorage.getItem('loggedUser'), owner, id })
    });
    if (res.ok) {
        productos = productos.filter(p => p.id !== id);
        localStorage.setItem('productos', JSON.stringify(productos));
        renderizar();
    }
}
function cambiarPerfil(perfil) {
    const vVendedor = document.getElementById('vista-vendedor');
    const vComprador = document.getElementById('vista-comprador');
    const btnV = document.getElementById('btn-vendedor');
    const btnC = document.getElementById('btn-comprador');

    if (perfil === 'vendedor') {
        vVendedor.style.display = 'block';
        vComprador.style.display = 'none';
        btnV.classList.add('active');
        btnC.classList.remove('active');
    } else {
        vVendedor.style.display = 'none';
        vComprador.style.display = 'block';
        btnV.classList.remove('active');
        btnC.classList.add('active');
    }
    renderizar(); // Refrescamos los productos en la vista correcta
}

// Actualiza tu función renderizar para separar productos
function renderizar() {
    const user = sessionStorage.getItem('loggedUser');
    const gridTienda = document.getElementById("productos-grid");
    const gridMisProductos = document.getElementById("mis-productos-grid");

    // Limpiamos ambos
    gridTienda.innerHTML = "";
    gridMisProductos.innerHTML = "";

    productos.forEach(p => {
        const cardHTML = `
            <div class="prod-card">
                <h4>${p.n}</h4>
                <p>${p.pr}€</p>
                <small>Vendedor: ${p.owner}</small>
                ${p.owner === user 
                    ? `<button class="btn-eliminar" onclick="eliminarProducto(${p.id}, '${p.owner}')">Eliminar de la venta</button>` 
                    : `<button onclick="añadirAlCarrito('${p.n}', ${p.pr})">Añadir al Carrito</button>`}
            </div>
        `;

        // Si soy el dueño, va a mi panel de vendedor, si no, a la tienda
        if (p.owner === user) {
            gridMisProductos.innerHTML += cardHTML;
        } else {
            gridTienda.innerHTML += cardHTML;
        }
    });
}
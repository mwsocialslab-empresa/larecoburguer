// ==========================================
// 🔹 CONFIGURACIÓN GLOBAL
// ==========================================
const URL_SHEETS = "https://script.google.com/macros/s/AKfycbx3llkL4WfrDORPXElfA6uv7-WGfkkB68uMpXaeJ0mDaekVKRcKxzsCTo_LZvols_tN/exec";

let carrito = [];
let productosGlobal = [];
let productoSeleccionado = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarDesdeSheets();
    inicializarEventosMenu();
});

// --- CARGA DE DATOS ---
function cargarDesdeSheets() {
    const cacheBuster = new Date().getTime();
    const urlConCache = `${URL_SHEETS}?v=${cacheBuster}`;

    fetch(urlConCache, { method: 'GET', redirect: 'follow' })
    .then(r => r.json())
    .then(data => renderizarProductos(data))
    .catch(err => {
        console.error("Error:", err);
        const contenedor = document.getElementById("productos");
        if(contenedor) {
            contenedor.innerHTML = "<p class='text-center text-danger'>Error al conectar con el menú.</p>";
        }
    });
}

// --- RENDERIZADO DEL CATÁLOGO ---
function renderizarProductos(data) {
    const contenedor = document.getElementById("productos");
    if (!contenedor) return;
    
    let htmlFinal = ""; 
    let globalIndex = 0;
    productosGlobal = [];

    const categorias = ["hamburguesas", "papas", "bebidas", "promos"];

    categorias.forEach(cat => {
        if (data[cat] && data[cat].length > 0) {
            data[cat].forEach(p => {
                const precio = parseFloat(p.precio) || 0;
                productosGlobal.push({ ...p, precio, categoria: cat });

                const nombreFormateado = p.nombre.toUpperCase();

                htmlFinal += `
                    <div class="col-12 col-md-6 producto" data-categoria="${cat}">
                        <div class="card producto-card shadow-sm mb-2" onclick="verDetalle(${globalIndex})">
                            <div class="info-container">
                                <h6 class="fw-bold mb-1">${nombreFormateado}</h6>
                                <p class="descripcion-corta mb-2 text-muted small">
                                    ${p.detalle || 'Deliciosa opción de La Reco.'}
                                </p>
                                <div class="precio text-success fw-bold">$${precio.toLocaleString('es-AR')}</div>
                            </div>
                            <div class="img-container">
                                <img src="${p.imagen}" 
                                     alt="${p.nombre}" 
                                     onerror="this.src='https://via.placeholder.com/150?text=La+Reco'">
                            </div>
                        </div>
                    </div>`;
                globalIndex++;
            });
        }
    });
    contenedor.innerHTML = htmlFinal || "<p class='text-center'>No hay productos disponibles.</p>";
}

// --- VISTA DE DETALLE ---
function verDetalle(index) {
    const p = productosGlobal[index];
    if (!p) return;
    
    productoSeleccionado = { ...p, indexGlobal: index };

    document.getElementById("detalle-img").src = p.imagen;
    document.getElementById("detalle-nombre").innerText = p.nombre.toUpperCase();
    document.getElementById("detalle-precio").innerText = `$${p.precio.toLocaleString('es-AR')}`;
    document.getElementById("cant-detalle").value = 1;

    const descripcionElemento = document.getElementById("detalle-descripcion");
    if (descripcionElemento) {
        descripcionElemento.innerText = p.detalle || 'Deliciosa opción de La Reco.';
    }

    document.getElementById("hero").classList.add("d-none");
    document.getElementById("contenedor-catalogo").classList.add("d-none");
    document.getElementById("vista-detalle").classList.remove("d-none");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById("btn-agregar-detalle").onclick = () => {
    const cant = parseInt(document.getElementById("cant-detalle").value);
    if(productoSeleccionado) {
        agregarDesdeDetalle(productoSeleccionado, cant);
    }
};

// --- LÓGICA DE COMPRA ---
function agregarDesdeDetalle(prod, cant) {
    const existe = carrito.find(p => p.nombre === prod.nombre);
    if (existe) {
        existe.cantidad += cant;
    } else {
        carrito.push({ ...prod, cantidad: cant });
    }
    actualizarCarrito();
    
    const btn = document.getElementById("btn-agregar-detalle");
    
    btn.disabled = true; 
    setTimeout(() => {
        btn.innerHTML = 'AÑADIR AL PEDIDO <i class="bi bi-cart4"></i>';
        btn.disabled = false;
    }, 1500); 
}

function actualizarCarrito() {
    const listaModal = document.getElementById("listaModal");
    const totalModal = document.getElementById("totalModal");
    const contadorNav = document.getElementById("contadorNav");
    let html = "", total = 0, items = 0;

    carrito.forEach((p, i) => { 
        const sub = p.precio * p.cantidad;
        total += sub; 
        items += p.cantidad;
        
        html += `
            <div class="mb-4 border-bottom pb-3">
                <div class="row gx-2 align-items-center">
                    <div class="col-3">
                        <img src="${p.imagen}" class="img-fluid rounded shadow-sm" style="height:60px; object-fit:cover;">
                    </div>
                    <div class="col-9">
                        <h6 class="mb-0 fw-bold text-uppercase" style="font-size: 0.85rem;">${p.nombre}</h6>
                    </div>
                </div>
                <div class="row gx-2 align-items-center mt-2">
                    <div class="col-5">
                        <div class="input-group input-group-sm border rounded" style="width: 70%;">
                            <button class="btn btn-sm" onclick="modificarCantidadCarrito(${i}, -1)"><i class="bi bi-dash"></i></button>
                            <span class="form-control text-center border-0 bg-white">${p.cantidad}</span>
                            <button class="btn btn-sm" onclick="modificarCantidadCarrito(${i}, 1)"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                    <div class="col-3 text-center">
                        <button class="btn btn-sm text-danger fw-bold p-0" style="font-size: 0.65rem;" onclick="eliminarDelCarrito(${i})">ELIMINAR</button>
                    </div>
                    <div class="col-4 text-end">
                        <span class="fw-bold">$${sub.toLocaleString('es-AR')}</span>
                    </div>
                </div>
            </div>`;
    });

    if(listaModal) listaModal.innerHTML = carrito.length === 0 ? "<p class='text-center py-4'>Tu carrito está vacío 🍔</p>" : html;
    if(totalModal) totalModal.innerText = total.toLocaleString('es-AR');
    if(contadorNav) {
        contadorNav.innerText = items;
        contadorNav.style.display = items > 0 ? "block" : "none";
    }
}

function modificarCantidadCarrito(index, cambio) {
    if (carrito[index]) {
        carrito[index].cantidad += cambio;
        if (carrito[index].cantidad <= 0) {
            eliminarDelCarrito(index);
        } else {
            actualizarCarrito();
        }
    }
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

function cambiarCantidadDetalle(v) {
    const input = document.getElementById("cant-detalle");
    if (input) {
        input.value = Math.max(1, (parseInt(input.value) || 1) + v);
    }
}

function intentarAbrirCarrito() {
    if (carrito.length === 0) return mostrarToast("🛒 El carrito está vacío");
    const modalElement = document.getElementById('modalCarrito');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

// --- ENVÍO A WHATSAPP Y SHEETS ---
async function enviarPedidoWhatsApp() {
    const inputNombre = document.getElementById('nombreCliente');
    const inputDireccion = document.getElementById('direccionModal');
    const inputTelefono = document.getElementById('telefonoCliente');

    if (!inputNombre || !inputDireccion) return;

    if (!inputNombre.value.trim() || !inputDireccion.value.trim()) {
        inputNombre.classList.add("is-invalid");
        inputDireccion.classList.add("is-invalid");
        mostrarToast("⚠️ Completa nombre y dirección");
        return;
    }

    let totalAcumulado = 0;
    let itemsTextoSheets = []; 
    let itemsTextoWhatsApp = ""; 

    carrito.forEach(p => {
        const subtotal = p.precio * p.cantidad;
        totalAcumulado += subtotal;
        itemsTextoSheets.push(`${p.cantidad}x ${p.nombre.toUpperCase()}`);
        itemsTextoWhatsApp += `✅ ${p.cantidad}x - ${p.nombre.toUpperCase()}\n`;
    });

    const numeroPedido = obtenerSiguientePedido(); 
    const fechaPedido = new Date().toLocaleString('es-AR');

    const datosParaSheets = {
        pedido: numeroPedido,
        fecha: fechaPedido,
        cliente: inputNombre.value.trim().toUpperCase(),
        telefono: inputTelefono ? inputTelefono.value.trim() : "N/A",
        productos: itemsTextoSheets.join(", "),
        total: totalAcumulado,
        direccion: inputDireccion.value.trim().toUpperCase()
    };

    // 🚀 ENVIAR A SHEETS (Llamada recuperada)
    enviarPedidoASheets(datosParaSheets);

    // 📱 MENSAJE DE WHATSAPP
    let msg = `🛒 *PEDIDO N° ${numeroPedido}*\n`;
    msg += `📅 ${fechaPedido}\n`;
    msg += `👤 *CLIENTE:* ${inputNombre.value.trim().toUpperCase()}\n`;
    msg += `--------------------------\n`;
    msg += itemsTextoWhatsApp;
    msg += `--------------------------\n`;
    msg += `📍 *Dirección:* ${inputDireccion.value.trim().toUpperCase()}\n`;
    msg += `💰 *Total a pagar:* $${totalAcumulado.toLocaleString('es-AR')}\n\n`;
    msg += `🤝 *MERCADO PAGO:*\n`;
    msg += `📲 TOCÁ EN "INICIAR SESIÓN"\n`;
    msg += `👇 App: link.mercadopago.com.ar/home\n`;
    msg += `👉 Alias: *walter30mp*\n`;
    msg += `😎 No olvides mandar el comprobante de pago\n\n`;
    msg += `🙏 ¡Muchas gracias. La Reco Burger!`;

    window.open(`https://wa.me/5491127461954?text=${encodeURIComponent(msg)}`, '_blank');
}

// --- FUNCIÓN DE SOPORTE SHEETS ---
async function enviarPedidoASheets(datos) {
    try {
        await fetch(URL_SHEETS, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        console.log("Pedido enviado a Sheets ✅");
    } catch (error) {
        console.error("Error al guardar en Sheets:", error);
    }
}

// --- NAVEGACIÓN Y UTILIDADES ---
function filtrar(categoria) {
    volverAlCatalogo();
    const productosDOM = document.querySelectorAll('.producto');
    productosDOM.forEach(p => {
        const catProd = p.getAttribute('data-categoria');
        p.style.display = (categoria === 'todos' || catProd === categoria) ? "block" : "none";
    });
}

function volverAlCatalogo() {
    document.getElementById("hero").classList.remove("d-none");
    document.getElementById("contenedor-catalogo").classList.remove("d-none");
    const vistaDetalle = document.getElementById("vista-detalle");
    if (vistaDetalle) vistaDetalle.classList.add("d-none");

    document.querySelectorAll('.producto').forEach(p => p.style.display = "block");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function inicializarEventosMenu() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.getElementById('menuNav');
            if (nav && nav.classList.contains('show')) {
                bootstrap.Collapse.getInstance(nav).hide();
            }
        });
    });
}

function obtenerSiguientePedido() {
    let cuentaTotal = parseInt(localStorage.getItem('contadorAbsoluto')) || 1;
    let bloquePrefijo = Math.floor(cuentaTotal / 10000).toString().padStart(3, '0');
    let bloqueSecuencia = (cuentaTotal % 10000).toString().padStart(4, '0');
    localStorage.setItem('contadorAbsoluto', cuentaTotal + 1);
    return `${bloquePrefijo}-${bloqueSecuencia}`;
}

function mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.className = "custom-toast show";
    toast.innerText = mensaje; 
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}
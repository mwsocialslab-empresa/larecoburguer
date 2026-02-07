// ==========================================
// 🔹 CONFIGURACIÓN GLOBAL
// ==========================================
// ASEGÚRATE DE QUE ESTA URL SEA LA DE "NUEVA IMPLEMENTACIÓN"
const URL_SHEETS = "https://script.google.com/macros/s/AKfycbxG6spGShwW3BJGA7OrYlCFNEGgilEikX-MUcLUGmm7TwWErXerhoX19zgbWp5pKos/exec";

let carrito = [];
let productosGlobal = [];
let productoSeleccionado = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarDesdeSheets();
    inicializarEventosMenu();
});

// --- CARGA DE DATOS ---
function cargarDesdeSheets() {
    fetch(URL_SHEETS, { method: 'GET', redirect: 'follow' })
    .then(r => r.json())
    .then(data => renderizarProductos(data))
    .catch(err => {
        console.error("Error:", err);
        const contenedor = document.getElementById("productos");
        if(contenedor) contenedor.innerHTML = "<p class='text-center'>Error al cargar el menú.</p>";
    });
}

// --- RENDERIZADO DEL CATÁLOGO ---
function renderizarProductos(data) {
    const contenedor = document.getElementById("productos");
    if (!contenedor) return;
    
    let htmlFinal = ""; 
    let index = 0;
    productosGlobal = [];

    // Categorías de La Reco
    const categorias = ["hamburguesas", "papas", "bebidas", "promos"];

    categorias.forEach(cat => {
        if (data[cat]) {
            data[cat].forEach(p => {
                const precio = parseFloat(p.precio) || 0;
                productosGlobal.push({ ...p, precio, categoria: cat });

                const nombreFormateado = p.nombre.toUpperCase();

                htmlFinal += `
                    <div class="col-12 col-md-6 producto" data-categoria="${cat}">
                        <div class="card producto-card shadow-sm mb-2" onclick="verDetalle(${index})">
                            <div class="info-container text-start">
                                <h6 class="fw-bold mb-1">${nombreFormateado}</h6>
                                <p class="descripcion-corta mb-2 text-muted small">
                                    ${p.detalle || 'Calidad premium de La Reco.'}
                                </p>
                                <div class="precio text-success fw-bold">$${precio.toLocaleString('es-AR')}</div>
                            </div>
                            <div class="img-container">
                                <img src="${p.imagen}" alt="${p.nombre}" 
                                     onerror="this.src='https://via.placeholder.com/150?text=La+Reco'">
                            </div>
                        </div>
                    </div>`;
                index++;
            });
        }
    });
    contenedor.innerHTML = htmlFinal || "<p class='text-center'>No hay productos disponibles.</p>";
}

// --- VISTA DE DETALLE ---
function verDetalle(index) {
    const p = productosGlobal[index];
    if (!p) return;
    
    productoSeleccionado = { ...p, indexGlobal: index, talleElegido: "Único" };

    document.getElementById("detalle-img").src = p.imagen;
    document.getElementById("detalle-nombre").innerText = p.nombre.toUpperCase();
    document.getElementById("detalle-precio").innerText = `$${p.precio.toLocaleString('es-AR')}`;
    document.getElementById("detalle-descripcion").innerText = p.detalle || '';
    document.getElementById("cant-detalle").value = 1;

    // Opciones de Cocción o Talle
    const contenedorTalles = document.getElementById("detalle-talle");
    contenedorTalles.innerHTML = ""; 
    const labelTalle = document.querySelector('label[for="detalle-talle"]');

    if (p.talle && p.talle.trim() !== "" && p.talle !== "Único") {
        if(labelTalle) labelTalle.classList.remove("d-none");
        contenedorTalles.classList.remove("d-none");
        
        p.talle.split(",").forEach(t => {
            const btnTalle = document.createElement("button");
            btnTalle.innerText = t.trim();
            btnTalle.className = "btn-talle-selector"; 
            btnTalle.onclick = function() {
                document.querySelectorAll(".btn-talle-selector").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                productoSeleccionado.talleElegido = t.trim();
            };
            contenedorTalles.appendChild(btnTalle);
        });
    } else {
        if(labelTalle) labelTalle.classList.add("d-none");
        contenedorTalles.classList.add("d-none");
    }

    document.getElementById("hero").classList.add("d-none");
    document.getElementById("contenedor-catalogo").classList.add("d-none");
    document.getElementById("vista-detalle").classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Vinculación del botón añadir
document.getElementById("btn-agregar-detalle").onclick = () => {
    const cant = parseInt(document.getElementById("cant-detalle").value);
    agregarDesdeDetalle(productoSeleccionado, cant);
};

// --- LÓGICA DE COMPRA ---
function agregarDesdeDetalle(prod, cant) {
    const existe = carrito.find(p => p.nombre === prod.nombre && p.talle === prod.talleElegido);
    if (existe) {
        existe.cantidad += cant;
    } else {
        carrito.push({ ...prod, talle: prod.talleElegido, cantidad: cant });
    }

    actualizarCarrito();
    mostrarToast("¡Agregado al pedido! 🍔");
    
    const btn = document.getElementById("btn-agregar-detalle");
    btn.innerHTML = "✅ ¡AGREGADO!";
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
        total += sub; items += p.cantidad;
        const talleTexto = p.talle === "Único" ? "" : `(${p.talle})`;
        
        html += `
            <div class="mb-4 border-bottom pb-3">
                <div class="row gx-2 align-items-center">
                    <div class="col-3">
                        <img src="${p.imagen}" class="img-mini-carrito shadow-sm rounded" style="width:100%; height:60px; object-fit:cover;">
                    </div>
                    <div class="col-9">
                        <h6 class="mb-0 fw-bold text-uppercase" style="font-size: 0.85rem;">${p.nombre}</h6>
                        <small class="text-muted">${talleTexto}</small>
                    </div>
                </div>
                <div class="row gx-2 align-items-center mt-2">
                    <div class="col-5">
                        <div class="wrapper-cantidad-carrito d-flex align-items-center border rounded">
                            <button class="btn btn-sm" onclick="modificarCantidadCarrito(${i}, -1)"><i class="bi bi-dash"></i></button>
                            <span class="mx-2 fw-bold">${p.cantidad}</span>
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
    input.value = Math.max(1, (parseInt(input.value) || 1) + v);
}

function intentarAbrirCarrito() {
    if (carrito.length === 0) return mostrarToast("🛒 El carrito está vacío");
    new bootstrap.Modal(document.getElementById('modalCarrito')).show();
}

// --- ENVÍO A WHATSAPP CON VALIDACIÓN ---
function enviarPedidoWhatsApp() {
    const inputNombre = document.getElementById('nombreCliente');
    const inputTelefono = document.getElementById('telefonoCliente');
    const inputDireccion = document.getElementById('direccionModal');
    
    const campos = [inputNombre, inputTelefono, inputDireccion];
    let faltaDato = false;

    // Validación visual (Bordes rojos)
    campos.forEach(campo => {
        campo.style.borderColor = ""; 
        if (!campo.value.trim()) {
            campo.style.borderColor = "red"; 
            faltaDato = true;
        }
    });

    if (faltaDato) {
        mostrarToast("⚠️ Completa tus datos en rojo");
        return;
    }

    let totalAcumulado = 0;
    carrito.forEach(p => totalAcumulado += (p.precio * p.cantidad));

    const numeroPedido = obtenerSiguientePedido(); 
    const fechaPedido = new Date().toLocaleString('es-AR');
    
    let msg = `🍔 *LA RECO BURGER - PEDIDO N° ${numeroPedido}*\n`;
    msg += `📅 ${fechaPedido}\n`;
    msg += `--------------------------\n`;
    msg += `👤 *Cliente:* ${inputNombre.value.trim()}\n`;
    msg += `📍 *Dirección:* ${inputDireccion.value.trim()}\n`;
    msg += `--------------------------\n`;
    
    carrito.forEach(p => {
        const extra = p.talle === "Único" ? "" : ` (${p.talle})`;
        msg += `✅ ${p.cantidad}x ${p.nombre}${extra}\n`;
    });
    
    msg += `--------------------------\n`;
    msg += `💰 *TOTAL A PAGAR: $${totalAcumulado.toLocaleString('es-AR')}*\n\n`;
    msg += `🛵 _El repartidor te avisará al llegar._`;

    // Envío a Google Sheets
    fetch(URL_SHEETS, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pedido: numeroPedido,
            fecha: fechaPedido,
            nombre: inputNombre.value.trim(),
            telefono: inputTelefono.value.trim(),
            productos: carrito.map(p => `${p.cantidad}x ${p.nombre}`).join(", "),
            total: totalAcumulado,
            direccion: inputDireccion.value.trim()
        })
    });

    window.open(`https://wa.me/5491127461954?text=${encodeURIComponent(msg)}`, '_blank');
}

// --- NAVEGACIÓN ---
function filtrar(categoria) {
    cerrarMenuMobile();
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
    document.getElementById("vista-detalle").classList.add("d-none");
}

function inicializarEventosMenu() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.addEventListener('click', cerrarMenuMobile));
}

function cerrarMenuMobile() {
    const nav = document.getElementById('menuNav');
    if (nav && nav.classList.contains('show')) {
        bootstrap.Collapse.getInstance(nav).hide();
    }
}

function obtenerSiguientePedido() {
    let ultimoNum = localStorage.getItem('contadorPedido') || 0;
    let siguienteNum = parseInt(ultimoNum) + 1;
    localStorage.setItem('contadorPedido', siguienteNum);
    return siguienteNum.toString().padStart(5, '0');
}

function mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.className = "custom-toast show";
    toast.innerHTML = mensaje; 
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}document.addEventListener("DOMContentLoaded", () => {
    cargarDesdeSheets();
    inicializarEventosMenu();
});

// --- CARGA DE DATOS ---
function cargarDesdeSheets() {
    console.log("Iniciando carga desde:", URL_SHEETS);
    fetch(URL_SHEETS, { method: 'GET', redirect: 'follow' })
    .then(r => {
        if (!r.ok) throw new Error("Error en la respuesta de la red");
        return r.json();
    })
    .then(data => {
        console.log("Datos recibidos con éxito:", data);
        renderizarProductos(data);
    })
    .catch(err => {
        console.error("Error detallado:", err);
        const contenedor = document.getElementById("productos");
        if(contenedor) {
            contenedor.innerHTML = `
                <div class="text-center py-5">
                    <p class='text-danger'>No se pudo conectar con el menú.</p>
                    <button class="btn btn-sm btn-outline-dark" onclick="location.reload()">Reintentar</button>
                </div>`;
        }
    });
}

// --- RENDERIZADO DEL MENÚ ---
function renderizarProductos(data) {
    const contenedor = document.getElementById("productos");
    if (!contenedor) return;
    
    let htmlFinal = ""; 
    let index = 0;
    productosGlobal = [];

    // Nombres de las pestañas que tienes en tu imagen
    const categorias = ["hamburguesas", "papas", "bebidas", "promos"];

    categorias.forEach(cat => {
        if (data[cat] && data[cat].length > 0) {
            data[cat].forEach(p => {
                // Según tu imagen: Columna A=nombre, B=precio, C=talle, D=detalle, E=imagen
                const precio = parseFloat(p.precio) || 0;
                productosGlobal.push({ ...p, precio, categoria: cat });

                const nombreFormateado = p.nombre.toUpperCase();

                htmlFinal += `
                    <div class="col-12 col-md-6 producto" data-categoria="${cat}">
                        <div class="card producto-card shadow-sm mb-2" onclick="verDetalle(${index})">
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
                index++;
            });
        }
    });

    contenedor.innerHTML = htmlFinal || "<p class='text-center'>No hay productos cargados en la planilla.</p>";
}

// --- BUSCADOR ---
function buscarProducto() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const productosDOM = document.querySelectorAll('.producto');

    productosDOM.forEach(p => {
        const nombre = p.querySelector('h6').innerText.toLowerCase();
        if (nombre.includes(texto)) {
            p.style.display = "block";
        } else {
            p.style.display = "none";
        }
    });
}

// --- VISTA DE DETALLE ---
function verDetalle(index) {
    const p = productosGlobal[index];
    if (!p) return;
    
    productoSeleccionado = { ...p, indexGlobal: index, talleElegido: "Único" };

    document.getElementById("detalle-img").src = p.imagen;
    document.getElementById("detalle-nombre").innerText = p.nombre;
    document.getElementById("detalle-precio").innerText = `$${p.precio.toLocaleString('es-AR')}`;
    document.getElementById("detalle-descripcion").innerText = p.detalle || '';
    document.getElementById("cant-detalle").value = 1;

    // Lógica de talles/cocción
    const contenedorTalles = document.getElementById("detalle-talle");
    contenedorTalles.innerHTML = ""; 
    if (p.talle && p.talle !== "Único") {
        p.talle.split(",").forEach(t => {
            const btn = document.createElement("button");
            btn.innerText = t.trim();
            btn.className = "btn-talle-selector";
            btn.onclick = function() {
                document.querySelectorAll(".btn-talle-selector").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                productoSeleccionado.talleElegido = t.trim();
            };
            contenedorTalles.appendChild(btn);
        });
    }

    document.getElementById("hero").classList.add("d-none");
    document.getElementById("contenedor-catalogo").classList.add("d-none");
    document.getElementById("vista-detalle").classList.remove("d-none");
    window.scrollTo(0,0);
}

// --- CARRITO ---
function agregarDesdeDetalle(prod, cant) {
    const existe = carrito.find(p => p.nombre === prod.nombre && p.talle === prod.talleElegido);
    if (existe) { existe.cantidad += cant; } 
    else { carrito.push({ ...prod, talle: prod.talleElegido, cantidad: cant }); }
    actualizarCarrito();
    mostrarToast("Añadido al pedido 🍔");
}

document.getElementById("btn-agregar-detalle").onclick = () => {
    const cant = parseInt(document.getElementById("cant-detalle").value);
    agregarDesdeDetalle(productoSeleccionado, cant);
};

function actualizarCarrito() {
    const listaModal = document.getElementById("listaModal");
    const totalModal = document.getElementById("totalModal");
    const contadorNav = document.getElementById("contadorNav");

    let htmlCarrito = "";
    let sumaTotal = 0;

    // Recorremos el carrito una sola vez con un diseño limpio
    carrito.forEach((p, index) => {
        sumaTotal += p.precio * p.cantidad;
        
        // Usamos talle o talleElegido según lo que tengas guardado
        const talleAMostrar = p.talle || p.talleElegido || "Único";
            htmlCarrito += `
    <div class="container mb-4 border-bottom pb-3">
        <div class="row align-items-center">
            <div class="col-3">
                <img src="${p.imagen}" class="img-fluid rounded" style="max-height: 80px; object-fit: contain;">
            </div>
            <div class="col-9 text-start">
                <h6 class="mb-0 fw-bold">${p.nombre}</h6>
                <small class="text-muted">Talle: ${p.talle}</small>
            </div>
        </div>

        <div class="row align-items-center mt-2">
            <div class="col-4">
                <div class="input-group input-group-sm border rounded">
                    <button class="btn btn-light btn-sm" onclick="modificarCantidadCarrito(${index}, -1)">-</button>
                    <span class="form-control text-center border-0 bg-white">${p.cantidad}</span>
                    <button class="btn btn-light btn-sm" onclick="modificarCantidadCarrito(${index}, 1)">+</button>
                </div>
            </div>
            
            <div class="col-4 text-center">
                <button class="btn btn-link text-danger text-decoration-none fw-bold p-0" 
                        onclick="modificarCantidadCarrito(${index}, -${p.cantidad})">
                    ELIMINAR
                </button>
            </div>

            <div class="col-4 text-end">
                <span class="fw-bold fs-5">$${(p.precio * p.cantidad).toLocaleString('es-AR')}</span>
            </div>
        </div>
    </div>`;
        
    });

    // Inyectamos el HTML y el Total
    if (listaModal) {
        listaModal.innerHTML = carrito.length === 0 ? "<p class='text-center py-4'>Tu carrito está vacío 🍔</p>" : htmlCarrito;
    }
    if (totalModal) {
        totalModal.innerText = sumaTotal.toLocaleString('es-AR');
    }
    
    // Actualizamos el globito rojo del menú
    const itemsContador = carrito.reduce((acc, p) => acc + p.cantidad, 0);
    if(contadorNav) {
        contadorNav.innerText = itemsContador;
        contadorNav.style.display = itemsContador > 0 ? "block" : "none";
    }
}
function volverAlCatalogo() {
    document.getElementById("hero").classList.remove("d-none");
    document.getElementById("contenedor-catalogo").classList.remove("d-none");
    document.getElementById("vista-detalle").classList.add("d-none");
}

function mostrarToast(msg) {
    const t = document.createElement("div");
    t.className = "custom-toast show";
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

// --- NAVEGACIÓN ---
function filtrar(categoria) {
    volverAlCatalogo();
    const productosDOM = document.querySelectorAll('.producto');
    productosDOM.forEach(p => {
        const catProd = p.getAttribute('data-categoria');
        p.style.display = (categoria === 'todos' || catProd === categoria) ? "block" : "none";
    });
}

function inicializarEventosMenu() {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(l => l.addEventListener('click', () => {
        const menu = document.getElementById('menuNav');
        if(menu.classList.contains('show')) bootstrap.Collapse.getInstance(menu).hide();
    }));
}
// --- FUNCIÓN PARA LOS BOTONES DE LA VISTA DETALLE ---
function cambiarCantidadDetalle(v) {
    const input = document.getElementById("cant-detalle");
    if (input) {
        // Asegura que la cantidad sea al menos 1 🍔
        input.value = Math.max(1, (parseInt(input.value) || 1) + v);
    }
}
// --- FUNCIÓN PARA ABRIR EL MODAL DEL CARRITO ---
function intentarAbrirCarrito() {
    // Primero revisamos si hay algo para mostrar 🍔
    if (carrito.length === 0) {
        return mostrarToast("🛒 El carrito está vacío");
    }

    // Si hay productos, buscamos el modal por su ID y lo mostramos
    const elementoModal = document.getElementById('modalCarrito');
    if (elementoModal) {
        const miModal = new bootstrap.Modal(elementoModal);
        miModal.show();
    } else {
        console.error("No se encontró el modal con ID 'modalCarrito'");
    }
}
function validarCampos() {
    const campos = ['nombreCliente', 'telefonoCliente', 'direccionModal'];
    let todoOk = true;

    campos.forEach(id => {
        const input = document.getElementById(id);
        if (input.value.trim() === "") {
            input.classList.add("is-invalid"); // Pone el borde rojo
            todoOk = false;
        } else {
            input.classList.remove("is-invalid");
        }
    });
    return todoOk;
}
function modificarCantidadCarrito(index, cambio) {
    if (carrito[index]) {
        carrito[index].cantidad += cambio;
        
        // Si la cantidad llega a 0, lo borramos automáticamente
        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1);
        }
        
        actualizarCarrito(); // Refrescamos la vista
    }
}
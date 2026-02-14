/* ==========================================
   🔹 CONFIGURACIÓN GLOBAL Y ESTADO
   ========================================== */
const URL_SHEETS = "https://script.google.com/macros/s/AKfycbw3MZVpUNjI-lCIO7uDTjk33xZ1bdUYXqSXQGHPNm3HTUYdlladMDKjK5FCXAtWzMsp/exec";

const HORARIOS_ATENCION = {
    1: { inicio: "19:00", fin: "23:59" }, // Lun
    2: { inicio: "19:00", fin: "23:59" }, // Mar
    3: { inicio: "11:00", fin: "23:59" }, // Mie
    4: { inicio: "19:00", fin: "23:59" }, // Jue
    5: { inicio: "19:00", fin: "01:00" }, // Vie
    6: { inicio: "11:00", fin: "01:00" }, // Sab
    0: { inicio: "19:00", fin: "23:59" }  // Dom
};

const OPCIONES_ADICIONALES = [
    { nombre: "Extra carne", precio: 2000 },
    { nombre: "Extra carne + Extra Cheddar", precio: 3000 },
    { nombre: "Bacon", precio: 1000 },
    { nombre: "Tomate", precio: 1000 },
    { nombre: "Huevo", precio: 100 },
    { nombre: "Salsa Tasty", precio: 1500 }
];

let carrito = [];
let productosGlobal = [];
let productoSeleccionado = null;

/* ==========================================
   🔹 INICIALIZACIÓN
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    cargarDesdeSheets();
    inicializarEventosMenu();
    configurarEventosBotones();
});

function configurarEventosBotones() {
    const btnAgregar = document.getElementById("btn-agregar-detalle");
    if (btnAgregar) {
        btnAgregar.onclick = () => {
            if (!estaAbierto()) return mostrarAvisoCerrado();
            const cant = parseInt(document.getElementById("cant-detalle").value);
            if (productoSeleccionado) agregarDesdeDetalle(productoSeleccionado, cant);
        };
    }
    
    document.addEventListener('click', (e) => {
        const acordeon = document.getElementById('flush-horarios');
        const boton = document.querySelector('[data-bs-target="#flush-horarios"]');
        if (acordeon?.classList.contains('show') && !acordeon.contains(e.target) && !boton.contains(e.target)) {
            bootstrap.Collapse.getOrCreateInstance(acordeon).hide();
        }
    });
}

/* ==========================================
   🔹 LÓGICA DE HORARIOS
   ========================================== */
function estaAbierto() {
    const ahora = new Date();
    const dia = ahora.getDay();
    const hActual = ahora.getHours() * 100 + ahora.getMinutes();
    const h = HORARIOS_ATENCION[dia];
    if (!h) return false;
    const [hI, mI] = h.inicio.split(":").map(Number);
    const [hF, mF] = h.fin.split(":").map(Number);
    const inicio = hI * 100 + mI;
    const fin = hF * 100 + mF;
    return fin < inicio ? (hActual >= inicio || hActual <= fin) : (hActual >= inicio && hActual <= fin);
}

function mostrarAvisoCerrado() {
    const modal = new bootstrap.Modal(document.getElementById('modalCerrado'));
    modal.show();
}

/* ==========================================
   🔹 DATOS Y CATÁLOGO
   ========================================== */
function cargarDesdeSheets() {
    const url = `${URL_SHEETS}?v=${new Date().getTime()}`;
    fetch(url, { method: 'GET', redirect: 'follow' })
        .then(r => r.json())
        .then(data => renderizarProductos(data))
        .catch(err => {
            console.error("Error:", err);
            const cont = document.getElementById("productos");
            if (cont) cont.innerHTML = "<p class='text-center text-danger'>Error al conectar con el menú.</p>";
        });
}

function renderizarProductos(data) {
    const contenedor = document.getElementById("productos");
    if (!contenedor) return;
    let htmlFinal = "";
    let globalIndex = 0;
    productosGlobal = [];
    const categorias = ["hamburguesas", "papas", "bebidas", "promos"];
    categorias.forEach(cat => {
        if (data[cat]?.length > 0) {
            data[cat].forEach(p => {
                const precio = parseFloat(p.precio) || 0;
                productosGlobal.push({ ...p, precio, categoria: cat });
                htmlFinal += `
                    <div class="col-12 col-md-6 producto" data-categoria="${cat}">
                        <div class="card producto-card shadow-sm mb-2" onclick="verDetalle(${globalIndex})">
                            <div class="info-container">
                                <h6 class="fw-bold mb-1">${p.nombre.toUpperCase()}</h6>
                                <p class="descripcion-corta mb-2 text-muted small">${p.detalle || 'Opción de La Reco.'}</p>
                                <div class="precio text-success fw-bold">$${precio.toLocaleString('es-AR')}</div>
                            </div>
                            <div class="img-container">
                                <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/150?text=La+Reco'">
                            </div>
                        </div>
                    </div>`;
                globalIndex++;
            });
        }
    });
    contenedor.innerHTML = htmlFinal || "<p class='text-center'>No hay productos disponibles.</p>";
}

function verDetalle(index) {
    const p = productosGlobal[index];
    if (!p) return;
    
    productoSeleccionado = { ...p, indexGlobal: index };
    
    document.getElementById("detalle-img").src = p.imagen;
    document.getElementById("detalle-nombre").innerText = p.nombre.toUpperCase();
    document.getElementById("detalle-descripcion").innerText = p.detalle || 'Opción de La Reco.';
    document.getElementById("cant-detalle").value = 1;

    const contenedorAgregados = document.getElementById("contenedor-agregados");
    if (contenedorAgregados) {
        if (p.categoria === "hamburguesas" && p.agregados) {
            const opciones = p.agregados.split(","); 
            let htmlBotones = '<label class="fw-bold mb-2 d-block">Seleccioná el tamaño:</label><div class="d-flex gap-2 flex-wrap mb-3">';
            
            opciones.forEach((opt, i) => {
                const parts = opt.split(":");
                const nombreOpt = parts[0].trim();
                const precioOpt = parseFloat(parts[1]) || p.precio;
                const activeClass = i === 0 ? 'btn-selector-active' : '';
                
                htmlBotones += `
                    <button type="button" 
                        class="btn btn-outline-dark btn-selector ${activeClass}" 
                        onclick="seleccionarOpcion(this, '${nombreOpt}', ${precioOpt})">
                        ${nombreOpt}
                    </button>`;
            });
            
            htmlBotones += '</div>';
            
            const primerNombre = opciones[0].split(":")[0].trim();
            const primerPrecio = parseFloat(opciones[0].split(":")[1]) || p.precio;
            
            htmlBotones += `<input type="hidden" id="agregado-seleccionado" value="${primerNombre}">`;
            htmlBotones += `<input type="hidden" id="precio-seleccionado" value="${primerPrecio}">`;
            
            contenedorAgregados.innerHTML = htmlBotones;
            contenedorAgregados.classList.remove("d-none");
        } else {
            contenedorAgregados.innerHTML = "";
            contenedorAgregados.classList.add("d-none");
            const inputPrecio = document.getElementById("precio-seleccionado");
            if(inputPrecio) inputPrecio.value = p.precio;
        }
    }

    const contAdicionales = document.getElementById("contenedor-adicionales");
    const listaAdicionales = document.getElementById("lista-adicionales");

    if (p.categoria === "hamburguesas") {
        let htmlAdics = "";
        OPCIONES_ADICIONALES.forEach((adic, i) => {
            htmlAdics += `
                <div class="form-check">
                    <input class="form-check-input check-adicional" type="checkbox" 
                        value="${adic.precio}" id="adic-${i}" data-nombre="${adic.nombre}"
                        onchange="recalcularPrecioDinamico()">
                    <label class="form-check-label d-flex justify-content-between" for="adic-${i}">
                        <span>${adic.nombre}</span>
                        <span class="text-success fw-bold">+$${adic.precio.toLocaleString('es-AR')}</span>
                    </label>
                </div>`;
        });
        listaAdicionales.innerHTML = htmlAdics;
        contAdicionales.classList.remove("d-none");
    } else {
        if (contAdicionales) contAdicionales.classList.add("d-none");
    }

    document.getElementById("hero").classList.add("d-none");
    document.getElementById("contenedor-catalogo").classList.add("d-none");
    document.getElementById("vista-detalle").classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: 'smooth' });

    recalcularPrecioDinamico();
}

function seleccionarOpcion(elemento, nombre, precio) {
    const botones = elemento.parentElement.querySelectorAll('.btn-selector');
    botones.forEach(btn => btn.classList.remove('btn-selector-active'));
    elemento.classList.add('btn-selector-active');
    
    document.getElementById("agregado-seleccionado").value = nombre;
    document.getElementById("precio-seleccionado").value = precio;
    
    recalcularPrecioDinamico();
}

function recalcularPrecioDinamico() {
    const inputPrecio = document.getElementById("precio-seleccionado");
    const precioBase = inputPrecio ? parseFloat(inputPrecio.value) : (productoSeleccionado ? productoSeleccionado.precio : 0);
    
    let totalAdicionales = 0;
    document.querySelectorAll('.check-adicional:checked').forEach(check => {
        totalAdicionales += parseFloat(check.value);
    });

    const precioFinal = precioBase + totalAdicionales;
    const detallePrecioElem = document.getElementById("detalle-precio");
    if (detallePrecioElem) {
        detallePrecioElem.innerText = `$${precioFinal.toLocaleString('es-AR')}`;
    }
}

/* ==========================================
   🔹 CARRITO Y COMPRA
   ========================================= */

function animarCarrito() {
    // Buscamos el icono del camión (que es tu carrito según la captura)
    const cartContainer = document.querySelector('.bi-truck')?.parentElement || document.querySelector('[onclick="intentarAbrirCarrito()"]');
    
    if (cartContainer) {
        // 1. Quitamos la clase por si ya existía de un clic anterior
        cartContainer.classList.remove("cart-vibrate");
        
        // 2. TRUCO CRÍTICO: Forzamos un 'reflow' para que el navegador reinicie la animación
        void cartContainer.offsetWidth; 
        
        // 3. Agregamos la clase que dispara la vibración
        cartContainer.classList.add("cart-vibrate");
        
        // 4. (Opcional) Podemos hacer que el contador (el círculo rojo) también brille
        const badge = document.getElementById("contadorNav");
        if (badge) {
            badge.style.backgroundColor = "#ffc107";
            badge.style.color = "#000";
            setTimeout(() => {
                badge.style.backgroundColor = ""; // Vuelve al rojo original
                badge.style.color = "";
            }, 500);
        }
    }
}

function agregarDesdeDetalle(prod, cant) {
    const agregadoNombre = document.getElementById("agregado-seleccionado")?.value || "";
    const precioBaseElegido = parseFloat(document.getElementById("precio-seleccionado")?.value) || prod.precio;
    
    let adicionalesElegidos = [];
    let montoAdicionales = 0;
    
    document.querySelectorAll('.check-adicional:checked').forEach(check => {
        adicionalesElegidos.push(check.getAttribute('data-nombre'));
        montoAdicionales += parseFloat(check.value);
    });

    const precioUnitarioFinal = precioBaseElegido + montoAdicionales;
    
    let nombreFinal = (prod.categoria === "hamburguesas" && agregadoNombre) 
        ? `${prod.nombre} (${agregadoNombre})` 
        : prod.nombre;
    
    if (adicionalesElegidos.length > 0) {
        nombreFinal += ` + [${adicionalesElegidos.join(", ")}]`;
    }

    const idUnico = nombreFinal;

    const existe = carrito.find(p => p.idUnico === idUnico);
    if (existe) {
        existe.cantidad += cant;
    } else {
        carrito.push({ 
            ...prod, 
            idUnico: idUnico,
            nombre: nombreFinal, 
            precio: precioUnitarioFinal, 
            cantidad: cant 
        });
    }
    
    actualizarCarrito();
    animarCarrito();
    volverAlCatalogo();
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

        const regexTamaño = /\((.*?)\)/;
        const regexAdicionales = /\[(.*?)\]/;
        
        const tamañoMatch = p.nombre.match(regexTamaño);
        const adicionalesMatch = p.nombre.match(regexAdicionales);
        
        const nombreLimpio = p.nombre.split('(')[0].split('+')[0].trim();
        const tamaño = tamañoMatch ? tamañoMatch[1] : "";
        const listaAdics = adicionalesMatch ? adicionalesMatch[1].split(', ') : [];

        html += `
            <div class="mb-4 border-bottom pb-3">
                <div class="row gx-2 align-items-center">
                    <div class="col-3">
                        <img src="${p.imagen}" class="img-fluid rounded shadow-sm" style="height:60px; object-fit:cover;">
                    </div>
                    <div class="col-9">
                        <h6 class="mb-0 fw-bold text-uppercase" style="font-size:0.85rem;">${nombreLimpio}</h6>
                        ${tamaño ? `<span class="badge-reco-yellow">${tamaño.toUpperCase()}</span>` : ''}
                        ${listaAdics.length > 0 ? `
                            <div class="mt-2">
                                <small class="text-muted d-block fw-bold" style="font-size:0.65rem;">ADICIONALES:</small>
                                ${listaAdics.map(adic => {
                                    const info = OPCIONES_ADICIONALES.find(a => a.nombre === adic.trim());
                                    const precioAdic = info ? info.precio : 0;
                                    return `
                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                            <span class="badge-reco-yellow-sm">${adic.toUpperCase()}</span>
                                            <small class="fw-bold text-success" style="font-size:0.7rem;">+$${precioAdic.toLocaleString('es-AR')}</small>
                                        </div>`;
                                }).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="row gx-2 align-items-center mt-2">
                    <div class="col-5">
                        <div class="input-group input-group-sm border rounded" style="width:70%;">
                            <button class="btn btn-sm" onclick="modificarCantidadCarrito(${i},-1)"><i class="bi bi-dash"></i></button>
                            <span class="form-control text-center border-0 bg-white">${p.cantidad}</span>
                            <button class="btn btn-sm" onclick="modificarCantidadCarrito(${i},1)"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                    <div class="col-3 text-center">
                        <button class="btn btn-sm text-danger fw-bold p-0" style="font-size:0.65rem;" onclick="eliminarDelCarrito(${i})">ELIMINAR</button>
                    </div>
                    <div class="col-4 text-end">
                        <span class="fw-bold">$${sub.toLocaleString('es-AR')}</span>
                    </div>
                </div>
            </div>`;
    });

    if (listaModal) listaModal.innerHTML = carrito.length === 0 ? "<p class='text-center py-4'>Tu carrito está vacío 🍔</p>" : html;
    if (totalModal) totalModal.innerText = total.toLocaleString('es-AR');
    if (contadorNav) {
        contadorNav.innerText = items;
        contadorNav.style.display = items > 0 ? "block" : "none";
    }

    const btnFinalizar = document.querySelector('#modalCarrito .btn-success');
    if (btnFinalizar) {
        if (!estaAbierto()) {
            btnFinalizar.classList.replace('btn-success', 'btn-secondary');
            btnFinalizar.innerHTML = 'LOCAL CERRADO 😴';
            btnFinalizar.onclick = mostrarAvisoCerrado;
        } else {
            btnFinalizar.classList.replace('btn-secondary', 'btn-success');
            btnFinalizar.innerHTML = 'FINALIZAR PEDIDO';
            btnFinalizar.onclick = enviarPedidoWhatsApp;
        }
    }
}

async function enviarPedidoWhatsApp() {
    const nom = document.getElementById('nombreCliente')?.value.trim().toUpperCase();
    const dir = document.getElementById('direccionModal')?.value.trim().toUpperCase();
    const tel = document.getElementById('telefonoCliente')?.value.trim() || "N/A";
    
    if (!estaAbierto()) return mostrarAvisoCerrado();
    if (!nom || !dir) {
        document.getElementById('nombreCliente').classList.add("is-invalid");
        document.getElementById('direccionModal').classList.add("is-invalid");
        return mostrarToast("⚠️ Completa nombre y dirección");
    }

    let total = 0, itemsWS = "", itemsSheets = [];
    carrito.forEach(p => {
        total += (p.precio * p.cantidad);
        itemsSheets.push(`${p.cantidad}x ${p.nombre.toUpperCase()}`);
        itemsWS +=`✅ ${p.cantidad}x - ${p.nombre.toUpperCase()}\n`;
    });

    const pedidoNum = obtenerSiguientePedido();
    const fecha = new Date().toLocaleString('es-AR');
    enviarPedidoASheets({ pedido: pedidoNum, fecha, cliente: nom, telefono: tel, productos: itemsSheets.join(", "), total, direccion: dir });
    
    const linkApp = "link.mercadopago.com.ar/home"; 
    let msg =`🛒 *PEDIDO N° ${pedidoNum}*\n📅 ${fecha}\n👤 *CLIENTE:* ${nom}\n--------------------------\n${itemsWS}--------------------------\n📍 *Dirección:* ${dir}\n💰 *Total:* $${total.toLocaleString('es-AR')}\n\n`;
    msg +=`🤝 *MERCADO PAGO:*\n📲 *TOCÁ EN "INICIAR SESIÓN"*\n👇 App: ${linkApp}\n👉 Alias: *Alias-ejemplo*\n😎 *No olvides mandar el comprobante de pago*\n\n🙏 ¡Muchas gracias!`;

    window.open(`https://wa.me/5491127461954?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ==========================================
   🔹 UTILIDADES
   ========================================== */
function buscarProducto() {
    if (!document.getElementById("vista-detalle").classList.contains("d-none")) volverAlCatalogo();
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    document.querySelectorAll('.producto').forEach(tarjeta => {
        const nombre = tarjeta.querySelector('h6').innerText.toLowerCase();
        tarjeta.style.display = nombre.includes(busqueda) ? "block" : "none";
    });
}

function filtrar(cat) {
    volverAlCatalogo();
    document.querySelectorAll('.producto').forEach(p => {
        p.style.display = (cat === 'todos' || p.getAttribute('data-categoria') === cat) ? "block" : "none";
    });
}

function volverAlCatalogo() {
    document.getElementById("hero").classList.remove("d-none");
    document.getElementById("contenedor-catalogo").classList.remove("d-none");
    document.getElementById("vista-detalle").classList.add("d-none");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function modificarCantidadCarrito(i, c) {
    if (carrito[i]) {
        carrito[i].cantidad += c;
        if (carrito[i].cantidad <= 0) eliminarDelCarrito(i);
        else actualizarCarrito();
    }
}

function eliminarDelCarrito(i) {
    carrito.splice(i, 1);
    actualizarCarrito();
}

function cambiarCantidadDetalle(v) {
    const input = document.getElementById("cant-detalle");
    if (input) input.value = Math.max(1, (parseInt(input.value) || 1) + v);
}

function intentarAbrirCarrito() {
    if (carrito.length === 0) return mostrarToast("🛒 El carrito está vacío");
    new bootstrap.Modal(document.getElementById('modalCarrito')).show();
}

async function enviarPedidoASheets(datos) {
    try { await fetch(URL_SHEETS, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }); }
    catch (e) { console.error("Error Sheets:", e); }
}

function inicializarEventosMenu() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.getElementById('menuNav');
            if (nav?.classList.contains('show')) bootstrap.Collapse.getInstance(nav).hide();
        });
    });
}

function obtenerSiguientePedido() {
    let cuenta = (parseInt(localStorage.getItem('contadorAbsoluto')) || 1);
    localStorage.setItem('contadorAbsoluto', cuenta + 1);
    return `${Math.floor(cuenta / 10000).toString().padStart(3, '0')}-${(cuenta % 10000).toString().padStart(4, '0')}`;
}

function mostrarToast(m) {
    const t = document.createElement('div');
    t.className = "custom-toast show"; t.innerText = m;
    document.body.appendChild(t);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 2500);
}
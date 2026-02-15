/* ==========================================
   🔹 CONFIGURACIÓN GLOBAL Y ESTADO
   ========================================== */
const URL_SHEETS = "https://script.google.com/macros/s/AKfycbw3MZVpUNjI-lCIO7uDTjk33xZ1bdUYXqSXQGHPNm3HTUYdlladMDKjK5FCXAtWzMsp/exec";

const HORARIOS_ATENCION = {
    1: { inicio: "19:00", fin: "23:59" }, 2: { inicio: "19:00", fin: "23:59" },
    3: { inicio: "11:00", fin: "23:59" }, 4: { inicio: "19:00", fin: "23:59" },
    5: { inicio: "11:00", fin: "01:00" }, 6: { inicio: "11:00", fin: "01:00" },
    0: { inicio: "11:00", fin: "23:59" }
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
   🔹 1. INICIALIZACIÓN Y NAVEGACIÓN (Fix Nav)
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    cargarDesdeSheets();
    inicializarEventosMenu();
    configurarEventosBotones();
});

function inicializarEventosMenu() {
    // Cerramos el menú mobile al hacer clic en cualquier link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.getElementById('menuNav');
            const bsCollapse = bootstrap.Collapse.getInstance(nav);
            if (bsCollapse) bsCollapse.hide();
        });
    });
}

function filtrar(cat) {
    volverAlCatalogo();
    document.querySelectorAll('.producto').forEach(p => {
        p.style.display = (cat === 'todos' || p.getAttribute('data-categoria') === cat) ? "block" : "none";
    });
}

function buscarProducto() {
    volverAlCatalogo();
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    document.querySelectorAll('.producto').forEach(tarjeta => {
        const nombre = tarjeta.querySelector('h6').innerText.toLowerCase();
        tarjeta.style.display = nombre.includes(busqueda) ? "block" : "none";
    });
}

/* ==========================================
   🔹 2. DATOS Y RENDERIZADO
   ========================================== */
function cargarDesdeSheets() {
    const url = `${URL_SHEETS}?v=${new Date().getTime()}`;
    fetch(url, { method: 'GET', redirect: 'follow' })
        .then(r => r.json())
        .then(data => renderizarProductos(data))
        .catch(err => {
            console.error("Error:", err);
            document.getElementById("productos").innerHTML = "<p class='text-center text-danger'>Error al conectar.</p>";
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
                const rutaImg = p.imagen.startsWith('http') ? p.imagen : `./${p.imagen}`;

                htmlFinal += `
                    <div class="col-12 col-md-6 producto" data-categoria="${cat}">
                        <div class="card producto-card shadow-sm mb-2" onclick="verDetalle(${globalIndex})">
                            <div class="info-container">
                                <h6 class="fw-bold mb-1">${p.nombre.toUpperCase()}</h6>
                                <p class="descripcion-corta mb-2 text-muted small">${p.detalle || 'Opción de La Reco.'}</p>
                                <div class="precio text-success fw-bold">$${precio.toLocaleString('es-AR')}</div>
                            </div>
                            <div class="img-container">
                                <img src="${rutaImg}" onerror="this.src='https://placehold.co/150?text=La+Reco'">
                            </div>
                        </div>
                    </div>`;
                globalIndex++;
            });
        }
    });
    contenedor.innerHTML = htmlFinal;
}

/* ==========================================
   🔹 3. VISTA DETALLE (Fix Amarillo y Títulos)
   ========================================== */
function verDetalle(index, cantidadPrevia = 1) {
    const p = productosGlobal[index];
    if (!p) return;
    
    productoSeleccionado = { ...p, indexGlobal: index };
    
    document.getElementById("detalle-img").src = p.imagen.startsWith('http') ? p.imagen : `./${p.imagen}`;
    document.getElementById("detalle-nombre").innerText = p.nombre.toUpperCase();
    document.getElementById("detalle-descripcion").innerText = p.detalle || 'Opción de La Reco.';
    document.getElementById("cant-detalle").value = cantidadPrevia; // Mantiene la cantidad si venimos de Editar

    const contAgregados = document.getElementById("contenedor-agregados");
    const contAdicionales = document.getElementById("contenedor-adicionales");
    const listaAdics = document.getElementById("lista-adicionales");

    contAgregados.innerHTML = "";
    listaAdics.innerHTML = "";

    if (p.categoria === "hamburguesas") {
        contAdicionales.classList.remove("d-none");
        
        if (p.agregados) {
            const opciones = p.agregados.split(","); 
            let htmlBotones = '<label class="fw-bold mb-2 d-block small">SELECCIONÁ EL TAMAÑO:</label><div class="d-flex gap-2 flex-wrap mb-3">';
            opciones.forEach((opt, i) => {
                const parts = opt.split(":");
                const nom = parts[0].trim();
                const pre = parseFloat(parts[1]) || p.precio;
                // Clase btn-selector para el estilo amarillo
                htmlBotones += `<button type="button" class="btn btn-outline-dark btn-selector ${i === 0 ? 'btn-selector-active' : ''}" onclick="seleccionarOpcion(this, '${nom}', ${pre})">${nom.toUpperCase()}</button>`;
            });
            htmlBotones += `</div><input type="hidden" id="agregado-seleccionado" value="${opciones[0].split(":")[0].trim()}"><input type="hidden" id="precio-seleccionado" value="${parseFloat(opciones[0].split(":")[1]) || p.precio}">`;
            contAgregados.innerHTML = htmlBotones;
            contAgregados.classList.remove("d-none");
        }

        let htmlChecks = '<label class="fw-bold mb-2 d-block small">ADICIONALES:</label>';
        OPCIONES_ADICIONALES.forEach((adic, i) => {
            htmlChecks += `
                <div class="form-check mb-2">
                    <input class="form-check-input check-adicional" type="checkbox" value="${adic.precio}" id="adic-${i}" data-nombre="${adic.nombre}" onchange="recalcularPrecioDinamico()">
                    <label class="form-check-label d-flex justify-content-between w-100" for="adic-${i}">
                        <span class="small">${adic.nombre.toUpperCase()}</span> <span class="text-success fw-bold">+$${adic.precio}</span>
                    </label>
                </div>`;
        });
        listaAdics.innerHTML = htmlChecks;
    }

    document.getElementById("hero").classList.add("d-none");
    document.getElementById("contenedor-catalogo").classList.add("d-none");
    document.getElementById("vista-detalle").classList.remove("d-none");
    window.scrollTo(0,0);
    recalcularPrecioDinamico();
}

/* ==========================================
   🔹 4. CARRITO (Fix Editar y Badges)
   ========================================== */
function agregarDesdeDetalle(prod, cant) {
    const agregadoNom = document.getElementById("agregado-seleccionado")?.value || "";
    const precioBaseIndividual = parseFloat(document.getElementById("precio-seleccionado")?.value) || prod.precio;
    
    let adicsNom = [];
    let extraPrecio = 0;
    
    // Recolectamos adicionales seleccionados
    document.querySelectorAll('.check-adicional:checked').forEach(c => {
        adicsNom.push(c.getAttribute('data-nombre').toUpperCase());
        extraPrecio += parseFloat(c.value);
    });

    // --- FIX: Definición de nombreFinal ---
    let nombreFinal = prod.nombre.toUpperCase();
    if (agregadoNom) nombreFinal += ` (${agregadoNom.toUpperCase()})`;
    if (adicsNom.length > 0) nombreFinal += ` + [${adicsNom.join(", ")}]`;

    // Agregamos al carrito con todos los datos necesarios para el diseño
    carrito.push({
        ...prod,
        nombreCompleto: nombreFinal,
        nombreBase: prod.nombre,
        precioBaseIndividual: precioBaseIndividual, // Para mostrar el precio de la medida a la derecha
        precio: precioBaseIndividual + extraPrecio, // Precio unitario total
        cantidad: cant,
        imagen: prod.imagen.startsWith('http') ? prod.imagen : `./${prod.imagen}`
    });

    actualizarCarrito();
    animarCarrito();
    mostrarToast("¡Añadido! 🍔");
    volverAlCatalogo();
}

function actualizarCarrito() {
    const lista = document.getElementById("listaModal");
    const totalModal = document.getElementById("totalModal");
    const badgeNav = document.getElementById("contadorNav"); // Referencia al número del carrito
    let html = "", total = 0, itemsTotales = 0;

    carrito.forEach((p, i) => {
        const sub = p.precio * p.cantidad;
        total += sub;
        itemsTotales += p.cantidad; // Sumamos las cantidades para el contador

        // Extraemos medida y adicionales
        const medidaMatch = p.nombreCompleto.match(/\((.*?)\)/);
        const adicsMatch = p.nombreCompleto.match(/\[(.*?)\]/);
        
        const medida = medidaMatch ? medidaMatch[1] : "";
        const listaAdics = adicsMatch ? adicsMatch[1].split(", ") : [];

        html += `
            <div class="mb-4 border-bottom pb-3">
                <div class="d-flex gap-3">
                    <img src="${p.imagen}" style="width:70px; height:70px; object-fit:cover;" class="rounded shadow-sm">
                    <div class="flex-grow-1">
                        <h6 class="fw-bold mb-1">${p.nombreBase.toUpperCase()}</h6>
                        
                        ${medida ? `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge-reco-yellow">${medida.toUpperCase()}</span>
                                <span class="text-success fw-bold small">$${p.precioBaseIndividual?.toLocaleString('es-AR') || ''}</span>
                            </div>
                        ` : ''}
                        
                        ${listaAdics.length > 0 ? `
                            <div class="small fw-bold text-muted mb-1">ADICIONALES:</div>
                            ${listaAdics.map(a => {
                                const infoAdic = OPCIONES_ADICIONALES.find(o => o.nombre.toUpperCase() === a.trim().toUpperCase());
                                const precioAdic = infoAdic ? `+$${infoAdic.precio.toLocaleString('es-AR')}` : "";
                                return `
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <span class="badge-reco-yellow-sm">${a}</span>
                                        <span class="text-success fw-bold small">${precioAdic}</span>
                                    </div>`;
                            }).join('')}
                        ` : ''}
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="input-group input-group-sm border rounded-pill overflow-hidden" style="width:100px;">
                        <button class="btn btn-sm px-2" onclick="modificarCantidadCarrito(${i},-1)">-</button>
                        <span class="form-control text-center border-0 bg-transparent fw-bold p-0" style="line-height:30px;">${p.cantidad}</span>
                        <button class="btn btn-sm px-2" onclick="modificarCantidadCarrito(${i},1)">+</button>
                    </div>
                    
                    <div class="d-flex gap-2">
                        <button class="btn btn-link btn-sm text-warning fw-bold text-decoration-none p-0" onclick="editarProductoCarrito(${i})">EDITAR</button>
                        <button class="btn btn-link btn-sm text-danger fw-bold text-decoration-none p-0" onclick="eliminarDelCarrito(${i})">ELIMINAR</button>
                    </div>
                    
                    <span class="fw-bold" style="font-size: 1.1rem;">$${sub.toLocaleString('es-AR')}</span>
                </div>
            </div>`;
    });

    lista.innerHTML = html || "<p class='text-center py-4'>Tu pedido está vacío 🍔</p>";
    totalModal.innerText = total.toLocaleString('es-AR'); 

    // --- ARREGLO DEL CONTADOR ---
    if (badgeNav) {
        badgeNav.innerText = itemsTotales; // Ponemos el número total de productos
        badgeNav.style.display = itemsTotales > 0 ? "flex" : "none"; // Si es 0 se oculta
    }
}

function editarProductoCarrito(index) {
    const item = carrito[index];
    const idxGlobal = productosGlobal.findIndex(p => p.nombre.toUpperCase() === item.nombreBase.toUpperCase());
    
    if (idxGlobal !== -1) {
        // 1. Extraer medida y adicionales del nombre guardado
        const medidaMatch = item.nombreCompleto.match(/\((.*?)\)/);
        const medidaPrevia = medidaMatch ? medidaMatch[1] : "";
        const adicsMatch = item.nombreCompleto.match(/\[(.*?)\]/);
        const listaAdicsPrevia = adicsMatch ? adicsMatch[1].split(", ") : [];

        // 2. Cerrar carrito y abrir detalle
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCarrito')).hide();
        verDetalle(idxGlobal, item.cantidad);

        // 3. Restaurar lo que ya estaba seleccionado (con un pequeño delay para que cargue el HTML)
        setTimeout(() => {
            // Seleccionar el tamaño (Medida)
            if (medidaPrevia) {
                document.querySelectorAll('.btn-selector').forEach(btn => {
                    if (btn.innerText.trim() === medidaPrevia.toUpperCase()) btn.click();
                });
            }

            // Marcar los adicionales (Checks)
            if (listaAdicsPrevia.length > 0) {
                listaAdicsPrevia.forEach(nombreAdic => {
                    document.querySelectorAll('.check-adicional').forEach(check => {
                        if (check.getAttribute('data-nombre').toUpperCase() === nombreAdic.trim().toUpperCase()) {
                            check.checked = true;
                        }
                    });
                });
                recalcularPrecioDinamico();
            }
        }, 100);

        // 4. Sacar del carrito el item viejo
        carrito.splice(index, 1);
        actualizarCarrito();
    }
}
/* ==========================================
   🔹 FUNCIÓN PARA LOS BOTONES + Y - DEL DETALLE
   ========================================== */
/* ==========================================
   🔹 ACTUALIZACIÓN DE CANTIDAD Y PRECIO DINÁMICO
   ========================================== */
function cambiarCantidadDetalle(valor) {
    const inputCant = document.getElementById("cant-detalle");
    if (inputCant) {
        let actual = parseInt(inputCant.value) || 1;
        let nueva = actual + valor;
        
        if (nueva >= 1) {
            inputCant.value = nueva;
            // Llamamos a la función que ya tenés para que multiplique el precio por la nueva cantidad
            recalcularPrecioDinamico();
        }
    }
}

// Modificamos levemente esta para que incluya la multiplicación por cantidad

/* ==========================================
   🔹 UTILIDADES EXTRAS
   ========================================== */
function configurarEventosBotones() {
    const btnAgregar = document.getElementById("btn-agregar-detalle");
    if (btnAgregar) {
        btnAgregar.onclick = () => {
            if (!estaAbierto()) return mostrarAvisoCerrado();
            const cant = parseInt(document.getElementById("cant-detalle").value);
            if (productoSeleccionado) agregarDesdeDetalle(productoSeleccionado, cant);
        };
    }

    // --- NUEVA LÓGICA PARA BOTONES + y - EN DETALLE ---
    const btnMas = document.querySelector(".btn-detalle-mas");
    const btnMenos = document.querySelector(".btn-detalle-menos");
    const inputCant = document.getElementById("cant-detalle");

    if (btnMas && inputCant) {
        btnMas.onclick = () => {
            let actual = parseInt(inputCant.value) || 1;
            inputCant.value = actual + 1;
        };
    }

    if (btnMenos && inputCant) {
        btnMenos.onclick = () => {
            let actual = parseInt(inputCant.value) || 1;
            if (actual > 1) inputCant.value = actual - 1;
        };
    }
}

function seleccionarOpcion(el, nom, pre) {
    el.parentElement.querySelectorAll('.btn-selector').forEach(b => b.classList.remove('btn-selector-active'));
    el.classList.add('btn-selector-active');
    document.getElementById("agregado-seleccionado").value = nom;
    document.getElementById("precio-seleccionado").value = pre;
    recalcularPrecioDinamico();
}

function recalcularPrecioDinamico() {
    // 1. Obtenemos el precio base (ya sea el seleccionado en los botones amarillos o el original)
    const base = parseFloat(document.getElementById("precio-seleccionado")?.value) || productoSeleccionado?.precio || 0;
    
    // 2. Obtenemos la cantidad del input (el número 9 de tu imagen)
    const cantidad = parseInt(document.getElementById("cant-detalle")?.value) || 1;
    
    // 3. Sumamos todos los adicionales seleccionados
    let extra = 0;
    document.querySelectorAll('.check-adicional:checked').forEach(c => {
        extra += parseFloat(c.value);
    });
    
    // 4. Calculamos el total: (Precio Base + Extras) x Cantidad
    const totalVenta = (base + extra) * cantidad;
    
    // 5. Mostramos el resultado final bajo el nombre Tasty
    const elementoPrecio = document.getElementById("detalle-precio");
    if (elementoPrecio) {
        elementoPrecio.innerText = `$${totalVenta.toLocaleString('es-AR')}`;
    }
}
function volverAlCatalogo() {
    document.getElementById("hero").classList.remove("d-none");
    document.getElementById("contenedor-catalogo").classList.remove("d-none");
    document.getElementById("vista-detalle").classList.add("d-none");
    window.scrollTo(0,0);
}

function modificarCantidadCarrito(i, c) {
    if (carrito[i]) {
        carrito[i].cantidad += c;
        if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
        actualizarCarrito();
    }
}

function eliminarDelCarrito(i) { carrito.splice(i, 1); actualizarCarrito(); }

function mostrarToast(m) {
    const t = document.createElement('div');
    t.className = "custom-toast show"; t.innerText = m;
    document.body.appendChild(t);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 2500);
}

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

function animarCarrito() {
    const icon = document.querySelector('.bi-truck')?.parentElement || document.querySelector('[onclick="intentarAbrirCarrito()"]');
    if (icon) {
        icon.classList.remove("cart-vibrate");
        void icon.offsetWidth;
        icon.classList.add("cart-vibrate");
    }
}

function intentarAbrirCarrito() {
    if (carrito.length === 0) return mostrarToast("🛒 El carrito está vacío");
    new bootstrap.Modal(document.getElementById('modalCarrito')).show();
}
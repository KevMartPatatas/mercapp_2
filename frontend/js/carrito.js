
      // 1. Cargar carrito desde LocalStorage
      let carrito = JSON.parse(localStorage.getItem("mercapp_carrito")) || [];
      const container = document.getElementById("cartItemsContainer");
      const emptyState = document.getElementById("emptyCartState");
      const totalDisplay = document.getElementById("totalPrice");
      const subtotalDisplay = document.getElementById("subtotalPrice");
      const cartCountBadge = document.getElementById("cartCount");

      function renderizarCarrito() {
        container.innerHTML = "";
        let total = 0;

        const totalItems = carrito.reduce(
          (acc, item) => acc + item.cantidad,
          0
        );
        if (cartCountBadge) {
          cartCountBadge.innerText = totalItems;
          cartCountBadge.style.display =
            totalItems > 0 ? "inline-block" : "none";
        }

        if (carrito.length === 0) {
          emptyState.classList.remove("d-none");
          totalDisplay.innerText = "$0.00";
          subtotalDisplay.innerText = "$0.00";
          return;
        } else {
          emptyState.classList.add("d-none");
        }

        carrito.forEach((prod, index) => {
          const subtotalProd = prod.precio * prod.cantidad;
          total += subtotalProd;

          console.log(prod.url_imagen);

          container.innerHTML += `
                    <div class="card card-cart mb-3 p-3">
                        <div class="row g-0 align-items-center">
                            <div class="col-3 col-md-2">
                                <img src="${
                                  prod.url_imagen
                                }" class="img-fluid rounded-3" alt="${
            prod.nombre
          }" style="aspect-ratio: 1/1; object-fit: cover;">
                            </div>
                            
                            <div class="col-9 col-md-10">
                                <div class="row align-items-center ps-3">
                                    <div class="col-md-5 mb-2 mb-md-0">
                                        <span class="shop-badge mb-1 d-inline-block">${
                                          prod.vendedor || "Mercapp"
                                        }</span>
                                        <h6 class="fw-bold m-0 text-truncate">${
                                          prod.nombre
                                        }</h6>
                                        <small class="text-muted">Precio unitario: $${prod.precio.toFixed(
                                          2
                                        )}</small>
                                    </div>

                                    <div class="col-6 col-md-3 d-flex align-items-center">
                                        <div class="qty-btn" onclick="cambiarCantidad(${index}, -1)"><i class="fas fa-minus small"></i></div>
                                        <span class="mx-3 fw-bold">${
                                          prod.cantidad
                                        }</span>
                                        <div class="qty-btn" onclick="cambiarCantidad(${index}, 1)"><i class="fas fa-plus small"></i></div>
                                    </div>

                                    <div class="col-6 col-md-4 text-end">
                                        <p class="fw-bold fs-5 m-0 text-mercapp">$${subtotalProd.toFixed(
                                          2
                                        )}</p>
                                        <button class="btn btn-link text-danger p-0 text-decoration-none small" onclick="eliminarProducto(${index})">
                                            <i class="fas fa-trash-alt me-1"></i> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
        });

        totalDisplay.innerText = `$${total.toFixed(2)}`;
        subtotalDisplay.innerText = `$${total.toFixed(2)}`;
      }

      // --- FUNCIONES DE ACCIÓN ---

      function cambiarCantidad(index, cambio) {
        if (carrito[index].cantidad === 1 && cambio === -1) {
          return eliminarProducto(index);
        }
        carrito[index].cantidad += cambio;
        actualizarStorage();
      }

      function eliminarProducto(index) {
        if (confirm("¿Seguro que quieres eliminar este producto?")) {
          carrito.splice(index, 1);
          actualizarStorage();
        }
      }

      function vaciarCarrito() {
        if (confirm("¿Vaciar todo el carrito?")) {
          carrito = [];
          actualizarStorage();
        }
      }

      function actualizarStorage() {
        localStorage.setItem("mercapp_carrito", JSON.stringify(carrito));
        renderizarCarrito();
      }

      // Inicializar al cargar
      document.addEventListener("DOMContentLoaded", renderizarCarrito);

      async function procesarPago() {
        if (carrito.length === 0) {
          alert("Tu carrito está vacío");
          return;
        }

        const idUsuarioLogueado = 1;

        // Bloquear botón para evitar doble clic
        const btnPago = document.querySelector(".btn-mercapp-orange");
        const textoOriginal = btnPago.innerText;
        btnPago.disabled = true;
        btnPago.innerText = "Procesando...";

        try {
          const respuesta = await fetch("http://localhost:3000/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_cliente: idUsuarioLogueado,
              productos: carrito,
            }),
          });

          const datos = await respuesta.json();

          if (respuesta.ok) {
            alert(
              `¡Compra Exitosa! Se generaron las órdenes: ${datos.ordenes_creadas.join(
                ", "
              )}`
            );

            localStorage.removeItem("mercapp_carrito");
            window.location.href = "home.html";
          } else {
            alert("Error: " + datos.error);
          }
        } catch (error) {
          console.error(error);
          alert("Error de conexión con el servidor");
        } finally {
          btnPago.disabled = false;
          btnPago.innerText = textoOriginal;
        }
      }
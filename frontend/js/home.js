
      const categories = [
        { name: "Comida", icon: "fa-hamburger" },
        { name: "Tecnología", icon: "fa-laptop" },
        { name: "Moda", icon: "fa-tshirt" },
        { name: "Farmacia", icon: "fa-first-aid" },
        { name: "Super", icon: "fa-shopping-basket" },
        { name: "Hogar", icon: "fa-couch" },
      ];

      const shops = [
        {
          name: "Tacos Ciro's",
          rating: 4.8,
          img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80",
          tag: "Restaurante",
        },
        {
          name: "TechZone Tuxtla",
          rating: 4.5,
          img: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=400&q=80",
          tag: "Tecnología",
        },
        {
          name: "Artesanías Chiapas",
          rating: 5.0,
          img: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=400&q=80",
          tag: "Local",
        },
      ];

      // RENDERIZAR CATEGORÍAS
      const catContainer = document.getElementById("categoriesContainer");
      categories.forEach((cat) => {
        catContainer.innerHTML += `
                <div class="col-4 col-md-2 category-item">
                    <div class="category-icon">
                        <i class="fas ${cat.icon}"></i>
                    </div>
                    <div class="category-name">${cat.name}</div>
                </div>
            `;
      });

      // RENDERIZAR COMERCIOS
      const shopsContainer = document.getElementById("shopsContainer");
      shops.forEach((shop) => {
        shopsContainer.innerHTML += `
                <div class="col-md-4">
                    <div class="card card-mercapp">
                        <img src="${shop.img}" class="card-img-top" alt="${shop.name}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title fw-bold mb-0">${shop.name}</h5>
                                <span class="badge bg-warning text-dark"><i class="fas fa-star small"></i> ${shop.rating}</span>
                            </div>
                            <span class="shop-badge">${shop.tag}</span>
                            <p class="card-text text-muted small">Envíos en 30-45 min</p>
                            <button class="btn btn-outline-primary btn-sm w-100 rounded-pill">Ver Tienda</button>
                        </div>
                    </div>
                </div>
            `;
      });

      let carrito = JSON.parse(localStorage.getItem("mercapp_carrito")) || [];
      const prodContainer = document.getElementById("productsContainer");
      const cartCountBadge = document.getElementById("cartCount");

      async function cargarProductos() {
        try {
          const response = await fetch("http://localhost:3000/productos");
          const productos = await response.json();

          prodContainer.innerHTML = "";

          productos.forEach((prod) => {

            const imagen = prod.url_imagen || "https://via.placeholder.com/150";

            prodContainer.innerHTML += `
                <div class="col-6 col-md-3 mb-4">
                    <div class="card card-mercapp h-100 shadow-sm border-0">
                        <div class="position-relative">
                            <img src="${imagen}" class="card-img-top rounded-top" alt="${
              prod.nombre
            }" style="height: 160px; object-fit: cover;">
                            <span class="badge bg-warning text-dark position-absolute top-0 start-0 m-2 shadow-sm">
                                ${prod.nombre_comercio}
                            </span>
                        </div>
                        
                        <div class="card-body d-flex flex-column p-3">
                            <h6 class="card-title fw-bold text-truncate mb-1">${
                              prod.nombre
                            }</h6>
                            <p class="text-muted small mb-2 text-truncate">${
                              prod.descripcion || ""
                            }</p>
                            
                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                <span class="fw-bold text-primary fs-5">$${parseFloat(
                                  prod.precio
                                ).toFixed(2)}</span>
                                
                                <button class="btn btn-primary btn-sm rounded-circle shadow-sm" 
                                        onclick='agregarAlCarrito(${JSON.stringify(
                                          prod
                                        )})'
                                        style="width: 35px; height: 35px;">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
          });
        } catch (error) {
          console.error("Error:", error);
          prodContainer.innerHTML =
            '<p class="text-center text-danger">No se pudieron cargar los productos.</p>';
        }
      }

      function agregarAlCarrito(producto) {
        const existe = carrito.find(
          (item) => item.id_producto === producto.id_producto
        );

        if (existe) {
          existe.cantidad++;
          console.log(`Sumada 1 unidad a: ${producto.nombre}`);
        } else {
          carrito.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio: parseFloat(producto.precio),
            url_imagen: producto.url_imagen,
            cantidad: 1,
            id_comercio: producto.id_comercio,
            vendedor: producto.nombre_comercio,
          });
          alert(`${producto.nombre} agregado al carrito`);
        }

        actualizarCarrito();
      }

      function actualizarCarrito() {
        localStorage.setItem("mercapp_carrito", JSON.stringify(carrito));

        const totalItems = carrito.reduce(
          (acc, item) => acc + item.cantidad,
          0
        );

        if (cartCountBadge) {
          cartCountBadge.innerText = totalItems;
          cartCountBadge.style.display =
            totalItems > 0 ? "inline-block" : "none";
        }

        console.log("Estado del carrito:", carrito);
      }

      document.addEventListener("DOMContentLoaded", () => {
        cargarProductos();
        actualizarCarrito();
      });
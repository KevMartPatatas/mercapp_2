function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

function showView(viewId, element) {
  // Actualizar menú activo
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  element.classList.add("active");

  // Actualizar Título
  const titles = {
    dashboard: "Resumen General",
    catalogo: "Gestión de Catálogo",
    usuarios: "Gestión de Usuarios",
    comercios: "Administrar Comercios",
    pedidos: "Historial de Pedidos",
    planes: "Planes de Suscripción",
    reportes: "Reportes Financieros",
  };
  document.getElementById("pageTitle").textContent = titles[viewId] || "Panel";

  // Mostrar Sección
  document
    .querySelectorAll(".view-section")
    .forEach((s) => s.classList.remove("active"));
  const activeSection = document.getElementById(viewId);
  if (activeSection) activeSection.classList.add("active");

  // Cerrar menú en móvil
  if (window.innerWidth < 992) toggleSidebar();
}

// --- RENDERS ---

let allUsers = [];

// 1. Función principal: Carga los datos de la API
async function loadUsers() {
  console.log("Iniciando carga de usuarios...");
  const USERS_URL = "/usuarios";

  try {
    const res = await axios.get(USERS_URL);
    allUsers = res.data;

    console.log("Usuarios recibidos:", allUsers);

    renderTable(allUsers);

    setupFilters();
  } catch (err) {
    console.error("Error al cargar usuarios:", err);
    const usersTableBody = document.getElementById("usersTableBody");
    if (usersTableBody) {
      usersTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos</td></tr>';
    }
  }
}

function renderTable(usersList) {
  const usersTableBody = document.getElementById("usersTableBody");

  if (!usersTableBody) return;

  if (usersList.length === 0) {
    usersTableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted py-3">No se encontraron coincidencias</td></tr>';
    return;
  }

  usersTableBody.innerHTML = usersList
    .map(
      (u) => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="rounded-circle bg-light d-flex align-items-center justify-content-center me-2 text-primary fw-bold" style="width:35px;height:35px;">
                        ${
                          u.nombre_completo
                            ? u.nombre_completo.charAt(0).toUpperCase()
                            : "-"
                        }
                    </div>
                    <div class="fw-bold">${u.nombre_completo || "-"}</div>
                </div>
            </td>
            <td class="text-muted">${u.correo || "-"}</td>
            <td>
                <span class="badge ${
                  u.rol === "admin"
                    ? "bg-danger"
                    : u.rol === "comerciante"
                    ? "bg-info"
                    : "bg-success"
                } text-capitalize">
                    ${u.rol || "-"}
                </span>
            </td>
            <td class="small">${u.fecha_registro || "-"}</td>
            <td>
                <button class="btn btn-sm btn-light text-primary btn-edit" data-id="${
                  u.id_usuario
                }">
                    <i class="fas fa-edit pointer-events-none"></i>
                </button>
                
                <button class="btn btn-sm btn-light text-danger btn-delete" data-id="${
                  u.id_usuario
                }">
                    <i class="fas fa-trash pointer-events-none"></i>
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");

  if (!searchInput || !roleFilter) return;

  function applyFilters() {
    const searchText = searchInput.value.toLowerCase();
    const roleValue = roleFilter.value.toLowerCase();

    const filteredUsers = allUsers.filter((user) => {
      const matchesSearch =
        (user.nombre_completo || "").toLowerCase().includes(searchText) ||
        (user.correo || "").toLowerCase().includes(searchText);

      const matchesRole =
        roleValue === "" || (user.rol || "").toLowerCase() === roleValue;

      return matchesSearch && matchesRole;
    });

    renderTable(filteredUsers);
  }

  searchInput.addEventListener("input", applyFilters);
  roleFilter.addEventListener("change", applyFilters);
}

function setupTableActions() {
  const usersTableBody = document.getElementById("usersTableBody");

  if (!usersTableBody) return;

  usersTableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".btn-edit");
    const deleteBtn = e.target.closest(".btn-delete");

    if (editBtn) {
      const userId = editBtn.getAttribute("data-id");
      editUser(userId);
    }

    if (deleteBtn) {
      const userId = deleteBtn.getAttribute("data-id");
      deleteUser(userId);
    }
  });
}

async function deleteUser(id) {
  if (
    !confirm(
      "¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
    )
  ) {
    return;
  }

  try {
    await axios.delete(`/usuarios/${id}`);

    allUsers = allUsers.filter((user) => user.id_usuario != id);

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.dispatchEvent(new Event("input"));
    } else {
      renderTable(allUsers);
    }

    alert("Usuario eliminado correctamente");
  } catch (err) {
    console.error(err);
    alert("Error al eliminar el usuario.");
  }
}
function editUser(id) {
  const user = allUsers.find((u) => u.id_usuario == id);
  if (!user) return;

  document.getElementById("editUserId").value = user.id_usuario;

  document.getElementById("editNombre").value = user.nombre_completo || "";
  document.getElementById("editCorreo").value = user.correo || "";
  document.getElementById("editTelefono").value = user.telefono || "";
  document.getElementById("editRol").value = user.rol || "cliente";

  const modal = new bootstrap.Modal(
    document.getElementById("modalEditarUsuario")
  );
  modal.show();
}

function setupModalActions() {
  const btnGuardar = document.getElementById("btnGuardarCambios");

  const newBtn = btnGuardar.cloneNode(true);
  btnGuardar.parentNode.replaceChild(newBtn, btnGuardar);

  newBtn.addEventListener("click", async () => {
    const id = document.getElementById("editUserId").value; // El ID oculto
    const nombre = document.getElementById("editNombre").value; // El Input de texto
    const correo = document.getElementById("editCorreo").value; // El Input de email
    const telefono = document.getElementById("editTelefono").value; // El Input de teléfono
    const rol = document.getElementById("editRol").value; // El Select

    console.log("Datos capturados del formulario:", {
      id: id,
      nombre: nombre,
      correo: correo,
      telefono: telefono,
      rol: rol,
    });

    if (!id) {
      alert("Error fatal: No se cargó el ID del usuario. Recarga la página.");
      return;
    }
    if (!nombre || !correo) {
      alert("El nombre y el correo son obligatorios");
      return;
    }

    const datosActualizados = {
      nombre_completo: nombre,
      correo: correo,
      telefono: telefono,
      rol: rol,
    };

    try {
      await axios.put(`/usuarios/${id}`, datosActualizados);

      const index = allUsers.findIndex((u) => u.id_usuario == id);
      if (index !== -1) {
        allUsers[index] = { ...allUsers[index], ...datosActualizados };
      }

      // Refrescar tabla y cerrar
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.dispatchEvent(new Event("input"));
      else renderTable(allUsers);

      // Cerrar modal
      const modalElement = document.getElementById("modalEditarUsuario");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();

      alert("Usuario actualizado correctamente");
    } catch (err) {
      console.error("Error al actualizar:", err);
      alert("Error al guardar los cambios.");
    }
  });
}

function setupCreateUser() {
  const btnCrear = document.getElementById("btnCrearUsuario");

  btnCrear.addEventListener("click", async () => {
    const nombre = document.getElementById("newNombre").value;
    const correo = document.getElementById("newCorreo").value;
    const telefono = document.getElementById("newTelefono").value;
    const password = document.getElementById("newPassword").value;
    const rol = document.getElementById("newRol").value;

    if (!nombre || !correo || !password) {
      alert(
        "Por favor completa los campos obligatorios (Nombre, Correo, Contraseña)"
      );
      return;
    }

    const nuevoUsuario = {
      nombre: nombre,
      correo: correo,
      contrasena: password,
      telefono: telefono,
      rol: rol,
    };

    try {
      const res = await axios.post("/usuarios", nuevoUsuario);

      console.log("Usuario creado:", res.data);

      const usuarioParaTabla = {
        id_usuario: res.data.id || res.data.insertId || Date.now(),
        nombre_completo: nombre,
        correo: correo,
        telefono: telefono,
        rol: rol,
        fecha_registro: new Date().toISOString(),
      };

      allUsers.unshift(usuarioParaTabla);

      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.value = ""; // Limpiamos buscador para ver al nuevo usuario
        searchInput.dispatchEvent(new Event("input"));
      } else {
        renderTable(allUsers);
      }

      const modalElement = document.getElementById("modalNuevoUsuario");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();

      document.getElementById("formNuevoUsuario").reset(); // Limpia los inputs

      alert("Usuario creado exitosamente");
    } catch (err) {
      console.error("Error al crear usuario:", err);
      alert("Error al crear el usuario. Verifica la consola.");
    }
  });
}

async function loadCategories() {
  console.log("Cargando categorías...");
  const CATEGORIES_URL = "/categorias";

  try {
    const res = await axios.get(CATEGORIES_URL);
    allCategories = res.data;

    console.log("Categorías recibidas:", allCategories);
    renderCategoriesTable(allCategories);
  } catch (err) {
    console.error("Error al cargar categorías:", err);
  }
}

function renderCategoriesTable(categoriesList) {
  const tableBody = document.getElementById("categoriesTableBody");

  if (!tableBody) return;

  if (categoriesList.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted py-3">No hay categorías registradas</td></tr>';
    return;
  }

  tableBody.innerHTML = categoriesList
    .map(
      (c) => `
        <tr>
            <td>
                <div class="rounded bg-light text-primary d-flex align-items-center justify-content-center" style="width:40px;height:40px;">
                    <i class="${c.url_imagen} fa-lg"></i>
                </div>
            </td>
            
            <td class="fw-bold">${c.nombre}</td>
            
            <td class="text-muted small">
                ${
                  c.nombre_padre
                    ? `<span class="badge bg-secondary">Subcat. de: <strong>${c.nombre_padre}</strong></span>`
                    : '<span class="badge bg-light text-dark border">Categoría Raíz</span>'
                }
            </td>
            
            <td>
                ${c.count || 0} productos
            </td>
            
            <td>
                ${
                  c.nombre_padre
                    ? `
                    <button class="btn btn-sm btn-light text-primary btn-edit-cat" data-id="${c.id_categoria}" title="Editar">
                        <i class="fas fa-edit pointer-events-none"></i>
                    </button>
                    <button class="btn btn-sm btn-light text-danger btn-delete-cat" data-id="${c.id_categoria}" title="Eliminar">
                        <i class="fas fa-trash pointer-events-none"></i>
                    </button>
                    `
                    : `
                    <span class="text-muted small" title="Categoría del sistema protegida">
                        <i class="fas fa-lock"></i>
                    </span>
                    `
                }
            </td>
        </tr>
    `
    )
    .join("");
}

function setupCreateCategory() {
  const modalElement = document.getElementById("modalNuevaCategoria");
  const btnGuardar = document.getElementById("btnGuardarCategoria");
  const selectPadre = document.getElementById("catPadre");

  modalElement.addEventListener("show.bs.modal", () => {
    selectPadre.innerHTML =
      '<option value="" selected disabled>Selecciona la categoría padre...</option>';

    allCategories.forEach((cat) => {
      if (cat.id_padre === null) {
        const option = document.createElement("option");
        option.value = cat.id_categoria;
        option.textContent = cat.nombre;
        selectPadre.appendChild(option);
      }
    });
  });

  btnGuardar.addEventListener("click", async () => {
    const nombre = document.getElementById("catNombre").value;
    const idPadre = document.getElementById("catPadre").value;
    const icono = document.getElementById("catIcono").value || "fas fa-tag";

    if (!nombre || !idPadre) {
      alert("Debes escribir un nombre y seleccionar una categoría padre.");
      return;
    }

    const nuevaCategoria = {
      nombre: nombre,
      id_padre: idPadre,
      url_imagen: icono,
    };

    try {
      const res = await axios.post("/categorias", nuevaCategoria);

      console.log("Categoría creada:", res.data);

      await loadCategories();

      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
      document.getElementById("formNuevaCategoria").reset();

      alert("Subcategoría agregada con éxito");
    } catch (err) {
      console.error("Error al crear categoría:", err);
      alert("Error al guardar.");
    }
  });
}

function setupCategoryActions() {
  const tableBody = document.getElementById("categoriesTableBody");

  // Seguridad
  if (!tableBody) return;

  tableBody.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest(".btn-delete-cat");
    const editBtn = e.target.closest(".btn-edit-cat");

    if (deleteBtn) {
      const id = deleteBtn.getAttribute("data-id");
      if (confirm("¿Eliminar esta subcategoría?")) {
        try {
          await axios.delete(`/categorias/${id}`);
          await loadCategories();
          alert("Eliminado correctamente.");
        } catch (err) {
          console.error(err);
          alert("Error al eliminar.");
        }
      }
    }

    if (editBtn) {
      const id = editBtn.getAttribute("data-id");

      const cat = allCategories.find((c) => c.id_categoria == id);
      if (!cat) return;

      document.getElementById("editCatId").value = cat.id_categoria;
      document.getElementById("editCatNombre").value = cat.nombre;
      document.getElementById("editCatIcono").value = cat.url_imagen;

      const selectPadre = document.getElementById("editCatPadre");
      selectPadre.innerHTML = "";

      allCategories.forEach((parent) => {
        if (!parent.nombre_padre) {
          const option = document.createElement("option");
          option.value = parent.id_categoria;
          option.textContent = parent.nombre;

          if (parent.id_categoria == cat.id_padre) {
            option.selected = true;
          }
          selectPadre.appendChild(option);
        }
      });

      const modal = new bootstrap.Modal(
        document.getElementById("modalEditarCategoria")
      );
      modal.show();
    }
  });

  const btnActualizar = document.getElementById("btnActualizarCategoria");

  const newBtn = btnActualizar.cloneNode(true);
  btnActualizar.parentNode.replaceChild(newBtn, btnActualizar);

  newBtn.addEventListener("click", async () => {
    const id = document.getElementById("editCatId").value;
    const nombre = document.getElementById("editCatNombre").value;
    const idPadre = document.getElementById("editCatPadre").value;
    const icono = document.getElementById("editCatIcono").value;

    if (!nombre || !idPadre) {
      alert("Nombre y Categoría Padre son obligatorios");
      return;
    }

    const datos = {
      nombre: nombre,
      id_padre: idPadre,
      url_imagen: icono,
    };

    try {
      await axios.put(`/categorias/${id}`, datos);
      await loadCategories();

      // Cerrar modal
      const modalElement = document.getElementById("modalEditarCategoria");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();

      alert("Actualizado correctamente");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar");
    }
  });
}

function setupCategoryFilters() {
  const searchInput = document.getElementById("searchCategoryInput");
  const filterSelect = document.getElementById("filterCategorySelect");

  if (!searchInput || !filterSelect) return;

  const categoriasRaiz = allCategories.filter((c) => !c.nombre_padre);

  filterSelect.innerHTML = '<option value="">Todas las categorías</option>';

  categoriasRaiz.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id_categoria;
    option.textContent = cat.nombre;
    filterSelect.appendChild(option);
  });

  function applyFilters() {
    const searchText = searchInput.value.toLowerCase();
    const selectedParentId = filterSelect.value;

    const filteredList = allCategories.filter((cat) => {
      const matchesSearch = cat.nombre.toLowerCase().includes(searchText);

      const matchesCategory =
        selectedParentId === "" ||
        cat.id_categoria == selectedParentId ||
        cat.id_padre == selectedParentId;

      return matchesSearch && matchesCategory;
    });

    renderCategoriesTable(filteredList);
  }

  searchInput.addEventListener("input", applyFilters);
  filterSelect.addEventListener("change", applyFilters);
}

function setupCategoryFilters() {
  const searchInput = document.getElementById("searchCategoryInput");
  const filterSelect = document.getElementById("filterCategorySelect");

  if (!searchInput || !filterSelect) return;

  const categoriasRaiz = allCategories.filter((c) => !c.nombre_padre);

  filterSelect.innerHTML = '<option value="">Todas las categorías</option>';

  categoriasRaiz.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id_categoria;
    option.textContent = cat.nombre;
    filterSelect.appendChild(option);
  });

  function applyFilters() {
    const searchText = searchInput.value.toLowerCase();
    const selectedParentId = filterSelect.value;

    const filteredList = allCategories.filter((cat) => {
      const matchesSearch = cat.nombre.toLowerCase().includes(searchText);

      const matchesCategory =
        selectedParentId === "" ||
        cat.id_categoria == selectedParentId ||
        cat.id_padre == selectedParentId;

      return matchesSearch && matchesCategory;
    });

    renderCategoriesTable(filteredList);
  }

  searchInput.addEventListener("input", applyFilters);
  filterSelect.addEventListener("change", applyFilters);
}

async function loadCategories() {
  console.log("Cargando categorías...");
  const CATEGORIES_URL = "/categorias";

  try {
    const res = await axios.get(CATEGORIES_URL);
    allCategories = res.data;

    renderCategoriesTable(allCategories);

    setupCategoryFilters();
  } catch (err) {
    console.error("Error al cargar categorías:", err);
  }
}

let allProducts = [];

async function loadProducts() {
  console.log("Cargando productos reales...");
  try {
    const res = await axios.get("/productos");
    allProducts = res.data;

    renderProductsTable(allProducts);

    fillShopFilter();

    setupProductFilters();
  } catch (err) {
    console.error("Error cargando productos:", err);
    document.getElementById("productsTableBody").innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Error al cargar datos</td></tr>';
  }
}

function renderProductsTable(list) {
  const tbody = document.getElementById("productsTableBody");

  if (list.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron productos</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map(
      (p) => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-3">
                    <img src="${
                      p.url_imagen || "https://via.placeholder.com/50"
                    }" 
                         class="rounded border" style="width: 50px; height: 50px; object-fit: cover;" alt="${
                           p.nombre
                         }">
                    <div>
                        <div class="fw-bold">${p.nombre}</div>
                        <small class="text-muted">ID: ${p.id_producto}</small>
                    </div>
                </div>
            </td>
            
            <td>${
              p.nombre_comercio || '<span class="text-muted">Sin asignar</span>'
            }</td>
            
            <td>
                <span class="badge bg-light text-dark border">
                    ${p.nombre_categoria || "General"}
                </span>
            </td>
            
            <td class="fw-bold">$${parseFloat(p.precio).toFixed(2)}</td>
            
            <td>
                ${
                  p.cantidad_stock > 0
                    ? `<span class="text-success small fw-bold">${p.cantidad_stock} unid.</span>`
                    : '<span class="text-danger small fw-bold">Agotado</span>'
                }
            </td>
            
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input toggle-active" type="checkbox" 
                           data-id="${p.id_producto}" 
                           ${p.activo === 1 ? "checked" : ""}>
                </div>
            </td>
            
            <td>
                <button class="btn btn-sm btn-light text-primary btn-edit-prod" data-id="${
                  p.id_producto
                }">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger btn-delete-prod" data-id="${
                  p.id_producto
                }">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function setupProductFilters() {
  const searchInput = document.querySelector(
    'input[placeholder="Buscar producto..."]'
  );
  const shopSelect = document.querySelector("select.form-select");

  function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const shop = shopSelect.value;

    const filtered = allProducts.filter((p) => {
      const matchesText = p.nombre.toLowerCase().includes(term);
      const matchesShop =
        shop === "Todos los comercios" || p.nombre_comercio === shop;
      return matchesText && matchesShop;
    });

    renderProductsTable(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  shopSelect.addEventListener("change", applyFilters);
}

function fillShopFilter() {
  const shopSelect = document.querySelector("select.form-select");

  const comerciosUnicos = [
    ...new Set(allProducts.map((p) => p.nombre_comercio).filter(Boolean)),
  ];

  let options = "<option selected>Todos los comercios</option>";
  comerciosUnicos.forEach((comercio) => {
    options += `<option value="${comercio}">${comercio}</option>`;
  });

  shopSelect.innerHTML = options;
}

// 1. Escuchar los clicks en la tabla (Editar y Eliminar)
function setupProductTableActions() {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  tbody.addEventListener("click", (e) => {
    // Detectar botón EDITAR
    const editBtn = e.target.closest(".btn-edit-prod");
    if (editBtn) {
      const id = editBtn.getAttribute("data-id");
      prepararEdicionProducto(id);
    }

    // Detectar botón ELIMINAR
    const deleteBtn = e.target.closest(".btn-delete-prod");
    if (deleteBtn) {
      const id = deleteBtn.getAttribute("data-id");
      confirmarEliminacionProducto(id);
    }
  });
}

// 2. Helper: Llenar los Selects
function llenarSelectsProducto() {
  const selectComercio = document.getElementById("prodComercio");
  const selectCategoria = document.getElementById("prodCategoria");

  // -- Comercios --
  selectComercio.innerHTML =
    '<option value="" selected disabled>Selecciona un comercio...</option>';
  const comerciantes = allUsers.filter(
    (u) => u.rol === "comerciante" || u.rol === "vendedor"
  );

  if (comerciantes.length > 0) {
    comerciantes.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.id_usuario;
      option.textContent = c.nombre_completo || c.correo;
      selectComercio.appendChild(option);
    });
  } else {
    selectComercio.innerHTML = "<option disabled>No hay comerciantes</option>";
  }

  // -- Categorías --
  selectCategoria.innerHTML =
    '<option value="" selected disabled>Selecciona una categoría...</option>';
  if (allCategories.length > 0) {
    allCategories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id_categoria;
      let texto = cat.nombre;
      if (cat.nombre_padre) texto = `${cat.nombre_padre} > ${cat.nombre}`;
      option.textContent = texto;
      selectCategoria.appendChild(option);
    });
  }
}

// 3. Preparar Modal para CREAR (Resetear)
function resetProductModal() {
  document.getElementById("formProducto").reset();
  document.getElementById("prodIdHidden").value = ""; // Limpiar ID oculto

  // Llenar selects
  llenarSelectsProducto();

  document.querySelector("#modalProducto .modal-title").textContent =
    "Nuevo Producto";
  document.querySelector("#modalProducto .btn-primary").textContent =
    "Guardar Producto";
}

// 4. Preparar Modal para EDITAR
function prepararEdicionProducto(id) {
  const producto = allProducts.find((p) => p.id_producto == id);
  if (!producto) return;

  llenarSelectsProducto();

  // Llenar formulario con datos 
  document.getElementById("prodIdHidden").value = producto.id_producto;
  document.getElementById("prodNombre").value = producto.nombre;
  document.getElementById("prodPrecio").value = producto.precio;
  document.getElementById("prodStock").value = producto.cantidad_stock;
  document.getElementById("prodImagen").value = producto.url_imagen;
  document.getElementById("prodDescripcion").value = producto.descripcion;

  document.getElementById("prodComercio").value = producto.id_comercio || "";
  document.getElementById("prodCategoria").value = producto.id_categoria || "";

  // Cambiar textos
  document.querySelector("#modalProducto .modal-title").textContent =
    "Editar Producto";
  document.querySelector("#modalProducto .btn-primary").textContent =
    "Actualizar";

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById("modalProducto"));
  modal.show();
}

function setupProductForm() {
  const btnGuardar = document.querySelector("#modalProducto .btn-primary");


  const newBtnGuardar = btnGuardar.cloneNode(true);
  btnGuardar.parentNode.replaceChild(newBtnGuardar, btnGuardar);

  newBtnGuardar.addEventListener("click", async () => {
    // Capturar datos
    const id = document.getElementById("prodIdHidden").value;
    const id_comercio = document.getElementById("prodComercio").value;
    const id_categoria = document.getElementById("prodCategoria").value;
    const nombre = document.getElementById("prodNombre").value;
    const precio = document.getElementById("prodPrecio").value;
    const stock = document.getElementById("prodStock").value;
    const imagen = document.getElementById("prodImagen").value;
    const descripcion = document.getElementById("prodDescripcion").value;

    // Validar
    if (!id_comercio || !id_categoria || !nombre || !precio) {
      alert("Faltan campos obligatorios");
      return;
    }

    const payload = {
      id_comercio,
      id_categoria,
      nombre,
      precio,
      cantidad_stock: stock,
      url_imagen: imagen,
      descripcion,
    };

    try {
      if (id) {
        // --- CASO EDITAR ---
        await axios.put(`/productos/${id}`, payload);
        alert("Producto actualizado correctamente");
      } else {
        // --- CASO CREAR ---
        await axios.post("/productos", payload);
        alert("Producto creado correctamente");
      }

      // Cerrar modal y recargar
      const modalElement = document.getElementById("modalProducto");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();

      await loadProducts(); // Recargar tabla
    } catch (error) {
      console.error(error);
      alert("Error al guardar el producto");
    }
  });

  const modalEl = document.getElementById("modalProducto");
  modalEl.addEventListener("show.bs.modal", (event) => {
    if (
      event.relatedTarget &&
      !event.relatedTarget.classList.contains("btn-edit-prod")
    ) {
      if (!document.getElementById("prodIdHidden").value) {
        resetProductModal();
      }
    }
  });
}

// 6. Eliminar Producto
function confirmarEliminacionProducto(id) {
  const producto = allProducts.find((p) => p.id_producto == id);
  if (!producto) return;

  document.getElementById("deleteProductName").textContent = producto.nombre;
  document.getElementById("deleteProdId").value = id;

  const modal = new bootstrap.Modal(
    document.getElementById("modalConfirmarDelete")
  );
  modal.show();
}

function setupDeleteAction() {
  document
    .getElementById("btnConfirmarEliminar")
    .addEventListener("click", async () => {
      const id = document.getElementById("deleteProdId").value;
      if (!id) return;

      try {
        await axios.delete(`/productos/${id}`);

        const modalEl = document.getElementById("modalConfirmarDelete");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        alert("Producto eliminado");
        await loadProducts();
      } catch (error) {
        console.error(error);
        alert("Error al eliminar");
      }
    });
}

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  // Tus otras cargas...
  loadUsers();
  setupFilters();
  setupTableActions(); // Tabla de usuarios
  setupModalActions(); // Modal usuarios
  setupCreateUser(); // Crear usuario
  loadCategories();
  setupCreateCategory(); // Crear categoría
  setupCategoryActions(); // Tabla categorías

  // --- PRODUCTOS ---
  loadProducts(); // Cargar datos
  setupProductTableActions(); // Escuchar clicks en tabla
  setupProductForm(); // Configurar botón Guardar
  setupDeleteAction(); // Configurar botón Eliminar
});

function renderShops() {
  const tbody = document.getElementById("shopsTableBody");
  tbody.innerHTML = mockShops
    .map(
      (s) => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="rounded bg-light d-flex align-items-center justify-content-center me-2 fw-bold" style="width:40px;height:40px;">${
                              s.logo
                            }</div>
                            <div>
                                <div class="fw-bold">${s.name}</div>
                                <small class="text-muted">ID: #${s.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>${s.owner}</td>
                    <td><span class="badge ${
                      s.plan.includes("Premium")
                        ? "bg-warning text-dark"
                        : "bg-light text-dark border"
                    }">${s.plan}</span></td>
                    <td>
                        ${
                          s.verified
                            ? '<span class="text-primary small"><i class="fas fa-check-circle"></i> Verificado</span>'
                            : '<span class="text-muted small"><i class="far fa-circle"></i> Sin verificar</span>'
                        }
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" title="Verificar"><i class="fas fa-check"></i></button>
                        <button class="btn btn-sm btn-light" title="Ver Plan"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `
    )
    .join("");

  const list = document.getElementById("newShopsList");
  list.innerHTML = mockShops
    .slice(0, 3)
    .map(
      (s) => `
                <li class="d-flex align-items-center mb-3">
                    <div class="rounded bg-light p-2 me-3"><i class="fas fa-store text-muted"></i></div>
                    <div class="flex-grow-1">
                        <h6 class="mb-0 small fw-bold">${s.name}</h6>
                        <small class="text-muted" style="font-size:0.7rem">${s.plan}</small>
                    </div>
                    <small class="text-muted">2min</small>
                </li>
            `
    )
    .join("");
}

function renderOrders() {
  const tbody = document.getElementById("recentOrdersTable");
  const badges = {
    entregado: "bg-success",
    pendiente: "bg-warning text-dark",
    procesando: "bg-info text-dark",
    cancelado: "bg-danger",
  };

  tbody.innerHTML = mockOrders
    .map(
      (o) => `
                <tr>
                    <td class="fw-bold">#${o.id}</td>
                    <td>${o.client}</td>
                    <td>${o.shop}</td>
                    <td class="fw-bold">$${o.total.toFixed(2)}</td>
                    <td><span class="badge ${
                      badges[o.status] || "bg-secondary"
                    }">${o.status}</span></td>
                </tr>
            `
    )
    .join("");
}

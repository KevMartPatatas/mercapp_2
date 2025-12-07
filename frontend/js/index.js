
      document.addEventListener("DOMContentLoaded", () => {
        // ==========================================
        // 1. ELEMENTOS DEL DOM (Login)
        // ==========================================
        const loginForm = document.getElementById("loginForm");
        const emailInput = document.getElementById("loginEmail");
        const passInput = document.getElementById("loginPassword");
        const rememberCheckbox = document.getElementById("rememberMe");
        const loginBtnText = document.getElementById("loginBtnText");
        const loginSpinner = document.getElementById("loginSpinner");

        // ==========================================
        // 2. ELEMENTOS DEL DOM (Registro)
        // ==========================================
        const registerForm = document.getElementById("registerForm");
        const roleSwitch = document.getElementById("roleSwitch"); // El switch
        const roleLabel = document.getElementById("roleLabel"); // Texto del switch
        const nameLabel = document.getElementById("nameLabel"); // Label del nombre
        const regName = document.getElementById("regName");
        const regEmail = document.getElementById("regEmail");
        const regPhone = document.getElementById("regPhone");
        const regPass = document.getElementById("regPassword");
        const regConfirm = document.getElementById("regConfirmPassword");
        const regBtnText = document.getElementById("regBtnText");
        const regSpinner = document.getElementById("regSpinner");

        // Elemento compartido para alertas
        const feedbackAlert = document.getElementById("feedbackAlert");

        // URLs de la API
        const LOGIN_URL = "/login";
        const REGISTER_URL = "/usuarios"; // <--- Asegúrate que esta ruta exista en tu backend

        // ==========================================
        // 3. FUNCIONES DE UTILIDAD (UI)
        // ==========================================

        // Alternar entre formularios (Login / Registro)
        window.toggleForms = function (form) {
          feedbackAlert.style.display = "none"; // Limpiar alertas al cambiar
          if (form === "login") {
            loginForm.classList.remove("hidden");
            registerForm.classList.add("hidden");
          } else if (form === "register") {
            loginForm.classList.add("hidden");
            registerForm.classList.remove("hidden");
          }
        };

        // Mostrar alertas (Éxito / Error)
        function showFeedback(message, type = "danger", timeout = 4000) {
          feedbackAlert.className = `alert alert-${type} fade-in`;
          feedbackAlert.textContent = message;
          feedbackAlert.style.display = "block";
          if (timeout) {
            setTimeout(() => {
              feedbackAlert.style.display = "none";
            }, timeout);
          }
        }

        // Loading para Login
        function setLoginLoading(isLoading) {
          const submitBtn = loginForm.querySelector('button[type="submit"]');
          if (isLoading) {
            submitBtn.disabled = true;
            loginSpinner.classList.remove("d-none");
            if (loginBtnText) loginBtnText.textContent = "Iniciando...";
          } else {
            submitBtn.disabled = false;
            loginSpinner.classList.add("d-none");
            if (loginBtnText) loginBtnText.textContent = "Iniciar Sesión";
          }
        }

        // Loading para Registro
        function setRegisterLoading(isLoading) {
          const submitBtn = registerForm.querySelector('button[type="submit"]');
          if (isLoading) {
            submitBtn.disabled = true;
            regSpinner.classList.remove("d-none");
            if (regBtnText) regBtnText.textContent = "Creando cuenta...";
          } else {
            submitBtn.disabled = false;
            regSpinner.classList.add("d-none");
            if (regBtnText) regBtnText.textContent = "Crear Cuenta";
          }
        }

        // ==========================================
        // 4. LÓGICA DE INTERFAZ (Switch Vendedor)
        // ==========================================
        if (roleSwitch) {
          roleSwitch.addEventListener("change", function () {
            if (this.checked) {
              // Modo Vendedor
              nameLabel.innerText = "Nombre del Negocio";
              regName.placeholder = "Ej. Abarrotes La Esperanza";
              // Opcional: Cambiar texto del label del switch si gustas
              // roleLabel.innerText = 'Registrando como Negocio';
            } else {
              // Modo Usuario
              nameLabel.innerText = "Nombre Completo";
              regName.placeholder = "Juan Pérez";
              // roleLabel.innerText = 'Registrarme como Vendedor';
            }
          });
        }

        // ==========================================
        // 5. CONFIGURACIÓN AXIOS & TOKEN
        // ==========================================
        const existingToken =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (existingToken) {
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${existingToken}`;
        }

        // ==========================================
        // 6. EVENTO SUBMIT: LOGIN
        // ==========================================
        loginForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          feedbackAlert.style.display = "none";

          const correo = emailInput.value.trim();
          const password = passInput.value;

          if (!correo || !password) {
            showFeedback(
              "Por favor completa correo y contraseña.",
              "warning",
              3000
            );
            return;
          }

          setLoginLoading(true);

          try {
            const res = await axios.post(
              LOGIN_URL,
              { correo, password },
              {
                headers: { "Content-Type": "application/json" },
              }
            );

            const token = res.data && res.data.token;
            if (!token) {
              throw new Error("Falta token en la respuesta");
            }

            // Guardar token
            if (rememberCheckbox.checked) {
              localStorage.setItem("token", token);
            } else {
              sessionStorage.setItem("token", token);
            }
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            showFeedback(
              "Inicio de sesión correcto. Redirigiendo...",
              "success",
              1500
            );

            const redirectTo =
              res.data && res.data.redirect ? res.data.redirect : "/home.html";
            setTimeout(() => {
              window.location.href = redirectTo; // Redirigir
            }, 800);
          } catch (err) {
            const msg =
              err.response?.data?.mensaje ||
              "Credenciales incorrectas o error de servidor.";
            showFeedback(msg, "danger", 4000);
            console.error("Login error:", err);
          } finally {
            setLoginLoading(false);
          }
        });

        // ==========================================
        // 7. EVENTO SUBMIT: REGISTRO (NUEVO)
        // ==========================================
        registerForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          feedbackAlert.style.display = "none";

          // 1. Obtener valores
          const nombre = regName.value.trim();
          const correo = regEmail.value.trim();
          const telefono = regPhone.value.trim();
          const password = regPass.value;
          const confirmPass = regConfirm.value;

          // Determinar rol basado en el switch
          // Si el switch está ON -> 'vendedor', si está OFF -> 'usuario'
          const rol = roleSwitch.checked ? "comerciante" : "cliente";

          // 2. Validaciones básicas frontend
          if (!nombre || !correo || !telefono || !password) {
            showFeedback("Todos los campos son obligatorios.", "warning");
            return;
          }

          if (password !== confirmPass) {
            showFeedback("Las contraseñas no coinciden.", "warning");
            return;
          }

          if (password.length < 4) {
            showFeedback(
              "La contraseña debe tener al menos 4 caracteres.",
              "warning"
            );
            return;
          }

          setRegisterLoading(true);

          try {
            console.log(password);
            // 3. Enviar datos al backend
            // El objeto payload debe coincidir con lo que espera tu BD
            const payload = {
              nombre,
              correo,
              contrasena: password,
              telefono,
              rol, // Enviamos el rol seleccionado
            };

            const res = await axios.post(REGISTER_URL, payload, {
              headers: { "Content-Type": "application/json" },
            });

            // 4. Éxito
            showFeedback(
              "¡Cuenta creada con éxito! Por favor inicia sesión.",
              "success",
              3000
            );

            // Limpiar formulario
            registerForm.reset();

            // Regresar al estado inicial del switch (opcional)
            if (roleSwitch.checked) roleSwitch.click();

            // Esperar 1.5 seg y cambiar a la vista de Login automáticamente
            setTimeout(() => {
              toggleForms("login");
            }, 1500);
          } catch (err) {
            // 5. Manejo de errores
            let msg = "Error al registrar usuario.";

            if (
              err.response &&
              err.response.data &&
              err.response.data.mensaje
            ) {
              msg = err.response.data.mensaje; // Ej: "El correo ya está registrado"
            }

            showFeedback(msg, "danger", 4000);
            console.error("Register error:", err);
          } finally {
            setRegisterLoading(false);
          }
        });
      });

      document.addEventListener("DOMContentLoaded", function () {
        const roleSwitch = document.getElementById("roleSwitch");
        const nameLabel = document.getElementById("nameLabel");
        const nameInput = document.getElementById("regName");

        // Escuchar el cambio en el switch
        roleSwitch.addEventListener("change", function () {
          if (this.checked) {
            // MODO VENDEDOR / NEGOCIO
            nameLabel.innerText = "Nombre del Negocio";
            nameInput.placeholder = "Ej. Abarrotes La Esperanza";
          } else {
            // MODO USUARIO NORMAL
            nameLabel.innerText = "Nombre Completo";
            nameInput.placeholder = "Juan Pérez";
          }
        });
      });
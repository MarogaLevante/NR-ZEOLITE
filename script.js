/**
 * Script principal para el sitio web de NR-Zeo
 * Maneja navegación, animaciones, carrusel, y cambio de idioma
 * Actualizado para trabajar sin servidor (sin CORS issues)
 */

// Variables globales
let currentPage = 'home';
let bootstrapCarousel = null;

// Función para mostrar el indicador de carga
function showLoader() {
    document.getElementById('loader-overlay').classList.add('active');
}

// Función para ocultar el indicador de carga
function hideLoader() {
    document.getElementById('loader-overlay').classList.remove('active');
}

/**
 * Nueva función para cambiar página sin usar fetch
 * En lugar de cargar contenido externamente, muestra/oculta secciones ya presentes en el HTML
 */
function switchPage(pageName) {
    if (pageName === currentPage) return;
    
    showLoader();
    
    try {
        // Ocultar todas las páginas
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        
        // Mostrar la página solicitada
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Actualizar URL y título
            updateURL(pageName);
            
            // Actualizar navegación activa
            updateActiveNavigation(pageName);
            
            // Actualizar variable global
            currentPage = pageName;
            
            // Scroll hacia arriba
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Inicializar componentes de Bootstrap en el nuevo contenido
            initializeBootstrapComponents();
        } else {
            console.error(`No se encontró la página: ${pageName}`);
        }
    } catch (error) {
        console.error("Error al cambiar de página:", error);
    } finally {
        hideLoader();
        
        // Reconfigurar eventos para los enlaces dinámicos del nuevo contenido
        setupDynamicLinks();
    }
}

// Actualizar la URL sin recargar la página
function updateURL(pageName) {
    const url = new URL(window.location);
    url.hash = pageName;
    window.history.pushState({page: pageName}, '', url);
    
    // Actualizar el título de la página
    const pageTitle = {
        'home': 'NR-Zeo | Zeolita Natural para Agricultura',
        'about': 'Quiénes Somos | NR-Zeo',
        'products': 'Nuestros Productos | NR-Zeo',
        'benefits': 'Beneficios de la Zeolita | NR-Zeo',
        'experiments': 'Experimentos de Campo | NR-Zeo',
        'contact': 'Contáctanos | NR-Zeo'
    };
    
    document.title = pageTitle[pageName] || 'NR-Zeo';
}

// Actualizar la navegación activa
function updateActiveNavigation(pageName) {
    // Eliminar clase activa de todos los enlaces
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Añadir clase activa al enlace correspondiente
    const activeLink = document.querySelector(`.navbar-nav .nav-link[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Inicializar componentes de Bootstrap en el contenido cargado
function initializeBootstrapComponents() {
    // Re-inicializar carruseles
    document.querySelectorAll('.carousel').forEach(carousel => {
        new bootstrap.Carousel(carousel, {
            interval: 5000,
            wrap: true,
            touch: true
        });
    });
    
    // Re-inicializar pills/tabs
    document.querySelectorAll('[data-bs-toggle="pill"]').forEach(pill => {
        new bootstrap.Tab(pill);
    });
    
    // Re-inicializar tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    
    // Re-inicializar popovers
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(popover => {
        new bootstrap.Popover(popover);
    });
}

// Configurar enlaces para la navegación dinámica
function setupDynamicLinks() {
    // Seleccionar todos los enlaces que deben cargarse dinámicamente
    document.querySelectorAll('.nav-link-dynamic, .nav-link[data-page], a[data-page]').forEach(link => {
        // Eliminar cualquier manejador de eventos existente para evitar duplicados
        link.removeEventListener('click', dynamicLinkClickHandler);
        // Añadir el nuevo manejador de eventos
        link.addEventListener('click', dynamicLinkClickHandler);
    });
}

// Manejador de eventos para enlaces dinámicos
function dynamicLinkClickHandler(e) {
    e.preventDefault();
    
    // Extraer el nombre de la página del atributo data-page o del href
    const pageName = this.getAttribute('data-page') || this.getAttribute('href').replace('#', '');
    
    // Cambiar a la página solicitada
    switchPage(pageName);
    
    // Cerrar navbar en móvil después de clic
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
    }
}

// Función para traducción
function setLanguage(lang) {
    // Verificar que el objeto translations exista
    if (typeof translations === 'undefined') {
        console.error('Error: El objeto translations no fue encontrado.');
        return;
    }
    
    // Establecer dirección del texto según el idioma
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Aplicar traducciones
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        
        if (translations[lang] && translations[lang][key]) {
            const content = translations[lang][key];
            
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder) {
                    el.placeholder = content;
                } else {
                    el.value = content;
                }
            } else if (el.tagName === 'OPTION') {
                el.textContent = content;
            } else {
                el.innerHTML = content;
            }
        }
    });
    
    // Guardar preferencia
    localStorage.setItem('preferredLanguage', lang);
    
    // Activar botón de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active-lang');
    });
    
    const activeBtn = document.querySelector(`.lang-btn[onclick="setLanguage('${lang}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active-lang');
    }
}

// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configuración de la barra de navegación al hacer scroll
    const header = document.querySelector('.navbar');
    const backToTop = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
            if (backToTop) backToTop.classList.add('active');
        } else {
            header.classList.remove('scrolled');
            if (backToTop) backToTop.classList.remove('active');
        }
    });
    
    // Inicializar el carrusel si existe
    const carousel = document.getElementById('mainCarousel');
    if (carousel) {
        bootstrapCarousel = new bootstrap.Carousel(carousel, {
            interval: 5000,
            wrap: true,
            touch: true
        });
    }
    
    // Configurar enlaces para navegación dinámica
    setupDynamicLinks();
    
    // Manejar historial de navegación
    window.addEventListener('popstate', function(event) {
        const pageName = event.state?.page || 'home';
        switchPage(pageName);
    });
    
    // Cargar página inicial según el hash de la URL
    const hash = window.location.hash.replace('#', '');
    if (hash && ['about', 'products', 'benefits', 'experiments', 'contact'].includes(hash)) {
        switchPage(hash);
    }
    
    // Detectar idioma del navegador o usar el guardado
    const savedLang = localStorage.getItem('preferredLanguage');
    const userLang = savedLang || navigator.language.substring(0, 2);
    
    if (translations && translations[userLang]) {
        setLanguage(userLang);
    } else {
        setLanguage('es');
    }
    
    // Configurar botón "volver arriba"
    if (backToTop) {
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    }
});

// Función para animar contadores
function animateCounters() {
    document.querySelectorAll('.counter').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // ms
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}
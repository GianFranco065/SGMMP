// ===== VARIABLES GLOBALES MEJORADAS =====
let currentUser = null;
let currentModule = null;
let currentData = [];
let filteredData = [];
let currentPage = 1;
let recordsPerPage = 25;
let editingRecord = null;
let estadoChart = null;
let mantenimientosChart = null;

// NUEVAS VARIABLES PARA FUNCIONALIDADES MEJORADAS
let userPermissions = {};
let dropdownData = {};
let multipleRecords = {
    actividades: [],
    fallas: [],
    piezas: []
};

// Variables para ordenamiento
let currentSort = {
    column: null,
    direction: 'asc'
};

// ===== INICIALIZACIÓN MEJORADA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Sistema de Maquinaria Pesada MEJORADO...');
    
    // Verificar configuración
    if (!validateConfig()) {
        return;
    }
    
    // Event listeners mejorados
    setupEventListeners();
    
    // Verificar sesión guardada
    checkSavedSession();
    
    // Test de conexión
    testConnection();
    
    // Cargar datos de dropdown iniciales
    loadDropdownData();
});

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Modal close con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeUserModal();
            closeMultipleModal();
        }
    });
    
    // Click fuera del modal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal();
            closeUserModal();
            closeMultipleModal();
        }
    });
    
    // NUEVO: Event listeners para checkboxes múltiples
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('multiple-checkbox')) {
            handleMultipleCheckboxChange(e.target);
        }
    });
}

function checkSavedSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showMainApp();
            loadUserPermissions();
            loadDashboard();
        } catch (error) {
            console.error('Error cargando sesión guardada:', error);
            localStorage.removeItem('currentUser');
            showLogin();
        }
    } else {
        showLogin();
    }
}

// ===== FUNCIONES DE UTILIDAD MEJORADAS =====
function formatDate(dateValue, isTimeOnly = false, isDateOnly = false) {
    if (!dateValue) return '';
    
    let date;
    
    if (typeof dateValue === 'string') {
        if (dateValue.includes('1899-12-30')) {
            const timeMatch = dateValue.match(/T(\d{2}):(\d{2}):(\d{2})/);
            if (timeMatch && isTimeOnly) {
                return `${timeMatch[1]}:${timeMatch[2]}`;
            }
            return '';
        }
        
        if (dateValue.includes('T') || dateValue.includes('Z')) {
            date = new Date(dateValue);
        } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            date = new Date(dateValue + 'T00:00:00');
        } else {
            date = new Date(dateValue);
        }
    } else if (dateValue instanceof Date) {
        date = dateValue;
    } else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
    } else {
        return dateValue;
    }
    
    if (isNaN(date.getTime())) {
        return dateValue;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (isTimeOnly) {
        return `${hours}:${minutes}`;
    }
    
    if (isDateOnly) {
        return `${day}/${month}/${year}`;
    }
    
    if (hours === '00' && minutes === '00') {
        return `${day}/${month}/${year}`;
    } else {
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
}

function formatCellData(cellData, columnName) {
    if (!cellData) return '';
    
    const dateColumns = ['FECHA', 'FECHA_INGRESO', 'FECHA_CREACION', 'FECHA_RECORDATORIO', 'FECHA_ESPERADA'];
    const timeColumns = ['HORA', 'HORA_INICIO', 'HORA_TERMINO'];
    
    if (dateColumns.some(col => columnName.toUpperCase().includes(col))) {
        return formatDate(cellData, false, true);
    }
    
    if (timeColumns.some(col => columnName.toUpperCase().includes(col))) {
        return formatDate(cellData, true, false);
    }
    
    // NUEVO: Formateo especial para registros múltiples
    if (columnName === 'PERSONAL_ASIGNADO' || columnName === 'PERSONAL') {
        return formatMultiplePersonalDisplay(cellData);
    }
    
    if (columnName === 'FALLAS' || columnName === 'PIEZAS_FALTANTES') {
        return formatMultipleItemsDisplay(cellData);
    }
    
    if (typeof cellData === 'string' && cellData.length > 30) {
        return `<span title="${cellData}" class="truncated-text">${cellData.substring(0, 30)}...</span>`;
    }
    
    return cellData;
}

function formatDateForInput(fecha) {
    if (!fecha) return '';
    
    let date;
    if (typeof fecha === 'string') {
        date = new Date(fecha);
    } else if (fecha instanceof Date) {
        date = fecha;
    } else {
        return '';
    }
    
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// ===== NUEVAS FUNCIONES PARA REGISTROS MÚLTIPLES =====
function formatMultiplePersonalDisplay(personalString) {
    if (!personalString) return '';
    
    try {
        const personalArray = JSON.parse(personalString);
        if (Array.isArray(personalArray)) {
            return personalArray.join(', ');
        }
        return personalString;
    } catch (error) {
        // Si no es JSON, mostrar como texto normal
        return personalString;
    }
}

function formatMultipleItemsDisplay(itemsString) {
    if (!itemsString) return '';
    
    try {
        const itemsArray = JSON.parse(itemsString);
        if (Array.isArray(itemsArray)) {
            return itemsArray.map(item => `• ${item}`).join('<br>');
        }
        return itemsString;
    } catch (error) {
        // Si no es JSON, mostrar como texto normal
        return itemsString.replace(/;/g, '<br>• ');
    }
}

// ===== NOTIFICACIONES =====
function showStatus(message, type = 'info', duration = 4000) {
    const existingNotifications = document.querySelectorAll('.status-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-notification';
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    
    const colors = {
        'success': '#27ae60',
        'error': '#e74c3c',
        'warning': '#f39c12',
        'info': '#3498db'
    };
    
    statusDiv.style.background = colors[type] || colors.info;
    statusDiv.textContent = message;
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (document.body.contains(statusDiv)) {
                document.body.removeChild(statusDiv);
            }
        }, 300);
    }, duration);
}

function showError(message) {
    console.error('❌', message);
    showStatus(message, 'error');
}

function showSuccess(message) {
    console.log('✅', message);
    showStatus(message, 'success');
}

function showLoading(show = true) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// ===== VALIDACIONES =====
function validateConfig() {
    console.log('🔍 Validando configuración del sistema...');
    
    if (!CONFIG || !CONFIG.API_URL) {
        showError('ERROR: Configuración no encontrada. Verifica config.js');
        return false;
    }
    
    if (CONFIG.API_URL === 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
        showError('ERROR: Debes configurar la URL de Google Apps Script en config.js');
        return false;
    }
    
    console.log('✅ Configuración válida');
    return true;
}

// ===== COMUNICACIÓN CON GOOGLE APPS SCRIPT MEJORADA =====
function callGoogleScript(action, data = {}) {
    return new Promise((resolve, reject) => {
        console.log('📡 Iniciando llamada:', action, data);
        
        const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const script = document.createElement('script');
        
        function cleanup() {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
        }
        
        window[callbackName] = function(response) {
            console.log('📥 Respuesta recibida:', response);
            cleanup();
            resolve(response);
        };
        
        const timeout = setTimeout(() => {
            console.error('⏰ Timeout para acción:', action);
            cleanup();
            reject(new Error(`Timeout: ${action}`));
        }, 20000);
        
        const params = new URLSearchParams({
            callback: callbackName,
            action: action,
            data: JSON.stringify(data),
            timestamp: Date.now(),
            _: Math.random()
        });
        
        script.src = CONFIG.API_URL + '?' + params.toString();
        
        script.onerror = function() {
            console.error('❌ Error cargando script para acción:', action);
            clearTimeout(timeout);
            cleanup();
            reject(new Error(`Error de script: ${action}`));
        };
        
        script.onload = function() {
            clearTimeout(timeout);
        };
        
        document.head.appendChild(script);
    });
}

// ===== TEST DE CONEXIÓN =====
async function testConnection() {
    try {
        console.log('🔗 Probando conexión con Google Apps Script...');
        const response = await callGoogleScript('test');
        
        if (response && response.success) {
            console.log('✅ Conexión exitosa:', response.message);
        } else {
            showError('Error de conexión con el servidor');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showError('No se puede conectar con Google Apps Script. Verifica la URL en config.js');
    }
}

// ===== AUTENTICACIÓN MEJORADA =====
async function handleLogin(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('usuario').value.trim();
    const contraseña = document.getElementById('contraseña').value.trim();
    
    if (!usuario || !contraseña) {
        showError('Por favor ingresa usuario y contraseña');
        return;
    }
    
    console.log('🔐 Intentando login para:', usuario);
    showLoading(true);
    
    try {
        const response = await callGoogleScript('login', { usuario, contraseña });
        
        if (response && response.success) {
            currentUser = {
                usuario: response.data?.usuario || usuario,
                nombre_completo: response.data?.nombre_completo || `Usuario ${usuario}`,
                permisos: response.data?.permisos || 'limitado'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showSuccess(`Bienvenido ${currentUser.nombre_completo}`);
            showMainApp();
            
            // NUEVO: Cargar permisos específicos del usuario
            await loadUserPermissions();
            await loadDropdownData();
            loadDashboard();
        } else {
            showError(response?.message || 'Credenciales incorrectas');
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        showError('Error de conexión. Verifica tu internet y la configuración');
    } finally {
        showLoading(false);
    }
}

// ===== NUEVA FUNCIÓN PARA CARGAR PERMISOS DE USUARIO =====
async function loadUserPermissions() {
    try {
        if (!currentUser?.usuario) return;
        
        const response = await callGoogleScript('getUserPermissions', { 
            usuario: currentUser.usuario 
        });
        
        if (response && response.success) {
            userPermissions = response.data;
            console.log('👥 Permisos de usuario cargados:', userPermissions);
            
            // Actualizar interfaz según permisos
            updateUIBasedOnPermissions();
        }
    } catch (error) {
        console.error('❌ Error cargando permisos:', error);
        userPermissions = {}; // Permisos vacíos por defecto
    }
}

function updateUIBasedOnPermissions() {
    // Esta función actualizará la interfaz según los permisos del usuario
    // Se implementará cuando se carguen los módulos
    console.log('🔒 Actualizando interfaz según permisos de usuario');
}

// ===== NUEVA FUNCIÓN PARA CARGAR DATOS DE DROPDOWN =====
async function loadDropdownData() {
    try {
        console.log('📋 Cargando datos para listas desplegables...');
        
        const response = await callGoogleScript('getDropdownData', {});
        
        if (response && response.success) {
            dropdownData = response.data;
            console.log('✅ Datos de dropdown cargados:', dropdownData);
        }
    } catch (error) {
        console.error('❌ Error cargando datos dropdown:', error);
        dropdownData = {
            maquinarias: [],
            personal: [],
            tipos_mantenimiento: ['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO'],
            estados_maquinas: ['OPERATIVO', 'INOPERATIVO', 'STANDBY'],
            estados_programacion: ['PENDIENTE', 'PROXIMO', 'URGENTE', 'REALIZADO']
        };
    }
}

function logout() {
    console.log('👋 Cerrando sesión...');
    currentUser = null;
    currentModule = null;
    currentData = [];
    filteredData = [];
    userPermissions = {};
    dropdownData = {};
    localStorage.removeItem('currentUser');
    showLogin();
    showSuccess('Sesión cerrada correctamente');
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('usuario').value = '';
    document.getElementById('contraseña').value = '';
    document.getElementById('usuario').focus();
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('moduleView').style.display = 'none';
    
    const userName = currentUser?.nombre_completo || currentUser?.usuario || 'Usuario';
    const userPerms = currentUser?.permisos?.generales || 'limitado';
    
    document.getElementById('userInfo').innerHTML = `
        <span><strong>${userName}</strong></span>
        <small>Permisos: ${userPerms}</small>
    `;
}

// ===== DASHBOARD MEJORADO =====
async function loadDashboard() {
    try {
        console.log('📊 Cargando dashboard...');
        showLoading(true);
        
        await loadEstadisticas();
        await loadAlertsMantenimiento();
        loadModulesGrid();
        
        showSuccess('Dashboard cargado correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        showError('Error cargando dashboard: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function loadEstadisticas() {
    try {
        console.log('📈 Cargando estadísticas...');
        
        const response = await callGoogleScript('getDashboardData');
        
        if (response && response.success) {
            const data = response.data;
            
            // Actualizar estadísticas
            document.getElementById('statOperativas').textContent = data.operativas || 0;
            document.getElementById('statInoperativas').textContent = data.inoperativas || 0;
            document.getElementById('statStandby').textContent = data.standby || 0;
            document.getElementById('statTotal').textContent = data.total || 0;
            
            // Actualizar alertas
            document.getElementById('alertProximos').textContent = data.alertas_proximos || 0;
            document.getElementById('alertVencidos').textContent = data.alertas_vencidos || 0;
            
            // Crear gráficos
            createEstadoChart(data);
            createMantenimientosChart(data);
            
            console.log('✅ Estadísticas actualizadas');
        }
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

function createEstadoChart(data) {
    try {
        const ctx = document.getElementById('estadoChart');
        if (!ctx) return;
        
        if (estadoChart) {
            estadoChart.destroy();
        }
        
        estadoChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Operativas', 'Inoperativas', 'En Standby'],
                datasets: [{
                    data: [
                        data.porcentaje_operativas || 0,
                        data.porcentaje_inoperativas || 0,
                        data.porcentaje_standby || 0
                    ],
                    backgroundColor: ['#27ae60', '#e74c3c', '#f39c12'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                }
            }
        });
        
        console.log('📊 Gráfico de estado creado');
    } catch (error) {
        console.error('❌ Error creando gráfico de estado:', error);
    }
}

function createMantenimientosChart(data) {
    try {
        const ctx = document.getElementById('mantenimientosChart');
        if (!ctx) return;
        
        if (mantenimientosChart) {
            mantenimientosChart.destroy();
        }
        
        mantenimientosChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels_meses || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Mantenimientos',
                    data: data.mantenimientos_por_mes || [0, 0, 0, 0, 0, 0],
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        console.log('📊 Gráfico de mantenimientos creado');
    } catch (error) {
        console.error('❌ Error creando gráfico de mantenimientos:', error);
    }
}

async function loadAlertsMantenimiento() {
    try {
        console.log('🚨 Cargando alertas de mantenimiento...');
        
        const response = await callGoogleScript('getMaintenanceAlerts');
        
        if (response && response.success) {
            const alertas = response.data || [];
            displayAlertas(alertas);
            
            console.log('✅ Alertas de mantenimiento cargadas:', alertas.length);
        }
    } catch (error) {
        console.error('❌ Error cargando alertas:', error);
    }
}

function displayAlertas(alertas) {
    const container = document.getElementById('alertasContainer');
    if (!container) return;
    
    if (alertas.length === 0) {
        container.innerHTML = '<div class="no-alerts">✅ No hay alertas de mantenimiento pendientes</div>';
        return;
    }
    
    const alertasHTML = alertas.map(alerta => {
        const urgenciaClass = alerta.urgencia === 'alta' ? 'alert-vencido' : '';
        const urgenciaText = alerta.estado === 'URGENTE' ? 'VENCIDO' : 'PRÓXIMO';
        const fechaEsperada = alerta.fecha_esperada ? formatDate(alerta.fecha_esperada, false, true) : 'No calculada';
        
        return `
            <div class="alert-item ${urgenciaClass}">
                <div class="alert-maquinaria">${alerta.maquinaria}</div>
                <div class="alert-trabajos">${alerta.trabajos}</div>
                <div class="alert-horometro">
                    <strong>${alerta.horometro_actual}</strong> / ${alerta.proximo_horometro} hrs
                </div>
                <div class="alert-faltantes">
                    ${alerta.horas_faltantes} hrs restantes
                </div>
                <div class="alert-fecha">
                    ${fechaEsperada}
                </div>
                <div class="alert-urgencia ${alerta.urgencia === 'alta' ? 'urgente' : 'proximo'}">
                    ${urgenciaText}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="alerts-list">
            <div class="alert-item" style="background: #34495e; color: white; font-weight: bold;">
                <div>Máquina</div>
                <div>Trabajos Programados</div>
                <div>Horómetro</div>
                <div>Horas Restantes</div>
                <div>Fecha Esperada</div>
                <div>Estado</div>
            </div>
            ${alertasHTML}
        </div>
    `;
}

// ===== GESTIÓN DE MÓDULOS MEJORADA =====
function loadModulesGrid() {
    try {
        console.log('🧩 Cargando grid de módulos...');
        
        const modulesGrid = document.getElementById('modulesGrid');
        if (!modulesGrid) return;
        
        const modules = Object.entries(CONFIG.MODULOS).map(([key, module]) => {
            // Verificar permisos del usuario para cada módulo
            const hasPermission = checkModulePermission(key);
            const permissionClass = hasPermission ? '' : 'module-disabled';
            const permissionText = hasPermission ? '' : '<small>Sin acceso</small>';
            
            return `
                <div class="module-card ${permissionClass}" onclick="${hasPermission ? `loadModule('${key}')` : 'showPermissionError()'}">
                    <div class="module-icon">${module.emoji}</div>
                    <div class="module-content">
                        <h3>${module.nombre}</h3>
                        <p>${module.descripcion}</p>
                        ${permissionText}
                    </div>
                    ${hasPermission ? '<div class="module-arrow">→</div>' : '<div class="module-lock">🔒</div>'}
                </div>
            `;
        }).join('');
        
        modulesGrid.innerHTML = modules;
        
        console.log('✅ Grid de módulos cargado');
    } catch (error) {
        console.error('❌ Error cargando módulos:', error);
    }
}

function checkModulePermission(moduleKey) {
    // Si es administrador, tiene acceso a todo
    if (currentUser?.permisos?.generales === 'completo') {
        return true;
    }
    
    // Verificar permisos específicos por módulo
    const modulePermissionMap = {
        'Personal': userPermissions?.personal,
        'Maquinarias': userPermissions?.maquinarias,
        'mantenimientos': userPermissions?.mantenimientos,
        'Horometros': userPermissions?.horometros,
        'Programacion_Mantenimiento': userPermissions?.programacion,
        'Movimientos_Maquinarias': userPermissions?.movimientos_maq,
        'Movimientos_Piezas': userPermissions?.movimientos_piezas,
        'Estados_Maquinas': userPermissions?.estados_maq,
        'Piezas_Standby': userPermissions?.piezas_standby,
        'Comidas': userPermissions?.comidas_notas,
        'Notas': userPermissions?.comidas_notas,
        'Usuarios': currentUser?.permisos?.generales === 'completo'
    };
    
    const permission = modulePermissionMap[moduleKey];
    return permission === 'completo' || permission === 'lectura';
}

function showPermissionError() {
    showError('No tienes permisos para acceder a este módulo. Contacta al administrador.');
}

// ===== CARGA DE MÓDULO MEJORADA =====
async function loadModule(moduleName) {
    try {
        console.log('📂 Cargando módulo:', moduleName);
        
        // Verificar permisos
        if (!checkModulePermission(moduleName)) {
            showPermissionError();
            return;
        }
        
        showLoading(true);
        currentModule = moduleName;
        currentPage = 1;
        
        // Actualizar datos de dropdown si es necesario
        await loadDropdownData();
        
        // Cargar datos del módulo
        const response = await callGoogleScript('getData', { sheet: moduleName });
        
        if (response && response.success) {
            currentData = response.data || [];
            filteredData = [...currentData];
            
            // Mostrar vista del módulo
            showModuleView();
            setupModuleInterface();
            renderDataTable();
            
            showSuccess(`Módulo ${CONFIG.MODULOS[moduleName]?.nombre || moduleName} cargado`);
        } else {
            showError('Error cargando datos del módulo');
        }
        
    } catch (error) {
        console.error('❌ Error cargando módulo:', error);
        showError('Error cargando módulo: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showModuleView() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('moduleView').style.display = 'block';
    
    const moduleConfig = CONFIG.MODULOS[currentModule];
    const moduleTitle = `${moduleConfig?.emoji || '📋'} ${moduleConfig?.nombre || currentModule}`;
    
    document.getElementById('moduleTitle').textContent = moduleTitle;
}

function setupModuleInterface() {
    // Configurar controles según permisos
    const hasWritePermission = checkModuleWritePermission(currentModule);
    
    // Mostrar/ocultar botones según permisos
    const addButton = document.querySelector('[onclick="showAddModal()"]');
    const saveButton = document.querySelector('[onclick="guardarEnSheets()"]');
    
    if (addButton) addButton.style.display = hasWritePermission ? 'inline-flex' : 'none';
    if (saveButton) saveButton.style.display = hasWritePermission ? 'inline-flex' : 'none';
    
    // Configurar búsqueda y filtros
    setupSearchAndFilters();
    
    // Actualizar contador de registros
    updateRecordsCount();
}

function checkModuleWritePermission(moduleKey) {
    // Si es administrador, tiene acceso completo
    if (currentUser?.permisos?.generales === 'completo') {
        return true;
    }
    
    // Verificar permisos específicos de escritura
    const modulePermissionMap = {
        'Personal': userPermissions?.personal,
        'Maquinarias': userPermissions?.maquinarias,
        'mantenimientos': userPermissions?.mantenimientos,
        'Horometros': userPermissions?.horometros,
        'Programacion_Mantenimiento': userPermissions?.programacion,
        'Movimientos_Maquinarias': userPermissions?.movimientos_maq,
        'Movimientos_Piezas': userPermissions?.movimientos_piezas,
        'Estados_Maquinas': userPermissions?.estados_maq,
        'Piezas_Standby': userPermissions?.piezas_standby,
        'Comidas': userPermissions?.comidas_notas,
        'Notas': userPermissions?.comidas_notas,
        'Usuarios': currentUser?.permisos?.generales === 'completo'
    };
    
    const permission = modulePermissionMap[moduleKey];
    return permission === 'completo';
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.removeEventListener('input', handleSearch);
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (filterSelect) {
        populateFilterOptions();
        filterSelect.removeEventListener('change', handleFilter);
        filterSelect.addEventListener('change', handleFilter);
    }
}

function populateFilterOptions() {
    const filterSelect = document.getElementById('filterSelect');
    if (!filterSelect || !currentData.length) return;
    
    filterSelect.innerHTML = '<option value="">Todos los registros</option>';
    
    // Agregar opciones de filtro específicas según el módulo
    if (currentModule === 'Maquinarias') {
        const estados = [...new Set(currentData.slice(1).map(row => row[5]).filter(Boolean))];
        estados.forEach(estado => {
            filterSelect.innerHTML += `<option value="estado:${estado}">Estado: ${estado}</option>`;
        });
    } else if (currentModule === 'mantenimientos') {
        const tipos = [...new Set(currentData.slice(1).map(row => row[4]).filter(Boolean))];
        tipos.forEach(tipo => {
            filterSelect.innerHTML += `<option value="tipo:${tipo}">Tipo: ${tipo}</option>`;
        });
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredData = [...currentData];
    } else {
        filteredData = currentData.filter((row, index) => {
            if (index === 0) return true; // Mantener headers
            
            return row.some(cell => {
                if (cell === null || cell === undefined) return false;
                return String(cell).toLowerCase().includes(searchTerm);
            });
        });
    }
    
    currentPage = 1;
    renderDataTable();
    updateRecordsCount();
}

function handleFilter(event) {
    const filterValue = event.target.value;
    
    if (!filterValue) {
        filteredData = [...currentData];
    } else {
        const [filterType, filterCriteria] = filterValue.split(':');
        
        filteredData = currentData.filter((row, index) => {
            if (index === 0) return true; // Mantener headers
            
            if (filterType === 'estado') {
                return row[5] === filterCriteria; // Columna de estado en maquinarias
            } else if (filterType === 'tipo') {
                return row[4] === filterCriteria; // Columna de tipo en mantenimientos
            }
            
            return true;
        });
    }
    
    currentPage = 1;
    renderDataTable();
    updateRecordsCount();
}

function updateRecordsCount() {
    const recordsCount = document.getElementById('recordsCount');
    if (recordsCount) {
        const totalRecords = filteredData.length > 0 ? filteredData.length - 1 : 0; // -1 para excluir headers
        recordsCount.textContent = `${totalRecords} registro${totalRecords !== 1 ? 's' : ''}`;
    }
}

// ===== RENDERIZADO DE TABLA MEJORADO =====
function renderDataTable() {
    try {
        const tableHead = document.getElementById('dataTableHead');
        const tableBody = document.getElementById('dataTableBody');
        
        if (!tableHead || !tableBody || !filteredData.length) {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 2rem;">No hay datos disponibles</td></tr>';
            }
            return;
        }
        
        // Renderizar headers
        const headers = filteredData[0];
        const headerHTML = headers.map((header, index) => 
            `<th onclick="sortTable(${index})" class="sortable-header">
                ${header}
                <span class="sort-indicator"></span>
            </th>`
        ).join('');
        
        tableHead.innerHTML = `
            <tr>
                ${headerHTML}
                ${checkModuleWritePermission(currentModule) ? '<th>Acciones</th>' : ''}
            </tr>
        `;
        
        // Calcular paginación
        const startIndex = (currentPage - 1) * recordsPerPage + 1;
        const endIndex = Math.min(startIndex + recordsPerPage - 1, filteredData.length - 1);
        const dataToShow = filteredData.slice(startIndex, endIndex + 1);
        
        // Renderizar datos
        const rowsHTML = dataToShow.map((row, index) => {
            const actualIndex = startIndex + index - 1;
            const cellsHTML = row.map((cell, cellIndex) => 
                `<td>${formatCellData(cell, headers[cellIndex])}</td>`
            ).join('');
            
            const actionsHTML = checkModuleWritePermission(currentModule) ? 
                `<td class="actions-cell">
                    <button onclick="editRecord(${actualIndex})" class="btn-action btn-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteRecord(${actualIndex})" class="btn-action btn-delete" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>` : '';
            
            return `<tr>${cellsHTML}${actionsHTML}</tr>`;
        }).join('');
        
        tableBody.innerHTML = rowsHTML;
        
        // Actualizar información de paginación
        updatePaginationInfo();
        
        console.log('✅ Tabla renderizada');
    } catch (error) {
        console.error('❌ Error renderizando tabla:', error);
    }
}

function sortTable(columnIndex) {
    if (filteredData.length <= 1) return;
    
    const isCurrentColumn = currentSort.column === columnIndex;
    const newDirection = isCurrentColumn && currentSort.direction === 'asc' ? 'desc' : 'asc';
    
    currentSort = {
        column: columnIndex,
        direction: newDirection
    };
    
    // Ordenar datos (manteniendo headers en la primera posición)
    const headers = filteredData[0];
    const dataRows = filteredData.slice(1);
    
    dataRows.sort((a, b) => {
        let aVal = a[columnIndex] || '';
        let bVal = b[columnIndex] || '';
        
        // Convertir a números si es posible
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return newDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // Comparación de strings
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        
        if (newDirection === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });
    
    filteredData = [headers, ...dataRows];
    renderDataTable();
    
    // Actualizar indicadores visuales de ordenamiento
    updateSortIndicators();
}

function updateSortIndicators() {
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.textContent = '';
    });
    
    if (currentSort.column !== null) {
        const indicator = document.querySelectorAll('.sort-indicator')[currentSort.column];
        if (indicator) {
            indicator.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
        }
    }
}

function updatePaginationInfo() {
    const totalRecords = filteredData.length > 0 ? filteredData.length - 1 : 0;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
    
    // Actualizar botones de paginación
    const prevButton = document.querySelector('[onclick="previousPage()"]');
    const nextButton = document.querySelector('[onclick="nextPage()"]');
    
    if (prevButton) prevButton.disabled = currentPage <= 1;
    if (nextButton) nextButton.disabled = currentPage >= totalPages;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderDataTable();
    }
}

function nextPage() {
    const totalRecords = filteredData.length > 0 ? filteredData.length - 1 : 0;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        renderDataTable();
    }
}

// ===== FUNCIONES DE MODAL MEJORADAS =====
function showAddModal() {
    if (!checkModuleWritePermission(currentModule)) {
        showPermissionError();
        return;
    }
    
    editingRecord = null;
    multipleRecords = { actividades: [], fallas: [], piezas: [] };
    
    const modalTitle = document.getElementById('modalTitle');
    const moduleConfig = CONFIG.MODULOS[currentModule];
    
    if (modalTitle) {
        modalTitle.textContent = `${moduleConfig?.emoji || '➕'} Agregar ${moduleConfig?.nombre || 'Registro'}`;
    }
    
    generateModalForm();
    showModal();
}

function editRecord(index) {
    if (!checkModuleWritePermission(currentModule)) {
        showPermissionError();
        return;
    }
    
    editingRecord = index;
    multipleRecords = { actividades: [], fallas: [], piezas: [] };
    
    const modalTitle = document.getElementById('modalTitle');
    const moduleConfig = CONFIG.MODULOS[currentModule];
    
    if (modalTitle) {
        modalTitle.textContent = `${moduleConfig?.emoji || '✏️'} Editar ${moduleConfig?.nombre || 'Registro'}`;
    }
    
    generateModalForm(true);
    showModal();
}

function generateModalForm(isEdit = false) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody || !currentData.length) return;
    
    const headers = currentData[0];
    const editData = isEdit && editingRecord !== null ? filteredData[editingRecord + 1] : null;
    
    let formHTML = '<div class="modal-form">';
    
    headers.forEach((header, index) => {
        const fieldValue = editData ? editData[index] || '' : '';
        const fieldId = `field_${index}`;
        
        formHTML += generateFormField(header, fieldId, fieldValue, index);
    });
    
    formHTML += '</div>';
    
    modalBody.innerHTML = formHTML;
    
    // Inicializar campos especiales después de crear el formulario
    initializeSpecialFields();
}

function generateFormField(header, fieldId, value, index) {
    const headerUpper = header.toUpperCase();
    
    // Campos de fecha
    if (headerUpper.includes('FECHA')) {
        const dateValue = formatDateForInput(value);
        return `
            <div class="form-group">
                <label for="${fieldId}">${header}</label>
                <input type="date" id="${fieldId}" class="form-input" value="${dateValue}">
            </div>
        `;
    }
    
    // Campos de hora
    if (headerUpper.includes('HORA')) {
        const timeValue = value ? formatDate(value, true, false) : '';
        return `
            <div class="form-group">
                <label for="${fieldId}">${header}</label>
                <input type="time" id="${fieldId}" class="form-input" value="${timeValue}">
            </div>
        `;
    }
    
    // Campos de horómetro (números decimales)
    if (headerUpper.includes('HOROMETRO')) {
        return `
            <div class="form-group">
                <label for="${fieldId}">${header}</label>
                <input type="number" step="0.1" id="${fieldId}" class="form-input" value="${value}" placeholder="Ej: 1250.5">
            </div>
        `;
    }
    
    // Lista desplegable de maquinarias
    if (headerUpper === 'MAQUINARIA') {
        const options = dropdownData.maquinarias?.map(maq => 
            `<option value="${maq}" ${maq === value ? 'selected' : ''}>${maq}</option>`
        ).join('') || '';
        
        return `
            <div class="form-group">
                <label for="${fieldId}">${header}</label>
                <select id="${fieldId}" class="form-input">
                    <option value="">Seleccionar maquinaria...</option>
                    ${options}
                </select>
            </div>
        `;
    }
    
    // Lista desplegable de estados
    if (headerUpper === 'ESTADO' && currentModule === 'Maquinarias') {
        const options = dropdownData.estados_maquinas?.map(estado => 
            `<option value="${estado}" ${estado === value ? 'selected' : ''}>${estado}</option>`
        ).join('') || '';
        
        return `
            <div class="form-group">
                <label for="${fieldId}">${header}</label>
                <select id="${fieldId}" class="form-input">
                    <option value="">Seleccionar estado...</option>
                    ${options}
                </select>
            </div>
        `;
    }
    
    // Lista desplegable de tipos de mantenimiento
    if (headerUpper === 'TIPO_MANTENIMIENTO') {
        const options = dropdownData.tipos_mantenimiento?.map(tipo => 
            `<option value="${tipo}" ${tipo === value ? 'selected' : ''}>${tipo}</option>`
        ).join('') || '';
        
        return `
            <div class="form-group">
                <label for="${fieldId}">${header}</label>
                <select id="${fieldId}" class="form-input">
                    <option value="">Seleccionar tipo...</option>
                    ${options}
                </select>
            </div>
        `;
    }
    
    // NUEVO: Personal con checkboxes múltiples
    if (headerUpper === 'PERSONAL_ASIGNADO' || (headerUpper === 'PERSONAL' && currentModule !== 'Personal')) {
        return generateMultiplePersonalField(header, fieldId, value);
    }
    
    // NUEVO: Trabajos/actividades múltiples
    if (headerUpper === 'TRABAJO_REALIZADO' || headerUpper === 'TRABAJOS_A_REALIZAR') {
        return generateMultipleActivitiesField(header, fieldId, value);
    }
    
    // NUEVO: Fallas múltiples
    if (headerUpper === 'FALLAS') {
        return generateMultipleItemsField(header, fieldId, value, 'fallas');
    }
    
    // NUEVO: Piezas faltantes múltiples
    if (headerUpper === 'PIEZAS_FALTANTES') {
        return generateMultipleItemsField(header, fieldId, value, 'piezas');
    }
    
    // Campos de texto largo
    if (headerUpper.includes('OBSERVACIONES') || headerUpper.includes('NOTAS')) {
        return `
            <div class="form-group">
                <label for="${fieldId}">${header}</label>
                <textarea id="${fieldId}" class="form-input" rows="3" placeholder="Ingrese ${header.toLowerCase()}...">${value}</textarea>
            </div>
        `;
    }
    
    // Campo de texto normal
    return `
        <div class="form-group">
            <label for="${fieldId}">${header}</label>
            <input type="text" id="${fieldId}" class="form-input" value="${value}" placeholder="Ingrese ${header.toLowerCase()}...">
        </div>
    `;
}

// ===== NUEVAS FUNCIONES PARA CAMPOS MÚLTIPLES =====
function generateMultiplePersonalField(header, fieldId, value) {
    const selectedPersonal = value ? parseMultipleValue(value) : [];
    
    const checkboxes = dropdownData.personal?.map(person => {
        const isSelected = selectedPersonal.includes(person.nombre_completo);
        return `
            <label class="checkbox-label">
                <input type="checkbox" 
                       class="multiple-checkbox" 
                       data-field="${fieldId}"
                       value="${person.nombre_completo}" 
                       ${isSelected ? 'checked' : ''}>
                <span class="checkbox-text">${person.nombre_completo}</span>
            </label>
        `;
    }).join('') || '<p>No hay personal disponible</p>';
    
    return `
        <div class="form-group">
            <label>${header} (Selección múltiple)</label>
            <div class="multiple-selection-container" id="${fieldId}">
                ${checkboxes}
            </div>
            <div class="selected-items" id="${fieldId}_selected">
                <strong>Seleccionados:</strong> <span>${selectedPersonal.join(', ') || 'Ninguno'}</span>
            </div>
        </div>
    `;
}

function generateMultipleActivitiesField(header, fieldId, value) {
    const activities = value ? parseMultipleValue(value) : [];
    
    // Inicializar registros múltiples
    multipleRecords.actividades = activities.map(act => ({ actividad: act, tipo: 'PREVENTIVO' }));
    
    return `
        <div class="form-group">
            <label>${header} (Registros múltiples)</label>
            <div class="multiple-activities-container">
                <div class="activity-input-group">
                    <input type="text" id="${fieldId}_input" class="form-input" placeholder="Descripción de la actividad...">
                    <select id="${fieldId}_tipo" class="form-input">
                        <option value="PREVENTIVO">PREVENTIVO</option>
                        <option value="CORRECTIVO">CORRECTIVO</option>
                        <option value="PREDICTIVO">PREDICTIVO</option>
                    </select>
                    <button type="button" onclick="addActivity('${fieldId}')" class="btn btn-success btn-sm">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
                <div class="activities-list" id="${fieldId}_list">
                    ${renderActivitiesList()}
                </div>
            </div>
        </div>
    `;
}

function generateMultipleItemsField(header, fieldId, value, type) {
    const items = value ? parseMultipleValue(value) : [];
    
    // Inicializar registros múltiples
    multipleRecords[type] = items;
    
    return `
        <div class="form-group">
            <label>${header} (Registros múltiples)</label>
            <div class="multiple-items-container">
                <div class="item-input-group">
                    <input type="text" id="${fieldId}_input" class="form-input" placeholder="Descripción...">
                    <button type="button" onclick="addItem('${fieldId}', '${type}')" class="btn btn-success btn-sm">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
                <div class="items-list" id="${fieldId}_list">
                    ${renderItemsList(type)}
                </div>
            </div>
        </div>
    `;
}

function parseMultipleValue(value) {
    if (!value) return [];
    
    try {
        // Intentar parsear como JSON
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
    } catch (error) {
        // Si no es JSON, separar por punto y coma o coma
        return value.split(/[;,]/).map(item => item.trim()).filter(item => item.length > 0);
    }
}

function handleMultipleCheckboxChange(checkbox) {
    const fieldId = checkbox.getAttribute('data-field');
    const selectedContainer = document.getElementById(`${fieldId}_selected`);
    
    if (!selectedContainer) return;
    
    const checkboxes = document.querySelectorAll(`[data-field="${fieldId}"]:checked`);
    const selectedValues = Array.from(checkboxes).map(cb => cb.value);
    
    const selectedSpan = selectedContainer.querySelector('span');
    if (selectedSpan) {
        selectedSpan.textContent = selectedValues.length > 0 ? selectedValues.join(', ') : 'Ninguno';
    }
}

function addActivity(fieldId) {
    const input = document.getElementById(`${fieldId}_input`);
    const tipoSelect = document.getElementById(`${fieldId}_tipo`);
    const listContainer = document.getElementById(`${fieldId}_list`);
    
    if (!input || !tipoSelect || !input.value.trim()) return;
    
    const newActivity = {
        actividad: input.value.trim(),
        tipo: tipoSelect.value
    };
    
    multipleRecords.actividades.push(newActivity);
    
    input.value = '';
    listContainer.innerHTML = renderActivitiesList();
}

function addItem(fieldId, type) {
    const input = document.getElementById(`${fieldId}_input`);
    const listContainer = document.getElementById(`${fieldId}_list`);
    
    if (!input || !input.value.trim()) return;
    
    multipleRecords[type].push(input.value.trim());
    
    input.value = '';
    listContainer.innerHTML = renderItemsList(type);
}

function renderActivitiesList() {
    return multipleRecords.actividades.map((act, index) => `
        <div class="activity-item">
            <span class="activity-text">${act.actividad}</span>
            <span class="activity-type">${act.tipo}</span>
            <button type="button" onclick="removeActivity(${index})" class="btn-remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function renderItemsList(type) {
    return multipleRecords[type].map((item, index) => `
        <div class="item-entry">
            <span class="item-text">${item}</span>
            <button type="button" onclick="removeItem(${index}, '${type}')" class="btn-remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeActivity(index) {
    multipleRecords.actividades.splice(index, 1);
    const listContainer = document.querySelector('.activities-list');
    if (listContainer) {
        listContainer.innerHTML = renderActivitiesList();
    }
}

function removeItem(index, type) {
    multipleRecords[type].splice(index, 1);
    const listContainer = document.getElementById(`field_${type === 'fallas' ? '3' : '4'}_list`);
    if (listContainer) {
        listContainer.innerHTML = renderItemsList(type);
    }
}

function initializeSpecialFields() {
    // Inicializar campos especiales después de generar el formulario
    console.log('🎯 Inicializando campos especiales...');
    
    // Actualizar contadores de selección múltiple
    document.querySelectorAll('.multiple-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleMultipleCheckboxChange(this);
        });
    });
}

// ===== FUNCIONES DE GUARDADO MEJORADAS =====
async function saveRecord() {
    try {
        if (!currentData.length) {
            showError('No hay estructura de datos disponible');
            return;
        }
        
        showLoading(true);
        
        const headers = currentData[0];
        const formData = [];
        
        // Recopilar datos del formulario
        headers.forEach((header, index) => {
            const fieldId = `field_${index}`;
            let value = '';
            
            // Manejar campos especiales
            if (header.toUpperCase() === 'PERSONAL_ASIGNADO' || (header.toUpperCase() === 'PERSONAL' && currentModule !== 'Personal')) {
                value = getMultiplePersonalValue(fieldId);
            } else if (header.toUpperCase() === 'TRABAJO_REALIZADO' || header.toUpperCase() === 'TRABAJOS_A_REALIZAR') {
                value = getMultipleActivitiesValue();
            } else if (header.toUpperCase() === 'FALLAS') {
                value = JSON.stringify(multipleRecords.fallas);
            } else if (header.toUpperCase() === 'PIEZAS_FALTANTES') {
                value = JSON.stringify(multipleRecords.piezas);
            } else {
                const field = document.getElementById(fieldId);
                value = field ? field.value : '';
            }
            
            formData.push(value);
        });
        
        // Actualizar datos locales
        if (editingRecord !== null) {
            // Editar registro existente
            const actualIndex = editingRecord + 1; // +1 para saltar headers
            if (actualIndex < currentData.length) {
                currentData[actualIndex] = formData;
                filteredData[actualIndex] = formData;
            }
        } else {
            // Agregar nuevo registro
            currentData.push(formData);
            filteredData.push(formData);
        }
        
        // Guardar en Google Sheets
        await guardarEnSheets();
        
        // Actualizar vinculaciones automáticas
        await updateLinkedModules(formData, headers);
        
        closeModal();
        renderDataTable();
        updateRecordsCount();
        
        showSuccess(editingRecord !== null ? 'Registro actualizado correctamente' : 'Registro agregado correctamente');
        
    } catch (error) {
        console.error('❌ Error guardando registro:', error);
        showError('Error guardando registro: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function getMultiplePersonalValue(fieldId) {
    const checkboxes = document.querySelectorAll(`[data-field="${fieldId}"]:checked`);
    const selectedValues = Array.from(checkboxes).map(cb => cb.value);
    return JSON.stringify(selectedValues);
}

function getMultipleActivitiesValue() {
    const activities = multipleRecords.actividades.map(act => `${act.actividad} (${act.tipo})`);
    return JSON.stringify(activities);
}

async function updateLinkedModules(formData, headers) {
    try {
        const maquinariaIndex = headers.findIndex(h => h.toUpperCase() === 'MAQUINARIA');
        
        if (maquinariaIndex === -1) return;
        
        const maquinaria = formData[maquinariaIndex];
        if (!maquinaria) return;
        
        // Actualizar según el módulo
        switch (currentModule) {
            case 'Horometros':
                const horometroFinalIndex = headers.findIndex(h => h.toUpperCase() === 'HOROMETRO_FINAL');
                if (horometroFinalIndex !== -1) {
                    await callGoogleScript('updateLinkedData', {
                        sourceSheet: 'Horometros',
                        targetSheet: 'Maquinarias',
                        updates: {
                            maquinaria: maquinaria,
                            horometro_final: formData[horometroFinalIndex]
                        }
                    });
                    
                    // Actualizar fecha esperada de mantenimiento
                    await callGoogleScript('calculateExpectedDate', { maquinaria: maquinaria });
                }
                break;
                
            case 'Movimientos_Maquinarias':
                const nuevaUbicacionIndex = headers.findIndex(h => h.toUpperCase() === 'NUEVA_UBICACION');
                if (nuevaUbicacionIndex !== -1) {
                    await callGoogleScript('updateLinkedData', {
                        sourceSheet: 'Movimientos_Maquinarias',
                        targetSheet: 'Maquinarias',
                        updates: {
                            maquinaria: maquinaria,
                            nueva_ubicacion: formData[nuevaUbicacionIndex]
                        }
                    });
                }
                break;
                
            case 'Estados_Maquinas':
                const estadoIndex = headers.findIndex(h => h.toUpperCase() === 'ESTADO');
                if (estadoIndex !== -1) {
                    await callGoogleScript('updateLinkedData', {
                        sourceSheet: 'Estados_Maquinas',
                        targetSheet: 'Maquinarias',
                        updates: {
                            maquinaria: maquinaria,
                            estado: formData[estadoIndex]
                        }
                    });
                }
                break;
        }
        
        console.log('🔗 Vinculaciones actualizadas');
    } catch (error) {
        console.error('❌ Error actualizando vinculaciones:', error);
    }
}

async function deleteRecord(index) {
    if (!checkModuleWritePermission(currentModule)) {
        showPermissionError();
        return;
    }
    
    const confirmMessage = '¿Estás seguro de que deseas eliminar este registro?';
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showLoading(true);
        
        // Eliminar de datos locales
        const actualIndex = index + 1; // +1 para saltar headers
        currentData.splice(actualIndex, 1);
        filteredData.splice(actualIndex, 1);
        
        // Guardar cambios
        await guardarEnSheets();
        
        renderDataTable();
        updateRecordsCount();
        
        showSuccess('Registro eliminado correctamente');
        
    } catch (error) {
        console.error('❌ Error eliminando registro:', error);
        showError('Error eliminando registro: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function guardarEnSheets() {
    try {
        console.log('💾 Guardando en Google Sheets...');
        
        const response = await callGoogleScript('saveData', {
            sheet: currentModule,
            data: currentData
        });
        
        if (response && response.success) {
            console.log('✅ Datos guardados en Sheets');
            return true;
        } else {
            throw new Error(response?.message || 'Error desconocido guardando datos');
        }
    } catch (error) {
        console.error('❌ Error guardando en Sheets:', error);
        showError('Error guardando en Google Sheets: ' + error.message);
        return false;
    }
}

// ===== FUNCIONES DE EXPORTACIÓN =====
async function exportarExcel() {
    try {
        if (!currentData.length) {
            showError('No hay datos para exportar');
            return;
        }
        
        console.log('📊 Exportando a Excel...');
        showLoading(true);
        
        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        
        // Convertir datos para Excel
        const excelData = filteredData.map(row => 
            row.map(cell => {
                // Procesar campos múltiples
                if (typeof cell === 'string' && cell.startsWith('[') && cell.endsWith(']')) {
                    try {
                        const parsed = JSON.parse(cell);
                        return Array.isArray(parsed) ? parsed.join('; ') : cell;
                    } catch (e) {
                        return cell;
                    }
                }
                return cell;
            })
        );
        
        // Crear hoja de trabajo
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Ajustar ancho de columnas
        const colWidths = excelData[0].map((_, colIndex) => {
            const maxLength = Math.max(
                ...excelData.map(row => 
                    String(row[colIndex] || '').length
                )
            );
            return { wch: Math.min(Math.max(maxLength, 10), 50) };
        });
        
        ws['!cols'] = colWidths;
        
        // Agregar hoja al libro
        const sheetName = CONFIG.MODULOS[currentModule]?.nombre || currentModule;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Generar archivo
        const fileName = `${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showSuccess('Archivo Excel exportado correctamente');
        
    } catch (error) {
        console.error('❌ Error exportando Excel:', error);
        showError('Error exportando Excel. Asegúrate de tener habilitada la descarga de archivos.');
    } finally {
        showLoading(false);
    }
}

// ===== GESTIÓN DE USUARIOS =====
async function showUserManagement() {
    if (currentUser?.permisos?.generales !== 'completo') {
        showPermissionError();
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await callGoogleScript('getAllUsers');
        
        if (response && response.success) {
            displayUserManagementModal(response.data);
        } else {
            showError('Error cargando usuarios');
        }
    } catch (error) {
        console.error('❌ Error cargando gestión de usuarios:', error);
        showError('Error cargando gestión de usuarios');
    } finally {
        showLoading(false);
    }
}

function displayUserManagementModal(usersData) {
    const userModalBody = document.getElementById('userModalBody');
    if (!userModalBody) return;
    
    const headers = usersData[0] || [];
    const users = usersData.slice(1);
    
    let modalHTML = `
        <div class="user-management-container">
            <div class="user-controls">
                <button onclick="showAddUserForm()" class="btn btn-success">
                    <i class="fas fa-user-plus"></i> Agregar Usuario
                </button>
            </div>
            
            <div class="users-table-container">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Nombre Completo</th>
                            <th>Permisos Generales</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    users.forEach((user, index) => {
        modalHTML += `
            <tr>
                <td>${user[0] || ''}</td>
                <td>${user[2] || ''}</td>
                <td><span class="permission-badge ${user[3] === 'completo' ? 'admin' : 'limited'}">${user[3] || 'limitado'}</span></td>
                <td><span class="status-badge ${user[4] === 'SI' ? 'active' : 'inactive'}">${user[4] === 'SI' ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button onclick="editUser(${index})" class="btn-action btn-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user[0] !== 'admin' ? `
                        <button onclick="deleteUser('${user[0]}')" class="btn-action btn-delete" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    modalHTML += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    userModalBody.innerHTML = modalHTML;
    
    // Guardar datos de usuarios para edición
    window.currentUsersData = usersData;
    
    showUserModal();
}

function showAddUserForm() {
    const userModalBody = document.getElementById('userModalBody');
    if (!userModalBody) return;
    
    userModalBody.innerHTML = generateUserForm();
    
    // Cambiar título del modal
    const userModalTitle = document.getElementById('userModalTitle');
    if (userModalTitle) {
        userModalTitle.textContent = '👤 Agregar Nuevo Usuario';
    }
}

function editUser(index) {
    const userModalBody = document.getElementById('userModalBody');
    if (!userModalBody || !window.currentUsersData) return;
    
    const userData = window.currentUsersData[index + 1]; // +1 para saltar headers
    userModalBody.innerHTML = generateUserForm(userData);
    
    // Cambiar título del modal
    const userModalTitle = document.getElementById('userModalTitle');
    if (userModalTitle) {
        userModalTitle.textContent = '✏️ Editar Usuario';
    }
}

function generateUserForm(userData = null) {
    const isEdit = userData !== null;
    
    const permissionModules = [
        { key: 'personal', name: 'Personal' },
        { key: 'maquinarias', name: 'Maquinarias' },
        { key: 'mantenimientos', name: 'Mantenimientos' },
        { key: 'horometros', name: 'Horómetros' },
        { key: 'programacion', name: 'Programación' },
        { key: 'movimientos_maq', name: 'Mov. Maquinarias' },
        { key: 'movimientos_piezas', name: 'Mov. Piezas' },
        { key: 'estados_maq', name: 'Estados Máquinas' },
        { key: 'piezas_standby', name: 'Piezas Standby' },
        { key: 'comidas_notas', name: 'Comidas/Notas' }
    ];
    
    const permissionsHTML = permissionModules.map((module, index) => {
        const currentValue = userData ? userData[5 + index] : 'ninguno';
        return `
            <div class="permission-group">
                <label>${module.name}</label>
                <select name="perm_${module.key}" class="form-input">
                    <option value="ninguno" ${currentValue === 'ninguno' ? 'selected' : ''}>Sin acceso</option>
                    <option value="lectura" ${currentValue === 'lectura' ? 'selected' : ''}>Solo lectura</option>
                    <option value="completo" ${currentValue === 'completo' ? 'selected' : ''}>Acceso completo</option>
                </select>
            </div>
        `;
    }).join('');
    
    return `
        <div class="user-form">
            <div class="form-group">
                <label>Usuario *</label>
                <input type="text" name="usuario" class="form-input" value="${userData ? userData[0] : ''}" ${isEdit ? 'readonly' : ''} required>
            </div>
            
            <div class="form-group">
                <label>Contraseña *</label>
                <input type="password" name="contraseña" class="form-input" value="${userData ? userData[1] : ''}" required>
            </div>
            
            <div class="form-group">
                <label>Nombre Completo *</label>
                <input type="text" name="nombre_completo" class="form-input" value="${userData ? userData[2] : ''}" required>
            </div>
            
            <div class="form-group">
                <label>Permisos Generales</label>
                <select name="permisos_generales" class="form-input">
                    <option value="limitado" ${userData && userData[3] === 'limitado' ? 'selected' : ''}>Usuario Limitado</option>
                    <option value="completo" ${userData && userData[3] === 'completo' ? 'selected' : ''}>Administrador</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Estado</label>
                <select name="activo" class="form-input">
                    <option value="SI" ${!userData || userData[4] === 'SI' ? 'selected' : ''}>Activo</option>
                    <option value="NO" ${userData && userData[4] === 'NO' ? 'selected' : ''}>Inactivo</option>
                </select>
            </div>
            
            <div class="permissions-section">
                <h4>Permisos por Módulo</h4>
                <div class="permissions-grid">
                    ${permissionsHTML}
                </div>
            </div>
        </div>
    `;
}

async function saveUserRecord() {
    try {
        const form = document.querySelector('.user-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const userData = {};
        
        for (let [key, value] of formData.entries()) {
            userData[key] = value;
        }
        
        // Validar campos requeridos
        if (!userData.usuario || !userData.contraseña || !userData.nombre_completo) {
            showError('Por favor completa todos los campos requeridos');
            return;
        }
        
        showLoading(true);
        
        const response = await callGoogleScript('saveUser', userData);
        
        if (response && response.success) {
            showSuccess('Usuario guardado correctamente');
            closeUserModal();
            showUserManagement(); // Recargar lista
        } else {
            showError(response?.message || 'Error guardando usuario');
        }
        
    } catch (error) {
        console.error('❌ Error guardando usuario:', error);
        showError('Error guardando usuario');
    } finally {
        showLoading(false);
    }
}

async function deleteUser(usuario) {
    if (usuario === 'admin') {
        showError('No se puede eliminar el usuario administrador');
        return;
    }
    
    if (!confirm(`¿Estás seguro de eliminar el usuario "${usuario}"?`)) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await callGoogleScript('deleteUser', { usuario });
        
        if (response && response.success) {
            showSuccess('Usuario eliminado correctamente');
            showUserManagement(); // Recargar lista
        } else {
            showError(response?.message || 'Error eliminando usuario');
        }
        
    } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        showError('Error eliminando usuario');
    } finally {
        showLoading(false);
    }
}

// ===== FUNCIONES DE MODAL =====
function showModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    editingRecord = null;
    multipleRecords = { actividades: [], fallas: [], piezas: [] };
}

function showUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeMultipleModal() {
    // Para futuros modales múltiples
    closeModal();
    closeUserModal();
}

// ===== FUNCIONES DE NAVEGACIÓN =====
function backToDashboard() {
    currentModule = null;
    currentData = [];
    filteredData = [];
    currentPage = 1;
    
    document.getElementById('moduleView').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Recargar dashboard
    loadDashboard();
}

async function refreshModule() {
    if (currentModule) {
        await loadModule(currentModule);
        showSuccess('Módulo actualizado correctamente');
    }
}

// ===== FUNCIONES DE INICIALIZACIÓN ADICIONALES =====
document.addEventListener('DOMContentLoaded', function() {
    // Agregar event listeners para gestión de usuarios si existe el botón
    const userManagementButton = document.getElementById('userManagementButton');
    if (userManagementButton) {
        userManagementButton.addEventListener('click', showUserManagement);
    }
    
    // Agregar XLSX library para exportación Excel
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        document.head.appendChild(script);
    }
});

console.log('✅ Sistema de Maquinaria Pesada MEJORADO cargado completamente');
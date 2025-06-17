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

// ✅ NUEVAS VARIABLES PARA FILTROS POR COLUMNA
let columnFilters = {};
let showColumnFilters = false;

// ✅ NUEVAS VARIABLES PARA NOTAS PENDIENTES
let pendingNotesData = [];

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
    
    // ✅ NUEVO: Event listener para búsqueda en tiempo real
    document.addEventListener('input', function(e) {
        if (e.target.id === 'searchInput') {
            searchRecords();
        }
    });
    
    // ✅ NUEVO: Event listeners para filtros por columna
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('column-filter-input')) {
            applyColumnFilters();
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
    
    // ✅ CORRECCIÓN: Agregar formateo para NOTAS
    if (columnName === 'NOTAS') {
        return formatMultipleItemsDisplay(cellData);
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
            currentUser = response.data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showMainApp();
            await loadUserPermissions();
            await loadDashboard();
            
            showSuccess(`¡Bienvenido ${currentUser.nombre_completo || currentUser.usuario}!`);
        } else {
            showError(response?.message || 'Usuario o contraseña incorrectos');
        }
        
    } catch (error) {
        console.error('❌ Error durante login:', error);
        showError('Error de conexión durante el login');
    } finally {
        showLoading(false);
    }
}

async function loadUserPermissions() {
    try {
        if (currentUser?.permisos?.generales === 'completo') {
            console.log('👑 Usuario administrador - acceso completo');
            userPermissions = {
                personal: 'completo',
                maquinarias: 'completo',
                mantenimientos: 'completo',
                horometros: 'completo',
                programacion: 'completo',
                movimientos_maq: 'completo',
                movimientos_piezas: 'completo',
                estados_maq: 'completo',
                piezas_standby: 'completo',
                comidas_notas: 'completo'
            };
            
            // Mostrar/ocultar botón de gestión de usuarios
            const userManagementButton = document.getElementById('userManagementButton');
            if (userManagementButton) {
                userManagementButton.style.display = currentUser.permisos?.generales === 'completo' ? 'inline-flex' : 'none';
            }
        }
    } catch (error) {
        console.error('❌ Error cargando permisos:', error);
    }
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
    columnFilters = {};
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
        await loadPendingNotes(); // ✅ NUEVA FUNCIÓN
        loadModulesGrid();
        
        showSuccess('Dashboard cargado correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        showError('Error cargando dashboard: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ✅ NUEVA FUNCIÓN PARA CARGAR NOTAS PENDIENTES EN EL DASHBOARD
async function loadPendingNotes() {
    try {
        console.log('📝 Cargando notas pendientes...');
        
        const response = await callGoogleScript('getData', { sheet: 'Notas' });
        
        if (response && response.success) {
            const notesData = response.data || [];
            displayPendingNotesInDashboard(notesData);
        }
    } catch (error) {
        console.error('❌ Error cargando notas pendientes:', error);
    }
}

// ✅ NUEVA FUNCIÓN PARA MOSTRAR NOTAS PENDIENTES EN EL DASHBOARD
function displayPendingNotesInDashboard(notesData) {
    const notesSection = document.querySelector('.notes-section');
    if (!notesSection) return;
    
    const notesContainer = document.getElementById('notesContainer');
    if (!notesContainer) return;
    
    if (notesData.length <= 1) {
        notesContainer.innerHTML = '<div class="no-notes">📝 No hay notas pendientes</div>';
        return;
    }
    
    const headers = notesData[0];
    const notes = notesData.slice(1);
    const pendingNotes = notes.filter(note => note[5] === 'PENDIENTE'); // Columna ESTADO
    
    if (pendingNotes.length === 0) {
        notesContainer.innerHTML = '<div class="no-notes">✅ No hay notas pendientes</div>';
        return;
    }
    
    // ✅ AGREGAR CONTADOR DE NOTAS PENDIENTES
    const notesHeader = document.querySelector('.notes-header h3');
    if (notesHeader) {
        notesHeader.innerHTML = `
            <i class="fas fa-sticky-note"></i> Notas y Recordatorios
            <span class="pending-count">${pendingNotes.length}</span>
        `;
    }
    
    const notesHTML = pendingNotes.slice(0, 5).map((note, index) => {
        const personal = note[0] || 'Sin asignar';
        const noteText = note[1] || 'Sin descripción';
        const fechaRecordatorio = note[3] ? formatDate(note[3], false, true) : 'Sin fecha';
        const prioridad = note[4] || 'MEDIA';
        
        return `
            <div class="note-item-with-checkbox">
                <input type="checkbox" class="status-checkbox" 
                       onchange="toggleNoteStatus(this, ${index})" 
                       data-note-index="${index}">
                <div class="item-content">
                    <div class="note-text">${noteText}</div>
                    <div class="note-info">
                        <span class="note-personal">${personal}</span>
                        <span>${fechaRecordatorio}</span>
                        <span class="note-priority priority-${prioridad.toLowerCase()}">${prioridad}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    notesContainer.innerHTML = notesHTML;
    
    // Guardar datos de notas para poder actualizarlas
    pendingNotesData = pendingNotes;
}

// ✅ NUEVA FUNCIÓN PARA CAMBIAR ESTADO DE NOTA
async function toggleNoteStatus(checkbox, noteIndex) {
    try {
        if (!pendingNotesData[noteIndex]) return;
        
        const note = pendingNotesData[noteIndex];
        
        if (checkbox.checked) {
            // Marcar como REALIZADO
            note[5] = 'REALIZADO'; // Columna ESTADO
            
            // Agregar clase de completado
            const itemContent = checkbox.nextElementSibling;
            if (itemContent) {
                itemContent.parentElement.classList.add('completed-item');
            }
            
            showSuccess('Nota marcada como realizada');
            
            // Actualizar en Google Sheets
            await updateNoteStatusInSheets(note);
            
            // Recargar notas después de un delay para mostrar el cambio
            setTimeout(() => {
                loadPendingNotes();
            }, 1500);
        }
        
    } catch (error) {
        console.error('❌ Error actualizando estado de nota:', error);
        showError('Error actualizando estado de nota');
        checkbox.checked = false; // Revertir checkbox
    }
}

// ✅ NUEVA FUNCIÓN PARA ACTUALIZAR NOTA EN SHEETS
async function updateNoteStatusInSheets(note) {
    try {
        // Obtener todos los datos de notas
        const response = await callGoogleScript('getData', { sheet: 'Notas' });
        
        if (response && response.success) {
            const notesData = response.data || [];
            
            // Encontrar y actualizar la nota específica
            for (let i = 1; i < notesData.length; i++) {
                if (notesData[i][0] === note[0] && notesData[i][1] === note[1]) {
                    notesData[i] = note;
                    break;
                }
            }
            
            // Guardar datos actualizados
            await callGoogleScript('saveData', {
                sheet: 'Notas',
                data: notesData
            });
        }
    } catch (error) {
        console.error('❌ Error guardando nota actualizada:', error);
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
                        position: 'bottom'
                    }
                }
            }
        });
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
                labels: data.meses || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Mantenimientos',
                    data: data.mantenimientos_por_mes || [0, 0, 0, 0, 0, 0],
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Error creando gráfico de mantenimientos:', error);
    }
}

async function loadAlertsMantenimiento() {
    try {
        console.log('⚠️ Cargando alertas de mantenimiento...');
        
        const response = await callGoogleScript('getMaintenanceAlerts');
        
        if (response && response.success) {
            const alertsData = response.data || [];
            displayMaintenanceAlerts(alertsData);
        }
    } catch (error) {
        console.error('❌ Error cargando alertas:', error);
    }
}

function displayMaintenanceAlerts(alertsData) {
    const alertsContainer = document.getElementById('alertasContainer');
    if (!alertsContainer) return;
    
    if (!alertsData || alertsData.length === 0) {
        alertsContainer.innerHTML = '<div class="no-alerts">✅ No hay alertas de mantenimiento pendientes</div>';
        return;
    }
    
    const alertsHTML = alertsData.map((alerta, index) => {
        const isVencido = alerta.estado === 'VENCIDO';
        const isProximo = alerta.estado === 'PROXIMO';
        
        return `
            <div class="alert-item ${isVencido ? 'alert-vencido' : 'alert-proximo'}">
                <input type="checkbox" class="status-checkbox" 
                       onchange="toggleMaintenanceStatus(this, ${index})" 
                       data-alert-index="${index}">
                <div class="alert-content">
                    <div class="alert-machine">${alerta.maquinaria}</div>
                    <div class="alert-detail">${alerta.trabajos}</div>
                    <div class="alert-date">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(alerta.fecha_esperada, false, true)}
                    </div>
                </div>
                <div class="alert-badge">
                    ${isVencido ? '🔴' : '🟡'}
                </div>
            </div>
        `;
    }).join('');
    
    alertsContainer.innerHTML = alertsHTML;
}

// ✅ NUEVA FUNCIÓN PARA CAMBIAR ESTADO DE MANTENIMIENTO
async function toggleMaintenanceStatus(checkbox, alertIndex) {
    try {
        if (checkbox.checked) {
            // Marcar como realizado
            const itemContent = checkbox.nextElementSibling;
            if (itemContent) {
                itemContent.parentElement.classList.add('completed-item');
            }
            
            showSuccess('Mantenimiento marcado como realizado');
            
            // Aquí podrías actualizar el estado en Google Sheets
            // await updateMaintenanceStatusInSheets(alertsData[alertIndex]);
        }
        
    } catch (error) {
        console.error('❌ Error actualizando estado de mantenimiento:', error);
        showError('Error actualizando estado de mantenimiento');
        checkbox.checked = false;
    }
}

// ✅ NUEVA FUNCIÓN PARA ACTUALIZAR ESTADO DE MANTENIMIENTO
async function updateMaintenanceStatusInSheets(alerta) {
    try {
        // Llamar a la función del backend para actualizar el estado
        await callGoogleScript('updateMaintenanceStatus', {
            maquinaria: alerta.maquinaria,
            trabajos: alerta.trabajos
        });
    } catch (error) {
        console.error('❌ Error guardando estado de mantenimiento:', error);
    }
}

function loadModulesGrid() {
    try {
        console.log('🔧 Cargando grid de módulos...');
        
        const modulesGrid = document.getElementById('modulesGrid');
        if (!modulesGrid) return;
        
        const modules = Object.keys(CONFIG.MODULOS).map(key => {
            const module = CONFIG.MODULOS[key];
            
            // Verificar permisos
            if (!checkModulePermission(key)) {
                return null;
            }
            
            return `
                <div class="module-card" onclick="loadModule('${key}')">
                    <div class="module-icon">${module.emoji}</div>
                    <div class="module-content">
                        <h3>${module.nombre}</h3>
                        <p>${module.descripcion}</p>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');
        
        modulesGrid.innerHTML = modules || '<div class="no-alerts">❌ No tienes permisos para acceder a ningún módulo</div>';
        
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

function checkModuleWritePermission(moduleKey) {
    // Si es administrador, tiene acceso de escritura completo
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
    return permission === 'completo';
}

function showPermissionError() {
    showError('No tienes permisos para acceder a este módulo. Contacta al administrador.');
}

// ===== CARGA DE MÓDULO MEJORADA =====
async function loadModule(moduleName) {
    try {
        console.log('📂 Cargando módulo:', moduleName);
        
        if (!checkModulePermission(moduleName)) {
            showPermissionError();
            return;
        }
        
        showLoading(true);
        currentModule = moduleName;
        columnFilters = {}; // ✅ RESETEAR FILTROS DE COLUMNA
        
        // Cambiar vista
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('moduleView').style.display = 'block';
        
        // Actualizar título
        const moduleConfig = CONFIG.MODULOS[moduleName];
        const moduleTitle = document.getElementById('moduleTitle');
        if (moduleTitle && moduleConfig) {
            moduleTitle.textContent = `${moduleConfig.emoji} ${moduleConfig.nombre}`;
        }
        
        // Cargar datos del módulo
        const response = await callGoogleScript('getData', { sheet: moduleName });
        
        if (response && response.success) {
            currentData = response.data || [];
            filteredData = [...currentData];
            currentPage = 1;
            
            renderDataTable();
            updateRecordsCount();
            generateColumnFilters(); // ✅ GENERAR FILTROS POR COLUMNA
            
            // Mostrar/ocultar botones según permisos
            const hasWritePermission = checkModuleWritePermission(moduleName);
            const addButton = document.querySelector('.btn-success');
            if (addButton) {
                addButton.style.display = hasWritePermission ? 'inline-flex' : 'none';
            }
            
            console.log('✅ Módulo cargado:', moduleName);
        } else {
            throw new Error(response?.message || 'Error cargando datos del módulo');
        }
        
    } catch (error) {
        console.error('❌ Error cargando módulo:', error);
        showError('Error cargando módulo: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ✅ NUEVA FUNCIÓN PARA GENERAR FILTROS POR COLUMNA
function generateColumnFilters() {
    if (!currentData.length) return;
    
    const headers = currentData[0];
    const filtersContainer = document.getElementById('columnFiltersGrid');
    
    if (!filtersContainer) return;
    
    // Generar filtros por cada columna
    const filtersHTML = headers.map((header, index) => {
        // Obtener valores únicos para esta columna
        const uniqueValues = [...new Set(
            currentData.slice(1)
                .map(row => row[index])
                .filter(value => value && value.toString().trim())
        )].sort();
        
        const options = uniqueValues.map(value => 
            `<option value="${value}">${value}</option>`
        ).join('');
        
        return `
            <div class="column-filter">
                <label>${header.replace(/_/g, ' ')}</label>
                <select class="column-filter-input" data-column="${index}">
                    <option value="">Todos</option>
                    ${options}
                </select>
            </div>
        `;
    }).join('');
    
    filtersContainer.innerHTML = filtersHTML;
}

// ✅ NUEVA FUNCIÓN PARA MOSTRAR/OCULTAR FILTROS
function toggleColumnFilters() {
    const filtersContainer = document.getElementById('columnFiltersRow');
    const toggle = document.getElementById('columnFiltersToggle');
    
    if (!filtersContainer || !toggle) return;
    
    showColumnFilters = !showColumnFilters;
    filtersContainer.style.display = showColumnFilters ? 'block' : 'none';
    
    toggle.innerHTML = showColumnFilters 
        ? '<i class="fas fa-filter"></i> Ocultar'
        : '<i class="fas fa-filter"></i> Filtros';
}

// ✅ NUEVA FUNCIÓN PARA APLICAR FILTROS POR COLUMNA
function applyColumnFilters() {
    if (!currentData.length) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filterSelects = document.querySelectorAll('.column-filter-input');
    
    // Obtener filtros activos
    const activeFilters = {};
    filterSelects.forEach(select => {
        const column = select.getAttribute('data-column');
        const value = select.value;
        if (value) {
            activeFilters[column] = value;
        }
    });
    
    // Aplicar filtros
    const headers = currentData[0];
    const dataRows = currentData.slice(1);
    
    filteredData = [headers];
    
    dataRows.forEach(row => {
        let includeRow = true;
        
        // Aplicar búsqueda general
        if (searchTerm) {
            const rowText = row.join(' ').toLowerCase();
            if (!rowText.includes(searchTerm)) {
                includeRow = false;
            }
        }
        
        // Aplicar filtros por columna
        if (includeRow) {
            Object.keys(activeFilters).forEach(columnIndex => {
                const filterValue = activeFilters[columnIndex];
                const cellValue = row[columnIndex] || '';
                
                if (!cellValue.toString().includes(filterValue)) {
                    includeRow = false;
                }
            });
        }
        
        if (includeRow) {
            filteredData.push(row);
        }
    });
    
    currentPage = 1;
    renderDataTable();
    updateRecordsCount();
}

function clearAllColumnFilters() {
    const filterInputs = document.querySelectorAll('.column-filter-input');
    filterInputs.forEach(input => {
        input.value = '';
    });
    
    // Restaurar datos originales
    if (typeof currentData !== 'undefined' && typeof filteredData !== 'undefined') {
        filteredData = [...currentData];
        currentPage = 1;
        renderDataTable();
        updateRecordsCount();
    }
}

function goHome() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('moduleView').style.display = 'none';
    currentModule = null;
    currentData = [];
    filteredData = [];
    columnFilters = {};
}

// ===== RENDERIZADO DE TABLA MEJORADO =====
function renderDataTable() {
    const dataTableContainer = document.querySelector('.table-responsive');
    if (!dataTableContainer || !filteredData.length) return;
    
    const headers = filteredData[0];
    const data = filteredData.slice(1);
    
    // Calcular registros para la página actual
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = data.slice(startIndex, endIndex);
    
    const hasWritePermission = checkModuleWritePermission(currentModule);
    
    const tableHTML = `
        <table class="data-table" id="dataTable">
            <thead>
                <tr>
                    ${headers.map((header, index) => `
                        <th onclick="sortTable(${index})" style="cursor: pointer;">
                            ${header.replace(/_/g, ' ')}
                            <i class="fas fa-sort sort-icon ${currentSort.column === index ? (currentSort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : ''}"></i>
                        </th>
                    `).join('')}
                    <th style="width: 120px;">Acciones</th>
                </tr>
            </thead>
            <tbody id="tableBody">
                ${pageData.length === 0 ? 
                    `<tr><td colspan="${headers.length + 1}" style="text-align: center; padding: 40px; color: #666;">No hay registros para mostrar</td></tr>` :
                    pageData.map((row, index) => `
                        <tr>
                            ${row.map((cell, cellIndex) => `
                                <td>${formatCellData(cell, headers[cellIndex])}</td>
                            `).join('')}
                            <td>
                                <div class="action-buttons">
                                    <button onclick="showEditModal(${startIndex + index})" class="btn-action btn-edit" title="Editar" ${!hasWritePermission ? 'style="display:none"' : ''}>
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteRecord(${startIndex + index})" class="btn-action btn-delete" title="Eliminar" ${!hasWritePermission ? 'style="display:none"' : ''}>
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
            </tbody>
        </table>
    `;
    
    dataTableContainer.innerHTML = tableHTML;
    
    // Generar paginación
    generatePagination();
}

function generatePagination() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer || !filteredData.length) return;
    
    const totalRecords = filteredData.length - 1; // -1 para excluir headers
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Botón anterior
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})" class="btn btn-secondary">« Anterior</button>`;
    }
    
    // Números de página
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}">
                ${i}
            </button>
        `;
    }
    
    // Botón siguiente
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})" class="btn btn-secondary">Siguiente »</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    renderDataTable();
}

function changeRecordsPerPage() {
    const select = document.getElementById('recordsPerPageSelect');
    if (select) {
        recordsPerPage = parseInt(select.value);
        currentPage = 1;
        renderDataTable();
    }
}

function updateRecordsCount() {
    const recordsCount = document.getElementById('recordsCount');
    if (recordsCount && filteredData.length > 0) {
        const totalRecords = filteredData.length - 1; // -1 para excluir headers
        recordsCount.textContent = `${totalRecords} registro${totalRecords !== 1 ? 's' : ''}`;
    }
}

function sortTable(columnIndex) {
    if (!filteredData.length) return;
    
    const headers = filteredData[0];
    const data = filteredData.slice(1);
    
    // Cambiar dirección de ordenamiento
    if (currentSort.column === columnIndex) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = columnIndex;
        currentSort.direction = 'asc';
    }
    
    // Ordenar datos
    data.sort((a, b) => {
        const valueA = a[columnIndex] || '';
        const valueB = b[columnIndex] || '';
        
        // Intentar convertir a número para ordenamiento numérico
        const numA = parseFloat(valueA);
        const numB = parseFloat(valueB);
        
        if (!isNaN(numA) && !isNaN(numB)) {
            return currentSort.direction === 'asc' ? numA - numB : numB - numA;
        }
        
        // Ordenamiento de texto
        const textA = valueA.toString().toLowerCase();
        const textB = valueB.toString().toLowerCase();
        
        if (currentSort.direction === 'asc') {
            return textA.localeCompare(textB);
        } else {
            return textB.localeCompare(textA);
        }
    });
    
    filteredData = [headers, ...data];
    currentPage = 1;
    renderDataTable();
}

// ===== BÚSQUEDA Y FILTROS MEJORADOS =====
function searchRecords() {
    applyColumnFilters(); // ✅ USAR LA NUEVA FUNCIÓN QUE COMBINA BÚSQUEDA Y FILTROS
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    
    // Limpiar filtros de columna
    document.querySelectorAll('.column-filter-input').forEach(filter => {
        filter.value = '';
    });
    
    // Resetear datos
    filteredData = [...currentData];
    currentPage = 1;
    renderDataTable();
    updateRecordsCount();
}

// ===== FUNCIONES DE MODAL Y FORMULARIO =====
function showAddModal() {
    if (!checkModuleWritePermission(currentModule)) {
        showError('No tienes permisos para agregar registros en este módulo');
        return;
    }
    
    editingRecord = null;
    multipleRecords = { actividades: [], fallas: [], piezas: [] };
    generateModalForm();
    showModal();
}

function showEditModal(index) {
    if (!checkModuleWritePermission(currentModule)) {
        showError('No tienes permisos para editar registros en este módulo');
        return;
    }
    
    editingRecord = index;
    multipleRecords = { actividades: [], fallas: [], piezas: [] };
    
    const record = filteredData[index + 1]; // +1 para saltar headers
    if (record) {
        generateModalForm(record);
        showModal();
    }
}

function generateModalForm(record = null) {
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    
    if (!modalBody || !modalTitle || !currentData.length) return;
    
    const headers = currentData[0];
    const isEdit = record !== null;
    
    modalTitle.textContent = isEdit ? 'Editar Registro' : 'Agregar Nuevo Registro';
    
    let formHTML = '<div class="modal-form">';
    
    headers.forEach((header, index) => {
        const value = isEdit ? (record[index] || '') : '';
        const fieldHTML = generateFormField(header, index, value);
        if (fieldHTML) {
            formHTML += fieldHTML;
        }
    });
    
    formHTML += '</div>';
    modalBody.innerHTML = formHTML;
    
    // 🔧 CORRECCIÓN CRÍTICA: Simplificar inicialización de campos especiales
    setTimeout(() => {
        try {
            console.log('✅ Inicializando campos especiales...');
            
            // Solo agregar event listeners básicos sin funciones complejas
            document.querySelectorAll('.multiple-checkbox').forEach(checkbox => {
                if (!checkbox.hasEventListener) {
                    checkbox.addEventListener('change', function() {
                        handleMultipleCheckboxChange(this);
                    });
                    checkbox.hasEventListener = true;
                }
            });
            
            console.log('✅ Campos especiales inicializados correctamente');
            
            if (isEdit) {
                populateMultipleFields(record, headers);
            }
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            // No bloquear el modal, solo continuar
        }
    }, 50);
}

function generateFormField(header, index, value = '') {
    const fieldId = `field_${index}`;
    const displayValue = value || '';
    
    // Excluir TIPO_MANTENIMIENTO del formulario
    if (header.toUpperCase() === 'TIPO_MANTENIMIENTO') {
        return '';
    }
    
    // Verificar si es un campo múltiple
    const isMultipleField = CONFIG.MULTIPLE_FIELDS && CONFIG.MULTIPLE_FIELDS[header];
    
    if (isMultipleField) {
        return generateMultipleField(header, fieldId, displayValue);
    }
    
    // 🔧 CORRECCIÓN CRÍTICA: Verificar si tiene dropdown
    const hasDropdown = (CONFIG.DROPDOWN_CONFIG && CONFIG.DROPDOWN_CONFIG[currentModule] && CONFIG.DROPDOWN_CONFIG[currentModule][header]) ||
                       // ✅ CORREGIDO: Solo campos específicos de máquinas, NO permisos
                       (header.toUpperCase() === 'MAQUINARIA' || 
                        header.toUpperCase() === 'MAQUINA_ORIGEN' || 
                        header.toUpperCase() === 'MAQUINA_DESTINO');
    
    if (hasDropdown) {
        return generateDropdownField(header, fieldId, displayValue);
    }
    
    // Campo normal
    const inputType = getFieldInputType(header);
    
    return `
        <div class="form-group">
            <label for="${fieldId}">${header.replace(/_/g, ' ')}</label>
            <input 
                type="${inputType}" 
                id="${fieldId}" 
                name="${fieldId}"
                class="form-input" 
                value="${displayValue}"
                ${header.includes('OBSERVACIONES') ? 'placeholder="Ingrese observaciones..."' : ''}
            >
        </div>
    `;
}

function generateMultipleField(header, fieldId, value) {
    const config = CONFIG.MULTIPLE_FIELDS[header];
    
    if (config.type === 'checkbox_multiple') {
        return generateCheckboxMultipleField(header, fieldId, value);
    }
    
    if (config.type === 'activities_multiple') {
        return generateActivitiesField(header, fieldId, value);
    }
    
    if (config.type === 'items_multiple') {
        return generateItemsField(header, fieldId, value);
    }
    
    return '';
}

function generateCheckboxMultipleField(header, fieldId, value) {
    const config = CONFIG.MULTIPLE_FIELDS[header];
    const sourceData = dropdownData[config.source?.toLowerCase()] || [];
    
    const selectedValues = value ? (
        value.startsWith('[') ? JSON.parse(value) : [value]
    ) : [];
    
    const checkboxes = sourceData.map((item, index) => {
        const itemValue = typeof item === 'string' ? item : item[config.display_field];
        const isChecked = selectedValues.includes(itemValue);
        
        return `
            <label class="checkbox-item">
                <input 
                    type="checkbox" 
                    class="multiple-checkbox" 
                    data-field="${fieldId}" 
                    value="${itemValue}"
                    ${isChecked ? 'checked' : ''}
                >
                <span>${itemValue}</span>
            </label>
        `;
    }).join('');
    
    return `
        <div class="form-group">
            <label>${header.replace(/_/g, ' ')}</label>
            <div class="checkbox-group">
                ${checkboxes}
            </div>
            <div id="${fieldId}_selected" class="selected-display">
                <small>Seleccionados: ${selectedValues.length > 0 ? selectedValues.join(', ') : 'Ninguno'}</small>
            </div>
        </div>
    `;
}

function generateActivitiesField(header, fieldId, value) {
    const itemType = 'actividades';
    
    return `
        <div class="form-group">
            <label>${header.replace(/_/g, ' ')}</label>
            <div class="activities-container">
                <div class="activity-input-section">
                    <input 
                        type="text" 
                        id="${fieldId}_input" 
                        class="form-input activity-input" 
                        placeholder="Descripción del trabajo..."
                    >
                    <select id="${fieldId}_tipo" class="form-input activity-type">
                        <option value="PREVENTIVO">PREVENTIVO</option>
                        <option value="CORRECTIVO">CORRECTIVO</option>
                        <option value="PREDICTIVO">PREDICTIVO</option>
                    </select>
                    <button type="button" onclick="addActivity('${fieldId}')" class="btn-add-item">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
                <div class="activities-list" id="${fieldId}_list"></div>
            </div>
        </div>
    `;
}

function generateItemsField(header, fieldId, value) {
    const itemType = header.toUpperCase() === 'FALLAS' ? 'fallas' : 'piezas';
    const config = CONFIG.MULTIPLE_FIELDS[header];
    
    return `
        <div class="form-group">
            <label>${header.replace(/_/g, ' ')}</label>
            <div class="items-container">
                <div class="item-input-section">
                    <input 
                        type="text" 
                        id="${fieldId}_input" 
                        class="form-input item-input" 
                        placeholder="${config.placeholder || 'Ingrese item...'}"
                    >
                    <button type="button" onclick="addItem('${fieldId}', '${itemType}')" class="btn-add-item">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
                <div class="items-list" id="${fieldId}_list"></div>
            </div>
        </div>
    `;
}

function generateDropdownField(header, fieldId, value) {
    let options = [];
    
    // 🔧 CORRECCIÓN CRÍTICA: Separar campos de máquinas de campos de permisos
    if (header.toUpperCase() === 'MAQUINARIA' || header.toUpperCase() === 'MAQUINA_ORIGEN' || header.toUpperCase() === 'MAQUINA_DESTINO') {
        // ✅ SOLO estos campos usan datos de máquinas
        options = dropdownData.maquinarias || [];
    } else if (CONFIG.DROPDOWN_CONFIG && CONFIG.DROPDOWN_CONFIG[currentModule] && CONFIG.DROPDOWN_CONFIG[currentModule][header]) {
        // ✅ Todos los demás campos (incluyendo PERM_MAQUINARIAS) usan la configuración estática
        const config = CONFIG.DROPDOWN_CONFIG[currentModule][header];
        if (config.type === 'static') {
            options = config.options || [];
        } else if (config.type === 'dynamic') {
            const sourceData = dropdownData[config.source_module?.toLowerCase()] || [];
            options = sourceData.map(item => 
                typeof item === 'string' ? item : item[config.display_field] || item
            );
        }
    }
    
    const optionsHTML = options.map(option => {
        const optionValue = typeof option === 'string' ? option : option.toString();
        return `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${optionValue}</option>`;
    }).join('');
    
    return `
        <div class="form-group">
            <label for="${fieldId}">${header.replace(/_/g, ' ')}</label>
            <select id="${fieldId}" name="${fieldId}" class="form-input">
                <option value="">Seleccionar...</option>
                ${optionsHTML}
            </select>
        </div>
    `;
}

function getFieldInputType(header) {
    const upperHeader = header.toUpperCase();
    
    if (upperHeader.includes('FECHA')) return 'date';
    if (upperHeader.includes('HORA')) return 'time';
    if (upperHeader.includes('EMAIL')) return 'email';
    if (upperHeader.includes('TELEFONO') || upperHeader.includes('CELULAR')) return 'tel';
    if (upperHeader.includes('NUMERO') || upperHeader.includes('HOROMETRO') || upperHeader.includes('CANTIDAD')) return 'number';
    if (upperHeader.includes('OBSERVACIONES') || upperHeader.includes('DESCRIPCION') || upperHeader.includes('NOTAS')) return 'textarea';
    
    return 'text';
}

function populateMultipleFields(record, headers) {
    headers.forEach((header, index) => {
        const value = record[index] || '';
        
        if (header.toUpperCase() === 'PERSONAL_ASIGNADO' || (header.toUpperCase() === 'PERSONAL' && currentModule !== 'Personal')) {
            try {
                if (value && value.startsWith('[')) {
                    const personalArray = JSON.parse(value);
                    personalArray.forEach(personal => {
                        const checkbox = document.querySelector(`[data-field="field_${index}"][value="${personal}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                    handleMultipleCheckboxChange(document.querySelector(`[data-field="field_${index}"]`));
                }
            } catch (error) {
                console.error('Error procesando personal:', error);
            }
        }
        
        if (header.toUpperCase() === 'TRABAJO_REALIZADO' || header.toUpperCase() === 'TRABAJOS_A_REALIZAR') {
            try {
                if (value && value.startsWith('[')) {
                    const activitiesArray = JSON.parse(value);
                    const tiposArray = record[headers.findIndex(h => h.toUpperCase() === 'TIPO_MANTENIMIENTO')] || '[]';
                    const tipos = JSON.parse(tiposArray);
                    
                    multipleRecords.actividades = activitiesArray.map((actividad, i) => ({
                        actividad: actividad,
                        tipo: tipos[i] || 'PREVENTIVO'
                    }));
                    
                    const listContainer = document.getElementById('field_' + index + '_list');
                    if (listContainer) {
                        listContainer.innerHTML = renderActivitiesList();
                    }
                }
            } catch (error) {
                console.error('Error procesando actividades:', error);
            }
        }
        
        if (header.toUpperCase() === 'FALLAS') {
            try {
                if (value && value.startsWith('[')) {
                    multipleRecords.fallas = JSON.parse(value);
                    const listContainer = document.getElementById('field_' + index + '_list');
                    if (listContainer) {
                        listContainer.innerHTML = renderItemsList('fallas');
                    }
                }
            } catch (error) {
                console.error('Error procesando fallas:', error);
            }
        }
        
        if (header.toUpperCase() === 'PIEZAS_FALTANTES') {
            try {
                if (value && value.startsWith('[')) {
                    multipleRecords.piezas = JSON.parse(value);
                    const listContainer = document.getElementById('field_' + index + '_list');
                    if (listContainer) {
                        listContainer.innerHTML = renderItemsList('piezas');
                    }
                }
            } catch (error) {
                console.error('Error procesando piezas:', error);
            }
        }
        
        // ✅ AGREGAR SOPORTE PARA NOTAS MÚLTIPLES
        if (header.toUpperCase() === 'NOTAS') {
            try {
                if (value && value.startsWith('[')) {
                    multipleRecords.piezas = JSON.parse(value);
                    const listContainer = document.getElementById('field_' + index + '_list');
                    if (listContainer) {
                        listContainer.innerHTML = renderItemsList('piezas');
                    }
                }
            } catch (error) {
                console.error('Error procesando notas:', error);
            }
        }
    });
}

function handleMultipleCheckboxChange(checkbox) {
    if (!checkbox) return;
    
    const fieldId = checkbox.getAttribute('data-field');
    const selectedDisplay = document.getElementById(fieldId + '_selected');
    
    if (!selectedDisplay) return;
    
    const checkboxes = document.querySelectorAll(`[data-field="${fieldId}"]:checked`);
    const selectedValues = Array.from(checkboxes).map(cb => cb.value);
    
    selectedDisplay.innerHTML = `<small>Seleccionados: ${selectedValues.length > 0 ? selectedValues.join(', ') : 'Ninguno'}</small>`;
}

function addActivity(fieldId) {
    const input = document.getElementById(fieldId + '_input');
    const tipoSelect = document.getElementById(fieldId + '_tipo');
    const listContainer = document.getElementById(fieldId + '_list');
    
    if (!input || !tipoSelect || !listContainer) return;
    
    const actividad = input.value.trim();
    const tipo = tipoSelect.value;
    
    if (!actividad) {
        showError('Por favor ingresa una descripción del trabajo');
        return;
    }
    
    multipleRecords.actividades.push({ actividad, tipo });
    
    listContainer.innerHTML = renderActivitiesList();
    
    input.value = '';
    tipoSelect.value = 'PREVENTIVO';
}

function addItem(fieldId, itemType) {
    const input = document.getElementById(fieldId + '_input');
    const listContainer = document.getElementById(fieldId + '_list');
    
    if (!input || !listContainer) return;
    
    const item = input.value.trim();
    
    if (!item) {
        showError('Por favor ingresa un elemento');
        return;
    }
    
    multipleRecords[itemType].push(item);
    
    listContainer.innerHTML = renderItemsList(itemType);
    
    input.value = '';
}

function renderActivitiesList() {
    return multipleRecords.actividades.map((activity, index) => `
        <div class="activity-item">
            <span class="activity-text">${activity.actividad}</span>
            <span class="activity-type type-${activity.tipo.toLowerCase()}">${activity.tipo}</span>
            <button type="button" onclick="removeActivity(${index})" class="btn-remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function renderItemsList(itemType) {
    return multipleRecords[itemType].map((item, index) => `
        <div class="item">
            <span class="item-text">${item}</span>
            <button type="button" onclick="removeItem(${index}, '${itemType}')" class="btn-remove">
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

function removeItem(index, itemType) {
    multipleRecords[itemType].splice(index, 1);
    const listContainer = document.querySelector('.items-list');
    if (listContainer) {
        listContainer.innerHTML = renderItemsList(itemType);
    }
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
            
            if (header.toUpperCase() === 'TIPO_MANTENIMIENTO') {
                value = getMultipleActivitiesTypes();
                formData.push(value);
                return;
            }
            
            if (header.toUpperCase() === 'PERSONAL_ASIGNADO' || (header.toUpperCase() === 'PERSONAL' && currentModule !== 'Personal')) {
                value = getMultiplePersonalValue(fieldId);
            } else if (header.toUpperCase() === 'TRABAJO_REALIZADO' || header.toUpperCase() === 'TRABAJOS_A_REALIZAR') {
                value = getMultipleActivitiesValue();
            } else if (header.toUpperCase() === 'FALLAS') {
                value = JSON.stringify(multipleRecords.fallas);
            } else if (header.toUpperCase() === 'PIEZAS_FALTANTES') {
                value = JSON.stringify(multipleRecords.piezas);
            } else if (header.toUpperCase() === 'NOTAS') {
                // ✅ AGREGAR SOPORTE PARA GUARDAR NOTAS MÚLTIPLES
                value = JSON.stringify(multipleRecords.piezas);
            } else {
                const field = document.getElementById(fieldId);
                value = field ? field.value : '';
            }
            
            formData.push(value);
        });
        
        // Actualizar datos locales
        if (editingRecord !== null) {
            const actualIndex = editingRecord + 1;
            if (actualIndex < currentData.length) {
                currentData[actualIndex] = formData;
                filteredData[actualIndex] = formData;
            }
        } else {
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
    return JSON.stringify(multipleRecords.actividades.map(activity => activity.actividad));
}

function getMultipleActivitiesTypes() {
    return JSON.stringify(multipleRecords.actividades.map(activity => activity.tipo));
}

async function updateLinkedModules(formData, headers) {
    try {
        if (currentModule === 'Personal' || currentModule === 'Maquinarias') {
            await loadDropdownData();
        }
    } catch (error) {
        console.error('❌ Error actualizando módulos vinculados:', error);
    }
}

async function deleteRecord(index) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const actualIndex = index + 1; // +1 para saltar headers
        
        if (actualIndex < currentData.length) {
            currentData.splice(actualIndex, 1);
            filteredData.splice(actualIndex, 1);
            
            await guardarEnSheets();
            
            renderDataTable();
            updateRecordsCount();
            
            showSuccess('Registro eliminado correctamente');
        }
        
    } catch (error) {
        console.error('❌ Error eliminando registro:', error);
        showError('Error eliminando registro: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('editModal');
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

function showMultipleModal() {
    const modal = document.getElementById('multipleModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeMultipleModal() {
    const modal = document.getElementById('multipleModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== FUNCIONES DE GUARDADO EN GOOGLE SHEETS =====
async function guardarEnSheets() {
    try {
        if (!currentModule || !currentData.length) {
            showError('No hay datos para guardar');
            return;
        }
        
        console.log('💾 Guardando en Google Sheets:', currentModule);
        showLoading(true); // ✅ MOSTRAR LOADING
        
        const response = await callGoogleScript('saveData', {
            sheet: currentModule,
            data: currentData
        });
        
        if (response && response.success) {
            console.log('✅ Datos guardados correctamente');
            
            // ✅ MOSTRAR MENSAJE DE ÉXITO
            showSuccess('¡Datos guardados correctamente en Google Sheets!');
            
            if (['Maquinarias', 'Personal'].includes(currentModule)) {
                await loadDropdownData();
            }
            
            return true;
        } else {
            throw new Error(response?.message || 'Error guardando en Google Sheets');
        }
        
    } catch (error) {
        console.error('❌ Error guardando en Sheets:', error);
        showError('Error guardando datos: ' + error.message); // ✅ MOSTRAR ERROR SI FALLA
        throw error;
    } finally {
        showLoading(false); // ✅ OCULTAR LOADING AL FINAL
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
        
        const wb = XLSX.utils.book_new();
        
        const excelData = filteredData.map(row => 
            row.map(cell => {
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
        
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        XLSX.utils.book_append_sheet(wb, ws, currentModule);
        XLSX.writeFile(wb, `${currentModule}_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showSuccess('Archivo Excel exportado correctamente');
        
    } catch (error) {
        console.error('❌ Error exportando Excel:', error);
        showError('Error exportando Excel: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ===== GESTIÓN DE USUARIOS =====
async function showUserManagement() {
    try {
        if (currentUser?.permisos?.generales !== 'completo') {
            showError('No tienes permisos para gestionar usuarios');
            return;
        }
        
        showLoading(true);
        
        const response = await callGoogleScript('getAllUsers');
        
        if (response && response.success) {
            const usersData = response.data || [];
            displayUsersManagement(usersData);
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

function displayUsersManagement(usersData) {
    const userModalTitle = document.getElementById('userModalTitle');
    const userModalBody = document.getElementById('userModalBody');
    
    if (!userModalTitle || !userModalBody) return;
    
    userModalTitle.textContent = '👥 Gestión de Usuarios';
    
    if (usersData.length <= 1) {
        userModalBody.innerHTML = '<div class="no-users">No hay usuarios registrados</div>';
        showUserModal();
        return;
    }
    
    const headers = usersData[0];
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
    window.currentUsersData = usersData;
    showUserModal();
}

function showAddUserForm() {
    const userModalBody = document.getElementById('userModalBody');
    if (!userModalBody) return;
    
    userModalBody.innerHTML = generateUserForm();
    
    const userModalTitle = document.getElementById('userModalTitle');
    if (userModalTitle) {
        userModalTitle.textContent = '👤 Agregar Nuevo Usuario';
    }
}

function editUser(index) {
    const userModalBody = document.getElementById('userModalBody');
    if (!userModalBody || !window.currentUsersData) return;
    
    const userData = window.currentUsersData[index + 1];
    userModalBody.innerHTML = generateUserForm(userData);
    
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
            
            <div class="form-actions">
                <button type="button" onclick="saveUserRecord()" class="btn btn-primary">
                    <i class="fas fa-save"></i> Guardar Usuario
                </button>
                <button type="button" onclick="showUserManagement()" class="btn btn-secondary">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
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
        
        if (!userData.usuario || !userData.contraseña || !userData.nombre_completo) {
            showError('Por favor completa todos los campos requeridos');
            return;
        }
        
        showLoading(true);
        
        const response = await callGoogleScript('saveUser', userData);
        
        if (response && response.success) {
            showSuccess('Usuario guardado correctamente');
            closeUserModal();
            showUserManagement();
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
            showUserManagement();
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

// ===== FUNCIÓN PARA ACTUALIZAR NOTAS EN DASHBOARD =====
async function refreshNotes() {
    await loadPendingNotes();
    showSuccess('Notas actualizadas');
}

// ===== FUNCIONES PARA PREVENIR CLOSING CON ESCAPE SI ESTÁN EN MEDIO DE EDICIÓN =====
let isEditing = false;

document.addEventListener('beforeunload', function(e) {
    if (isEditing) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ===== FUNCIÓN PARA VOLVER AL DASHBOARD =====
function backToDashboard() {
    try {
        console.log('🏠 Volviendo al dashboard...');
        
        // Resetear variables del módulo
        currentModule = null;
        currentData = [];
        filteredData = [];
        currentPage = 1;
        columnFilters = {};
        
        // Cambiar vista
        document.getElementById('moduleView').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        // Recargar dashboard
        loadDashboard();
        
        console.log('✅ Vuelto al dashboard correctamente');
        
    } catch (error) {
        console.error('❌ Error volviendo al dashboard:', error);
        showError('Error volviendo al dashboard');
    }
}
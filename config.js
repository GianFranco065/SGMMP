// ===== CONFIGURACIÓN DEL SISTEMA MEJORADA =====
const CONFIG = {
    // 🔗 IMPORTANTE: Reemplaza con tu URL de Google Apps Script
    API_URL: 'https://script.google.com/macros/s/AKfycbz0FfTuT-aTpUnRp7yckFfOPUn8BfNO3bzNygIPCwulzMWafJoFBGtXNXWEWQfpBABLgA/exec',
    
    // Configuración de módulos del sistema con permisos granulares
    MODULOS: {
        'Personal': {
            nombre: 'Gestión de Personal',
            emoji: '👷',
            permisos: 'todos',
            descripcion: 'Gestión de empleados y personal',
            campos_multiples: ['ninguno'],
            vinculaciones: ['mantenimientos', 'Comidas', 'Notas']
        },
        'Maquinarias': {
            nombre: 'Gestión de Maquinarias',
            emoji: '🚜',
            permisos: 'todos',
            descripcion: 'Control de equipos y maquinaria',
            campos_multiples: ['ninguno'],
            vinculaciones: ['mantenimientos', 'Horometros', 'Programacion_Mantenimiento', 'Movimientos_Maquinarias', 'Estados_Maquinas']
        },
        'mantenimientos': {
            nombre: 'Registro de Mantenimientos',
            emoji: '🔧',
            permisos: 'todos',
            descripcion: 'Registro de trabajos de mantenimiento',
            campos_multiples: ['PERSONAL_ASIGNADO', 'TRABAJO_REALIZADO', 'TIPO_MANTENIMIENTO'],
            vinculaciones: ['Maquinarias', 'Personal']
        },
        'Horometros': {
            nombre: 'Control de Horómetros',
            emoji: '⏱️',
            permisos: 'todos',
            descripcion: 'Control de horas de trabajo',
            campos_multiples: ['ninguno'],
            vinculaciones: ['Maquinarias', 'Programacion_Mantenimiento']
        },
        'Programacion_Mantenimiento': {
            nombre: 'Programación de Mantenimiento',
            emoji: '📅',
            permisos: 'todos',
            descripcion: 'Planificación de mantenimientos',
            campos_multiples: ['TRABAJOS_A_REALIZAR', 'TIPO_MANTENIMIENTO'],
            vinculaciones: ['Maquinarias', 'Horometros']
        },
        'Movimientos_Maquinarias': {
            nombre: 'Movimientos de Maquinarias',
            emoji: '🗺️',
            permisos: 'todos',
            descripcion: 'Control de ubicaciones',
            campos_multiples: ['ninguno'],
            vinculaciones: ['Maquinarias']
        },
        'Movimientos_Piezas': {
            nombre: 'Movimientos de Piezas',
            emoji: '🔩',
            permisos: 'todos',
            descripcion: 'Control de repuestos y piezas',
            campos_multiples: ['ninguno'],
            vinculaciones: ['Maquinarias']
        },
        'Estados_Maquinas': {
            nombre: 'Estados de Máquinas',
            emoji: '⚡',
            permisos: 'todos',
            descripcion: 'Estado operativo de máquinas',
            campos_multiples: ['FALLAS', 'PIEZAS_FALTANTES'],
            vinculaciones: ['Maquinarias']
        },
        'Piezas_Standby': {
            nombre: 'Piezas en Standby',
            emoji: '🔩',
            permisos: 'todos',
            descripcion: 'Inventario de repuestos',
            campos_multiples: ['ninguno'],
            vinculaciones: ['ninguno']
        },
        'Comidas': {
            nombre: 'Registro de Comidas',
            emoji: '🍽️',
            permisos: 'todos',
            descripcion: 'Control de alimentación',
            campos_multiples: ['PERSONAL'],
            vinculaciones: ['Personal']
        },
        'Notas': {
            nombre: 'Notas y Recordatorios',
            emoji: '📝',
            permisos: 'todos',
            descripcion: 'Notas y recordatorios',
            campos_multiples: ['PERSONAL', 'NOTAS'],
            vinculaciones: ['Personal']
        },
        'Usuarios': {
            nombre: 'Gestión de Usuarios',
            emoji: '👥',
            permisos: 'admin_only',
            descripcion: 'Administración de usuarios y permisos',
            campos_multiples: ['ninguno'],
            vinculaciones: ['ninguno']
        }
    },
    
    // NUEVA: Configuración de listas desplegables
    DROPDOWN_CONFIG: {
        // 1. GESTIÓN DE PERSONAL
        'Personal': {
            'ESTADO': {
                type: 'static',
                options: ['ACTIVO', 'INACTIVO']
            }
        },
        
        // 2. GESTIÓN DE MAQUINARIAS ✅ AGREGADO
        'Maquinarias': {
            'ESTADO': {
                type: 'static',
                options: ['OPERATIVO', 'INOPERATIVO', 'STANDBY']
            }
        },
        
        // 3. PROGRAMACIÓN DE MANTENIMIENTO
        'Programacion_Mantenimiento': {
            'ESTADO': {
                type: 'static',
                options: ['REALIZADO', 'PROXIMO', 'PROGRAMADO']
            }
        },
        
        // 4. MOVIMIENTOS DE PIEZAS
        'Movimientos_Piezas': {
            'MAQUINA_ORIGEN': {
                type: 'dynamic',
                source_module: 'Maquinarias',
                source_field: 'NOMBRE',
                display_field: 'NOMBRE'
            },
            'MAQUINA_DESTINO': {
                type: 'dynamic',
                source_module: 'Maquinarias',
                source_field: 'NOMBRE',
                display_field: 'NOMBRE'
            },
            'ESTADO': {
                type: 'static',
                options: ['USADO', 'NUEVO', 'REPARADO']
            }
        },
        
        // 5. ESTADOS DE MÁQUINAS
        'Estados_Maquinas': {
            'ESTADO': {
                type: 'static',
                options: ['OPERATIVO', 'INOPERATIVO', 'STANDBY']
            }
        },
        
        // 6. PIEZAS EN STANDBY
        'Piezas_Standby': {
            'ESTADO': {
                type: 'static',
                options: ['OPERATIVO', 'INOPERATIVO']
            }
        },
        
        // 7. NOTAS Y RECORDATORIOS
        'Notas': {
            'PRIORIDAD': {
                type: 'static',
                options: ['BAJA', 'MEDIA', 'ALTA']
            },
            'ESTADO': {
                type: 'static',
                options: ['PENDIENTE', 'REALIZADO']
            }
        },
        
        // 8. GESTIÓN DE USUARIOS
        'Usuarios': {
            'ACTIVO': {
                type: 'static',
                options: ['SI', 'NO']
            },
            'PERMISOS_GENERALES': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_PERSONAL': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_MAQUINARIAS': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_MANTENIMIENTOS': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_HOROMETROS': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_PROGRAMACION': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_MOVIMIENTOS_MAQ': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_MOVIMIENTOS_PIEZAS': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_ESTADOS_MAQ': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_PIEZAS_STANDBY': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            },
            'PERM_COMIDAS_NOTAS': {
                type: 'static',
                options: ['ninguno', 'lectura', 'completo']
            }
        }
    },
    
    // Configuración de la aplicación
    APP: {
        nombre: 'Sistema de Gestión de Maquinaria Pesada',
        version: '2.0.0 MEJORADO',
        desarrollador: 'Tu Empresa',
        descripcion: 'Sistema completo con gestión de usuarios, registros múltiples y vinculación automática'
    },
    
    // Configuración de paginación
    PAGINATION: {
        recordsPerPage: 25,
        maxPageButtons: 5
    },
    
    // NUEVA: Configuración de permisos
    PERMISSIONS: {
        levels: {
            'ninguno': {
                name: 'Sin Acceso',
                color: '#95a5a6',
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            'lectura': {
                name: 'Solo Lectura',
                color: '#3498db',
                canRead: true,
                canWrite: false,
                canDelete: false
            },
            'completo': {
                name: 'Acceso Completo',
                color: '#27ae60',
                canRead: true,
                canWrite: true,
                canDelete: true
            }
        }
    },
    
    // NUEVA: Configuración de campos múltiples
    MULTIPLE_FIELDS: {
        'PERSONAL_ASIGNADO': {
            type: 'checkbox_multiple',
            source: 'Personal',
            display_field: 'nombre_completo'
        },
        'PERSONAL': {
            type: 'checkbox_multiple',
            source: 'Personal',
            display_field: 'nombre_completo'
        },
        'TRABAJO_REALIZADO': {
            type: 'activities_multiple',
            related_field: 'TIPO_MANTENIMIENTO'
        },
        'TRABAJOS_A_REALIZAR': {
            type: 'activities_multiple',
            related_field: 'TIPO_MANTENIMIENTO'
        },
        'FALLAS': {
            type: 'items_multiple',
            placeholder: 'Descripción de la falla...'
        },
        'PIEZAS_FALTANTES': {
            type: 'items_multiple',
            placeholder: 'Pieza o repuesto faltante...'
        },
        'NOTAS': {
            type: 'items_multiple',
            placeholder: 'Nota o recordatorio...'
        }
    },
    
    // NUEVA: Configuración de vinculaciones automáticas
    AUTO_LINKS: {
        'Horometros': {
            'HOROMETRO_FINAL': {
                target_module: 'Maquinarias',
                target_field: 'HOROMETRO_ACTUAL',
                match_field: 'MAQUINARIA'
            }
        },
        'Movimientos_Maquinarias': {
            'NUEVA_UBICACION': {
                target_module: 'Maquinarias',
                target_field: 'UBICACION_ACTUAL',
                match_field: 'MAQUINARIA'
            }
        },
        'Estados_Maquinas': {
            'ESTADO': {
                target_module: 'Maquinarias',
                target_field: 'ESTADO',
                match_field: 'MAQUINARIA'
            }
        }
    },
    
    // NUEVA: Configuración de alertas
    ALERTS: {
        maintenance_threshold: 30, // Horas antes del mantenimiento para alertar
        update_interval: 300000, // 5 minutos en milisegundos
        urgency_levels: {
            'PENDIENTE': {
                color: '#95a5a6',
                icon: '⏳',
                priority: 1
            },
            'PROXIMO': {
                color: '#f39c12',
                icon: '⚠️',
                priority: 2
            },
            'URGENTE': {
                color: '#e74c3c',
                icon: '🚨',
                priority: 3
            },
            'REALIZADO': {
                color: '#27ae60',
                icon: '✅',
                priority: 0
            }
        }
    },
    
    // NUEVA: Configuración de exportación
    EXPORT: {
        formats: ['excel', 'csv'],
        include_filters: true,
        filename_format: '{module}_{date}',
        date_format: 'YYYY-MM-DD'
    }
};

// ===== HEADERS DE MÓDULOS MEJORADOS =====
const MODULE_HEADERS = {
    'Usuarios': [
        'USUARIO', 'CONTRASEÑA', 'NOMBRE_COMPLETO', 'PERMISOS_GENERALES', 'ACTIVO',
        'PERM_PERSONAL', 'PERM_MAQUINARIAS', 'PERM_MANTENIMIENTOS', 'PERM_HOROMETROS',
        'PERM_PROGRAMACION', 'PERM_MOVIMIENTOS_MAQ', 'PERM_MOVIMIENTOS_PIEZAS',
        'PERM_ESTADOS_MAQ', 'PERM_PIEZAS_STANDBY', 'PERM_COMIDAS_NOTAS'
    ],
    'Personal': [
        'NOMBRES', 'APELLIDOS', 'DNI', 'CARGO', 'TELEFONO', 'EMAIL', 
        'FECHA_INGRESO', 'ESTADO', 'OBSERVACIONES'
    ],
    'Maquinarias': [
        'NOMBRE', 'MARCA', 'MODELO', 'AÑO_FABRICACION', 'UBICACION_ACTUAL', 
        'ESTADO', 'HOROMETRO_ACTUAL', 'OBSERVACIONES'
    ],
    'mantenimientos': [
        'N_INFORME', 'MAQUINARIA', 'PERSONAL_ASIGNADO', 'TRABAJO_REALIZADO', 
        'OBSERVACIONES', 'FECHA', 'HORA_INICIO', 'HORA_TERMINO', 'HOROMETRO'
    ],
    'Horometros': [
        'MAQUINARIA', 'HOROMETRO_INICIAL', 'HOROMETRO_FINAL', 'FECHA', 
        'OPERADOR', 'UBICACION', 'OBSERVACIONES'
    ],
    'Programacion_Mantenimiento': [
        'MAQUINARIA', 'PROXIMO_HOROMETRO', 'TRABAJOS_A_REALIZAR', 
        'ESTADO', 'FECHA_ESPERADA', 'OBSERVACIONES'
    ],
    'Movimientos_Maquinarias': [
        'MAQUINARIA', 'UBICACION_ACTUAL', 'NUEVA_UBICACION', 'QUIEN_AUTORIZO', 
        'MOTIVO', 'FECHA', 'HORA', 'OBSERVACIONES'
    ],
    'Movimientos_Piezas': [
        'FECHA', 'HORA', 'TIPO_MOVIMIENTO', 'PIEZA_REPUESTO', 'MAQUINA_ORIGEN', 
        'MAQUINA_DESTINO', 'ESTADO', 'OBSERVACIONES'
    ],
    'Estados_Maquinas': [
        'MAQUINARIA', 'ESTADO', 'FECHA', 'FALLAS', 'PIEZAS_FALTANTES', 'OBSERVACIONES'
    ],
    'Piezas_Standby': [
        'PIEZA_REPUESTO', 'MARCA', 'MODELO', 'CANTIDAD', 'ESTADO', 'OBSERVACIONES'
    ],
    'Comidas': [
        'COMIDA', 'PERSONAL', 'FECHA', 'TIPO_COMIDA', 'CANTIDAD_PERSONAS', 'OBSERVACIONES'
    ],
    'Notas': [
        'PERSONAL', 'NOTAS', 'FECHA_CREACION', 'FECHA_RECORDATORIO', 'PRIORIDAD', 'ESTADO'
    ]
};

// ===== NUEVAS FUNCIONES DE UTILIDAD =====
const CONFIG_UTILS = {
    // Obtener configuración de módulo
    getModuleConfig: function(moduleName) {
        return CONFIG.MODULOS[moduleName] || {};
    },
    
    // Verificar si un campo es múltiple
    isMultipleField: function(fieldName) {
        return CONFIG.MULTIPLE_FIELDS.hasOwnProperty(fieldName.toUpperCase());
    },
    
    // Obtener configuración de campo múltiple
    getMultipleFieldConfig: function(fieldName) {
        return CONFIG.MULTIPLE_FIELDS[fieldName.toUpperCase()] || {};
    },
    
    // NUEVA: Verificar si un campo tiene dropdown
    hasDropdown: function(moduleName, fieldName) {
        const moduleDropdowns = CONFIG.DROPDOWN_CONFIG[moduleName];
        return moduleDropdowns && moduleDropdowns.hasOwnProperty(fieldName.toUpperCase());
    },
    
    // NUEVA: Obtener configuración de dropdown
    getDropdownConfig: function(moduleName, fieldName) {
        const moduleDropdowns = CONFIG.DROPDOWN_CONFIG[moduleName];
        return moduleDropdowns ? moduleDropdowns[fieldName.toUpperCase()] : null;
    },
    
    // Verificar vinculaciones automáticas
    hasAutoLink: function(sourceModule, fieldName) {
        const moduleLinks = CONFIG.AUTO_LINKS[sourceModule];
        return moduleLinks && moduleLinks.hasOwnProperty(fieldName.toUpperCase());
    },
    
    // Obtener configuración de vinculación
    getAutoLinkConfig: function(sourceModule, fieldName) {
        const moduleLinks = CONFIG.AUTO_LINKS[sourceModule];
        return moduleLinks ? moduleLinks[fieldName.toUpperCase()] : null;
    },
    
    // Obtener nivel de permiso
    getPermissionLevel: function(permission) {
        return CONFIG.PERMISSIONS.levels[permission] || CONFIG.PERMISSIONS.levels['ninguno'];
    },
    
    // Obtener configuración de alerta
    getAlertConfig: function(urgencyLevel) {
        return CONFIG.ALERTS.urgency_levels[urgencyLevel] || CONFIG.ALERTS.urgency_levels['PENDIENTE'];
    },
    
    // Validar configuración
    validateConfig: function() {
        const errors = [];
        
        // Verificar URL de API
        if (!CONFIG.API_URL || CONFIG.API_URL === 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
            errors.push('URL de Google Apps Script no configurada');
        }
        
        // Verificar módulos
        if (!CONFIG.MODULOS || Object.keys(CONFIG.MODULOS).length === 0) {
            errors.push('No hay módulos configurados');
        }
        
        // Verificar headers de módulos
        Object.keys(CONFIG.MODULOS).forEach(moduleName => {
            if (!MODULE_HEADERS[moduleName]) {
                errors.push(`Headers no encontrados para módulo: ${moduleName}`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

// Exportar configuración para uso global
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.MODULE_HEADERS = MODULE_HEADERS;
    window.CONFIG_UTILS = CONFIG_UTILS;
}
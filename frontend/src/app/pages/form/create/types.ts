export const types = [
    // 2. Campos Básicos
    {
        label: 'Alfanumérico',
        field_type: '1',
        icon: '',
        validate: {},
        group: 1,
        category_id: 2, category_name: 'Campos Básicos', category_bg: '#f5f9ff', category_border: '#3366ff', is_premium: false
    },
    {
        label: 'Fecha',
        field_type: '4',
        icon: '',
        group: 1,
        category_id: 2, category_name: 'Campos Básicos', category_bg: '#f5f9ff', category_border: '#3366ff', is_premium: false
    },
    {
        label: 'Hora',
        field_type: '19',
        icon: '',
        group: 1,
        category_id: 2, category_name: 'Campos Básicos', category_bg: '#f5f9ff', category_border: '#3366ff', is_premium: false
    },
    {
        label: 'Numérico',
        field_type: '2',
        icon: '',
        validate: {},
        group: 1,
        category_id: 2, category_name: 'Campos Básicos', category_bg: '#f5f9ff', category_border: '#3366ff', is_premium: false
    },
    {
        label: 'Solo letras',
        field_type: '5',
        icon: '',
        validate: {},
        group: 1,
        category_id: 2, category_name: 'Campos Básicos', category_bg: '#f5f9ff', category_border: '#3366ff', is_premium: false
    },
    {
        label: 'Texto',
        field_type: '6',
        icon: '',
        validate: {},
        group: 1,
        category_id: 2, category_name: 'Campos Básicos', category_bg: '#f5f9ff', category_border: '#3366ff', is_premium: false
    },
    // 3. Firmas y Archivos
    {
        label: 'Firma manuscrita',
        field_type: '7',
        icon: '',
        group: 3,
        category_id: 3, category_name: 'Firmas y Archivos', category_bg: '#f4fbf5', category_border: '#00d68f', is_premium: false
    },
    {
        label: 'Archivo',
        field_type: '8',
        icon: '',
        group: 1,
        category_id: 3, category_name: 'Firmas y Archivos', category_bg: '#f4fbf5', category_border: '#00d68f', is_premium: false
    },
    {
        label: 'Captura',
        field_type: '9',
        icon: '',
        group: 1,
        category_id: 3, category_name: 'Firmas y Archivos', category_bg: '#f4fbf5', category_border: '#00d68f', is_premium: false
    },
    {
        label: 'Firma biométrica facial',
        field_type: '10',
        icon: '',
        group: 3,
        category_id: 3, category_name: 'Firmas y Archivos', category_bg: '#f4fbf5', category_border: '#00d68f', is_premium: true
    },
    {
        label: 'Firma con cédula',
        field_type: '18',
        icon: '',
        group: 3,
        category_id: 3, category_name: 'Firmas y Archivos', category_bg: '#f4fbf5', category_border: '#00d68f', is_premium: true
    },
    {
        label: 'Firma electrónica OTP',
        field_type: '22',
        icon: '',
        group: 3,
        category_id: 3, category_name: 'Firmas y Archivos', category_bg: '#f4fbf5', category_border: '#00d68f', is_premium: true
    },
    // 4. Geolocalización
    {
        label: 'Dirección',
        field_type: '25',
        icon: '',
        group: 1,
        category_id: 4, category_name: 'Geolocalización', category_bg: '#fff6f0', category_border: '#ff8a3d', is_premium: false
    },
    {
        label: 'Ubicación',
        field_type: '15',
        icon: '',
        group: 1,
        category_id: 4, category_name: 'Geolocalización', category_bg: '#fff6f0', category_border: '#ff8a3d', is_premium: false
    },
    // 5. Estructurales
    {
        label: 'Número de documento',
        field_type: '11',
        icon: '',
        validate: {},
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: true
    },
    {
        label: 'NIT',
        field_type: '20',
        icon: '',
        values: {},
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: true
    },
    {
        label: 'Información',
        field_type: '14',
        icon: '',
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'Lista',
        field_type: '3',
        icon: '',
        values: [],
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'Llave y valores',
        field_type: '26',
        icon: '',
        values: [],
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'Moneda',
        field_type: '16',
        icon: '',
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'Múltiple',
        field_type: '13',
        icon: '',
        values: [],
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'Número de serie',
        field_type: '24',
        icon: '',
        values: [],
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'País',
        field_type: '23',
        icon: '',
        validate: {},
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'Tabla',
        field_type: '17',
        icon: '',
        fields: [],
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'Única',
        field_type: '12',
        icon: '',
        values: [],
        group: 2,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    },
    {
        label: 'Sección',
        field_type: '27',
        icon: '',
        group: 4,
        category_id: 5, category_name: 'Campos Estructurales', category_bg: '#fdf5f9', category_border: '#ff3d71', is_premium: false
    }
]

export const variables = {
  usual_fields: 'usual_fields',
  special_fields: 'special_fields',
  signature_fields: 'signature_fields',
  general_config_fields: 'general_config_fields'
}

import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Inicio',
    icon: 'home',
    link: '/pages/home',
    home: true,
    data: 71,
  },
  {
    title: 'Estadísticas',
    icon: 'grid',
    link: '/pages/dashboard',
    home: true,
    data: 62,
  },
  {
    title: 'GeoPortal',
    icon: 'map',
    link: '/pages/geoportal',
    home: true,
    data: 60,
  },
  {
    title: 'Recibidos',
    icon: 'archive',
    link: '/pages/inbox',
    data: 38,
  },
  {
    title: 'Mi Unidad',
    icon: 'file-text',
    link: '/pages/envelope',
    data: 68,
  },
  {
    title: 'Mi Unidad2',
    icon: 'file-text',
    link: '/pages/search',
    data: 68,
  },
  {
    title: 'Documentos',
    icon: 'browser',
    data: 14,
    children: [
      {
        title: 'Listar',
        link: '/pages/form/view',
        data: 14
      },
      {
        title: 'Creación individual',
        link: '/pages/form/create',
        data: 15
      },
      // {
      //   title: 'Creación en serie',
      //   link: '/pages/form/consecutive/create',
      //   data: 15
      // },
    ],
  },
  {
    title: 'Informes',
    icon: 'cloud-download',
    link: '',
    data: 59,
    children: [
      {
        title: 'Generar',
        link: '/pages/answer/report',
        data: 59
      },
      {
        title: 'Descargar ZIP',
        link: '/pages/answer/report/zip',
        data: 69
      },
    ],
  },
  {
    title: 'Servicio en Campo',
    icon: 'map',
    children:[
      {
        title: 'Puntos Fijos',
        link: '/pages/geoportal/point',
        data: 60,
      },
      {
        title: 'Enrutamiento',
        link: '/pages/route/view',
        data: 40,
      },
      {
        title: 'Monitoreo',
        link: '/pages/route/monitor',
        data: 40,
      },
      {
        title: 'Proyectos',
        link: '/pages/admin/project',
        data: 45,
      },
      {
        title: 'Puntos de inicio',
        link: '/pages/admin/location',
        data: 50,
      },
      {
        title: 'Visitas',
        link: '/pages/visits/programming/general',
        data: 63,
      }
    ]
  },
  /* {
    title: 'Visitas',
    icon: 'activity',
    data: 63,
    children: [
      {
        title: 'Proyectos',
        link: '/pages/visits/proyect',
        data: 63,
      },
      {
        title: 'Programación',
        link: '/pages/visits/programming/general',
      }
    ],
  }, */
  {
    title: 'Dispositivos',
    icon: 'monitor',
    children:[
      {
        title: 'Categorías Dispositivos',
        link: '/pages/admin/device-category',
        data: 19,
      },
      {
        title: 'Listar',
        link: '/pages/device',
        data: 24,
      },
      {
        title: 'Masivo',
        link: '/pages/massive/device',
        data: 25,
      },
    ]
  },
  {
    title: 'Control',
    icon: 'layers',
    children:[
      {
        title: 'Permisos',
        link: '/pages/admin/permit',
        data: 6,
      },
      {
        title: 'Roles',
        link: '/pages/admin/role',
        data: 9,
      },
      {
        title: 'Usuarios',
        data: 1,
        children:[
          {
            title: 'Listado',
            link: '/pages/user',
            data: 1,
          },
          {
            title: 'Masivo',
            link: '/pages/massive/user',
            data: 2,
          }
        ]
      },
      {
        title: 'Contactos',
        link: '/pages/contacts',
        data: 73,
      },
    ]
  },
  {
    title: 'Administración',
    group: true,
    data: -1,
  },
  {
    title: 'Empresas',
    icon: 'pantone-outline',
    data: -1,
    children: [
      {
        title: 'Listado',
        link: '/pages/enterprise',
      },
      {
        title: 'Limite de APIs',
        link: '/pages/enterprise/api',
      }
    ]
  },
  {
    title: 'Plataforma',
    icon: 'settings',
    link: '/pages/plataform',
    data: -1,
  },
  {
    title: 'Respuesta',
    icon: 'edit-2',
    link: '/pages/massive/form_answer',
    data: -1,
  },
  {
    title: 'Ajustes',
    icon: 'settings',
    data: 56,
    children: [
      {
        title: 'Parámetros',
        link: '/pages/admin/parameter',
      },
    ]
  },
  {
    title: 'Sistema',
    icon: 'file-text',
    data: -1,
    children:[
      {
        title: 'Logs',
        link: '/pages/system/logs'
      },
      {
        title: 'Planes',
        link: '/pages/plans'
      }
    ]
  },
  {
    title: 'Planes',
    icon: 'shopping-cart',
    link: '/pages/planUser',
    home: true,
    data: 72,
  },
  {
    title: 'SuperSet',
    icon: 'pie-chart',
    link: '/pages/superset',
    home: true,
    data: 78,
  },
  {
    title: 'APIS',
    icon: 'lock',
    link: '/pages/apis-config'
  },
];

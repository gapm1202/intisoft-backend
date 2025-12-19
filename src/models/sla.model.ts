// SLA Configuración interfaces
export interface SLAAlcance {
  slaActivo: boolean;
  aplicaA: string; // 'incidentes'
  tipoServicioCubierto: string; // 'incidente' | 'incidenteCritico'
  serviciosCubiertos: {
    soporteRemoto: boolean;
    soportePresencial: boolean;
    atencionEnSede: boolean;
  };
  activosCubiertos: {
    tipo: string; // 'todos' | 'porCategoria'
    categorias: string[];
    categoriasPersonalizadas: string[];
  };
  sedesCubiertas: {
    tipo: string; // 'todas' | 'seleccionadas'
    sedes: number[]; // IDs de sedes
  };
  observaciones?: string;
}

export interface SLAGestionIncidentes {
  tipos: {
    hardware: boolean;
    software: boolean;
    red: boolean;
    accesos: boolean;
    otros: boolean;
  };
  categoriaITIL?: string; // 'usuario' | 'infraestructura' | 'aplicacion' | 'seguridad'
  impacto: string; // 'alto' | 'medio' | 'bajo'
  urgencia: string; // 'alta' | 'media' | 'baja'
  prioridadCalculada: string; // 'Alta' | 'Media' | 'Baja'
}

export interface SLATiempoPrioridad {
  prioridad: string; // 'critica' | 'alta' | 'media' | 'baja'
  tiempoRespuesta: string;
  tiempoResolucion: string;
  modalidad: string; // 'remoto' | 'presencial' | 'mixto'
  escalamiento: boolean;
  tiempoEscalamiento?: string;
}

export interface SLATiempos {
  medicionSLA: string; // 'horasHabiles' | 'horasCalendario'
  tiemposPorPrioridad: SLATiempoPrioridad[];
}

export interface SLAHorarioDia {
  atiende: boolean;
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
}

export interface SLAHorarios {
  dias: {
    Lunes: SLAHorarioDia;
    Martes: SLAHorarioDia;
    Miercoles: SLAHorarioDia;
    Jueves: SLAHorarioDia;
    Viernes: SLAHorarioDia;
    Sabado: SLAHorarioDia;
    Domingo: SLAHorarioDia;
  };
  excluirFeriados: boolean;
  calendarioFeriados: string[];
  atencionFueraHorario?: boolean;
  aplicaSLAFueraHorario?: boolean;
}

export interface SLARequisitos {
  obligacionesCliente: {
    autorizarIntervencion: boolean;
    accesoEquipo: boolean;
    infoClara: boolean;
  };
  condicionesTecnicas: {
    equipoEncendido: boolean;
    conectividadActiva: boolean;
    accesoRemoto: boolean;
  };
  responsabilidadesProveedor: {
    tecnicoAsignado: boolean;
    registroAtencion: boolean;
    informeTecnico: boolean;
  };
}

export interface SLAExclusiones {
  flags: {
    pendienteRespuestaCliente: boolean;
    esperandoRepuestos: boolean;
    esperandoProveedorExterno: boolean;
    fueraDeAlcance: boolean;
    fuerzaMayor: boolean;
  };
}

export interface SLAAlertas {
  umbrales: number[];
  notificarA: {
    tecnicoAsignado: boolean;
    supervisor: boolean; // "Administrador" en UI
  };
  accionAutomatica: string; // 'notificar' | 'escalar'
  estadosVisibles: string[];
}

export interface SLAConfiguracion {
  id: number;
  empresaId: number;
  alcance: SLAAlcance;
  gestionIncidentes: SLAGestionIncidentes;
  tiempos: SLATiempos;
  horarios: SLAHorarios;
  requisitos: SLARequisitos;
  exclusiones: SLAExclusiones;
  alertas: SLAAlertas;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface HistorialSLA {
  id: number;
  empresaId: number;
  slaConfiguracionId: number;
  seccion: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  motivo?: string;
  usuario?: string;
  usuarioId?: number; // Cambiado de string a number para coincidir con usuarios.id
  createdAt: Date;
}

export interface HistorialSLAResponse {
  total: number;
  items: HistorialSLA[];
}

// Valores por defecto
export const DEFAULT_SLA_VALUES = {
  alcance: {
    slaActivo: false,
    aplicaA: 'incidentes',
    tipoServicioCubierto: 'incidente',
    serviciosCubiertos: {
      soporteRemoto: false,
      soportePresencial: false,
      atencionEnSede: false,
    },
    activosCubiertos: {
      tipo: 'todos',
      categorias: [],
      categoriasPersonalizadas: [],
    },
    sedesCubiertas: {
      tipo: 'todas',
      sedes: [],
    },
    observaciones: '',
  },
  gestionIncidentes: {
    tipos: {
      hardware: false,
      software: false,
      red: false,
      accesos: false,
      otros: false,
    },
    categoriaITIL: undefined,
    impacto: 'medio',
    urgencia: 'media',
    prioridadCalculada: 'Media',
  },
  tiempos: {
    medicionSLA: 'horasHabiles',
    tiemposPorPrioridad: [],
  },
  horarios: {
    dias: {
      Lunes: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
      Martes: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
      Miercoles: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
      Jueves: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
      Viernes: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
      Sabado: { atiende: false, horaInicio: '08:00', horaFin: '18:00' },
      Domingo: { atiende: false, horaInicio: '08:00', horaFin: '18:00' },
    },
    excluirFeriados: true,
    calendarioFeriados: ['1 de Enero - Año Nuevo'],
    atencionFueraHorario: false,
    aplicaSLAFueraHorario: false,
  },
  requisitos: {
    obligacionesCliente: {
      autorizarIntervencion: false,
      accesoEquipo: false,
      infoClara: false,
    },
    condicionesTecnicas: {
      equipoEncendido: false,
      conectividadActiva: false,
      accesoRemoto: false,
    },
    responsabilidadesProveedor: {
      tecnicoAsignado: false,
      registroAtencion: false,
      informeTecnico: false,
    },
  },
  exclusiones: {
    flags: {
      pendienteRespuestaCliente: false,
      esperandoRepuestos: false,
      esperandoProveedorExterno: false,
      fueraDeAlcance: false,
      fuerzaMayor: false,
    },
  },
  alertas: {
    umbrales: [50, 75, 90],
    notificarA: {
      tecnicoAsignado: true,
      supervisor: true,
    },
    accionAutomatica: 'notificar',
    estadosVisibles: ['🟢 Cumpliendo', '🟡 En riesgo', '🔴 Incumplido'],
  },
};

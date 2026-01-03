import tiposTicketRepository from '../repositories/tipos-ticket.repository';
import { TipoTicket, TipoTicketInput, TipoTicketUpdateInput } from '../models/tipos-ticket.model';

function httpError(status: number, message: string): Error {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

class TiposTicketService {
  async listAll(): Promise<TipoTicket[]> {
    return tiposTicketRepository.findAll();
  }

  async getById(id: string): Promise<TipoTicket> {
    const tipo = await tiposTicketRepository.findById(id);
    if (!tipo) {
      throw httpError(404, 'Tipo de ticket no encontrado');
    }
    return tipo;
  }

  async create(input: TipoTicketInput): Promise<TipoTicket> {
    if (!input.nombre || input.nombre.trim() === '') {
      throw httpError(400, 'El nombre es requerido');
    }

    const nombre = input.nombre.trim();

    // Verificar que no exista
    const existing = await tiposTicketRepository.findByNombre(nombre);
    if (existing) {
      throw httpError(400, 'Ya existe un tipo de ticket con ese nombre');
    }

    return tiposTicketRepository.create({
      nombre,
      descripcion: input.descripcion?.trim() || null,
      activo: input.activo ?? true,
    });
  }

  async update(id: string, input: TipoTicketUpdateInput): Promise<TipoTicket> {
    const existing = await tiposTicketRepository.findById(id);
    if (!existing) {
      throw httpError(404, 'Tipo de ticket no encontrado');
    }

    const payload: TipoTicketUpdateInput = {};

    if (input.nombre !== undefined) {
      if (input.nombre.trim() === '') {
        throw httpError(400, 'El nombre no puede estar vacío');
      }
      const nombre = input.nombre.trim();
      
      // Verificar unicidad solo si cambió el nombre
      if (nombre !== existing.nombre) {
        const duplicate = await tiposTicketRepository.findByNombre(nombre);
        if (duplicate) {
          throw httpError(400, 'Ya existe un tipo de ticket con ese nombre');
        }
      }
      payload.nombre = nombre;
    }

    if (input.descripcion !== undefined) {
      payload.descripcion = input.descripcion?.trim() || null;
    }

    if (input.activo !== undefined) {
      payload.activo = input.activo;
    }

    const updated = await tiposTicketRepository.update(id, payload);
    if (!updated) {
      throw httpError(500, 'No se pudo actualizar el tipo de ticket');
    }

    return updated;
  }

  async toggle(id: string): Promise<TipoTicket> {
    const existing = await tiposTicketRepository.findById(id);
    if (!existing) {
      throw httpError(404, 'Tipo de ticket no encontrado');
    }

    const toggled = await tiposTicketRepository.toggle(id);
    if (!toggled) {
      throw httpError(500, 'No se pudo cambiar el estado del tipo de ticket');
    }

    return toggled;
  }
}

export default new TiposTicketService();

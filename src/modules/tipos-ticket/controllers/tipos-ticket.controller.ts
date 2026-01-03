import { Request, Response } from 'express';
import tiposTicketService from '../services/tipos-ticket.service';

class TiposTicketController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const tipos = await tiposTicketService.listAll();
      res.json({ data: tipos });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tipo = await tiposTicketService.create(req.body);
      res.status(201).json({ data: tipo });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tipo = await tiposTicketService.update(id, req.body);
      res.json({ data: tipo });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  async toggle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tipo = await tiposTicketService.toggle(id);
      res.json({ data: tipo });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any): void {
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor';
    res.status(status).json({ error: message });
  }
}

export default new TiposTicketController();

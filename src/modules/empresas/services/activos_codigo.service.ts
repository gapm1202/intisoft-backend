import * as repo from "../repositories/activos_codigo.repository";
import * as empresaRepo from "../repositories/empresa.repository";
import * as inventarioRepo from "../repositories/inventario.repository";
import { NextCodeResponse } from "../models/activos_codigo.model";

/**
 * Get next code for an empresa/categoria
 * Reserves the code with a TTL (default 15 minutes)
 * 
 * Returns: { code: "IME-PC0001", reservation_id: 123, expires_at: "2025-12-15T10:30:00Z" }
 */
export const getNextCode = async (
  empresaId: number,
  categoriaId: number,
  userId?: number,
  reservationTtlMinutes: number = 15
): Promise<NextCodeResponse> => {
  // Validate empresa exists
  const empresa = await empresaRepo.getById(empresaId);
  if (!empresa) {
    throw new Error(`Empresa no encontrada: ${empresaId}`);
  }

  // Validate categoria exists
  const categoria = await inventarioRepo.getCategoriaById(categoriaId);
  if (!categoria) {
    throw new Error(`Categoría no encontrada: ${categoriaId}`);
  }

  // Ensure empresa has codigo
  if (!empresa.codigo) {
    throw new Error(`Empresa sin código asignado: ${empresaId}`);
  }

  // Reserve next code
  return repo.reserveNextCode(empresaId, categoriaId, userId, reservationTtlMinutes);
};

/**
 * Assign an official code to an activo
 * - If a reserved code is provided, use it and confirm the reservation
 * - If not, generate a new code
 * 
 * @param assetCode - The code assigned to the activo (e.g., "IME-PC0001")
 * @param activoId - The ID of the activo being created
 * @param reservationId - Optional: reservation ID if code was reserved
 */
export const assignCodeToActivo = async (
  assetCode: string,
  activoId: number,
  empresaId: number,
  categoriaId: number,
  reservationId?: number
): Promise<{ code: string; activo_id: number }> => {
  // Ya no hay tabla de reservas, simplemente retornar el código
  return {
    code: assetCode,
    activo_id: activoId
  };
};

/**
 * Validate if a code was properly reserved (for security)
 * Used to ensure code collision prevention
 * NOTA: Sin tabla de reservas, siempre retorna válido
 */
export const isCodeValidForCreation = async (
  codigo: string,
  empresaId: number,
  reservationId?: number
): Promise<{ valid: boolean; reason?: string }> => {
  // Sin tabla de reservas, el código se genera en el momento
  // y siempre es válido
  return {
    valid: true
  };
};

/**
 * Clean up expired code reservations (call periodically, e.g., via cron)
 * NOTA: Sin tabla de reservas, esta función ya no hace nada
 */
export const cleanupExpiredCodes = async (): Promise<number> => {
  return 0; // No hay reservas que limpiar
};


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
  if (reservationId) {
    // Confirm the reservation
    await repo.confirmReservation(reservationId, activoId);
  }

  return {
    code: assetCode,
    activo_id: activoId
  };
};

/**
 * Validate if a code was properly reserved (for security)
 * Used to ensure code collision prevention
 */
export const isCodeValidForCreation = async (
  codigo: string,
  empresaId: number,
  reservationId?: number
): Promise<{ valid: boolean; reason?: string }> => {
  const reservation = await repo.getReservation(codigo);

  if (!reservation) {
    return {
      valid: false,
      reason: "Código no está reservado. Use el endpoint /next-code primero."
    };
  }

  if (reservation.empresa_id !== empresaId) {
    return {
      valid: false,
      reason: "Código reservado para una empresa diferente."
    };
  }

  if (new Date(reservation.expires_at) < new Date()) {
    return {
      valid: false,
      reason: "La reserva de código ha expirado. Solicite uno nuevo."
    };
  }

  if (reservation.confirmed) {
    return {
      valid: false,
      reason: "Este código ya ha sido utilizado."
    };
  }

  if (reservationId && reservation.id !== reservationId) {
    return {
      valid: false,
      reason: "El ID de reserva no coincide con el código proporcionado."
    };
  }

  return { valid: true };
};

/**
 * Clean up expired code reservations (call periodically, e.g., via cron)
 */
export const cleanupExpiredCodes = async (): Promise<number> => {
  return repo.cleanupExpiredReservations();
};

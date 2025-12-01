import { createInventarioWithGeneratedAsset } from "../modules/empresas/repositories/inventario.repository";

(async () => {
  try {
    const inv: any = {
      empresaId: 1,
      sedeId: 1,
      categoria: 'PC',
      area: 'Ventas',
      fabricante: 'HP',
      modelo: 'ProDesk',
      serie: 'SERIE-TEST-123',
      estadoActivo: 'activo',
      estadoOperativo: 'operativo',
      fechaCompra: '2023-01-01',
      proveedor: 'Proveedor Test',
      ip: '192.168.0.10',
      mac: 'AA-BB-CC-11-22-33',
      usuariosAsignados: [],
      camposPersonalizados: {},
      camposPersonalizadosArray: [],
      observaciones: 'Prueba creación automatizada',
      purchaseDocumentUrl: null,
      warrantyDocumentUrl: null,
      purchaseDocumentDescription: null,
      warrantyDocumentDescription: null,
      garantia: '1 año',
      antiguedadAnios: 2,
      antiguedadMeses: 3,
      antiguedadText: '2 años y 3 meses',
      fotos: []
    };

    console.log('Invoking createInventarioWithGeneratedAsset...');
    const created = await createInventarioWithGeneratedAsset('PC', inv);
    console.log('Created:', created);
  } catch (err: any) {
    console.error('Test script error:', err && (err.stack || err));
    process.exit(1);
  }
})();

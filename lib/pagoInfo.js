// Datos reales de pago del colegio (póster oficial), centralizados para no
// repetirlos en cada modal. Todos los medios están a nombre de Daysi
// Reátegui Peláez; el voucher se sube desde el portal del padre.

export const YAPE = {
  numero: "942 608 498",
  titular: "Daysi Reátegui Peláez",
};

export const BANCOS = {
  bcp: {
    label: "BCP",
    cuenta: "560-71054174-0-36",
    titular: "Daysi Reátegui Peláez",
  },
  scotiabank: {
    label: "Scotiabank",
    cuenta: "0387901507",
    titular: "Daysi Reátegui Peláez",
  },
  nacion: {
    label: "Banco de la Nación",
    cuenta: "04498307367",
    titular: "Daysi Reátegui Peláez",
  },
};

// Nombre visible de cada método de pago (columna pagos.metodo).
export const METODOS_PAGO = {
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  deposito: "Depósito",
  efectivo: "Efectivo",
};

export type VenueStatus = "ACTIVE" | "INACTIVE";

export interface Venue {
  id: string;
  name: string;
  license: string;
  address: string;
  city: string;
  maxCapacity: number;
  /** Porcentaje de aforo operativo configurado (Stitch: min 50 max 98). */
  capacityPercent: number;
  /** Umbral RSSI en dBm para validación BLE (BPMN: tecnología de validación). */
  rssiThreshold: number;
  /** Segundos de rotación del QR dinámico. */
  qrRotationSeconds: number;
  validationTechnology: "BLE" | "QR" | "DUAL";
  status: VenueStatus;
  createdAt: string;
}

export interface CreateVenueInput {
  name: string;
  license: string;
  address: string;
  city: string;
  maxCapacity: number;
  capacityPercent: number;
  rssiThreshold: number;
  qrRotationSeconds: number;
  validationTechnology: Venue["validationTechnology"];
}

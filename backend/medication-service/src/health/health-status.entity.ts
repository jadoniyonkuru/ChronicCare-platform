export class HealthStatus {
  status: 'ok';
  service: string;
  /** Seconds since the service started. */
  uptimeSeconds: number;
  timestamp: string;
}

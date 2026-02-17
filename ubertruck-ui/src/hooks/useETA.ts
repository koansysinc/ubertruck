import { useMemo } from 'react';

const AVERAGE_SPEED = {
  EN_ROUTE_TO_PICKUP: 40, // km/h (city traffic)
  IN_TRANSIT: 50          // km/h (highway)
};

const FIXED_DURATIONS = {
  CARGO_LOADED: 10,      // minutes
  CARGO_UNLOADED: 15     // minutes
};

export function useETA(status: string, distance: number) {
  const eta = useMemo(() => {
    const normalizedStatus = status?.toUpperCase().replace(/\s+/g, '_');

    switch (normalizedStatus) {
      case 'EN_ROUTE_TO_PICKUP':
        return Math.ceil((distance / AVERAGE_SPEED.EN_ROUTE_TO_PICKUP) * 60);
      case 'IN_TRANSIT':
        return Math.ceil((distance / AVERAGE_SPEED.IN_TRANSIT) * 60);
      case 'ARRIVED_AT_PICKUP':
        return FIXED_DURATIONS.CARGO_LOADED;
      case 'ARRIVED_AT_DELIVERY':
        return FIXED_DURATIONS.CARGO_UNLOADED;
      default:
        return null;
    }
  }, [status, distance]);

  const formatETA = (minutes: number | null): string => {
    if (minutes === null) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return {
    etaMinutes: eta,
    etaFormatted: formatETA(eta)
  };
}
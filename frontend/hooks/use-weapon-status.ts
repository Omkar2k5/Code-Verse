import { useEffect, useState } from 'react';

interface WeaponStatus {
  cameraFeed: boolean;
  dataApi: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWeaponStatus() {
  const cameraHealthUrl = (process.env.NEXT_PUBLIC_WEAPON_CAMERA_HEALTH_URL || '').trim();
  const apiHealthUrl = (process.env.NEXT_PUBLIC_WEAPON_API_HEALTH_URL || '').trim();

  const [status, setStatus] = useState<WeaponStatus>({
    cameraFeed: false,
    dataApi: false,
    isLoading: true,
    error: null,
  });

  const check = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const cameraPromise = cameraHealthUrl
        ? fetch(cameraHealthUrl, { method: 'GET', signal: AbortSignal.timeout(3000) })
            .then(r => r.ok)
            .catch(() => false)
        : Promise.resolve(false);

      const apiPromise = apiHealthUrl
        ? fetch(apiHealthUrl, { method: 'GET', signal: AbortSignal.timeout(3000) })
            .then(r => r.ok)
            .catch(() => false)
        : Promise.resolve(false);

      const [cameraFeed, dataApi] = await Promise.all([cameraPromise, apiPromise]);
      setStatus({ cameraFeed, dataApi, isLoading: false, error: null });
    } catch (e) {
      setStatus({ cameraFeed: false, dataApi: false, isLoading: false, error: 'Health check failed' });
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [cameraHealthUrl, apiHealthUrl]);

  return {
    ...status,
    refresh: check,
    isBackendRunning: status.cameraFeed && status.dataApi,
  };
}
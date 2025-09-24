"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Home, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { useWeaponStatus } from "@/hooks/use-weapon-status";

export default function WeaponDashboardPage() {
  const iframeUrl = (process.env.NEXT_PUBLIC_WEAPON_DASHBOARD_URL || "").trim();
  const feed1 = (process.env.NEXT_PUBLIC_WEAPON_FEED_1 || "").trim();
  const feed2 = (process.env.NEXT_PUBLIC_WEAPON_FEED_2 || "").trim();
  const wsUrl = (process.env.NEXT_PUBLIC_WEAPON_WS_URL || "").trim();

  const { cameraFeed, dataApi, isLoading, isBackendRunning, refresh } = useWeaponStatus();

  // Basic detection stats from WebSocket messages
  const [detections, setDetections] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string);
        // Expecting a generic payload: { cameraId: string, label: string, score?: number }
        const key = msg?.label ?? "weapon";
        setDetections((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
      } catch {
        // ignore parse errors
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [wsUrl]);

  const totalDetections = useMemo(() => Object.values(detections).reduce((a, b) => a + b, 0), [detections]);

  // If an external dashboard URL is provided, embed it for fastest integration
  if (iframeUrl) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-purple-900/10 flex flex-col">
        <div className="flex items-center justify-between px-8 pt-6 pb-2">
          <div className="z-50 flex items-center space-x-3">
            <Link href="/">
              <button className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 p-3 rounded-full border border-gray-700/50 transition-all duration-300 hover:scale-110">
                <Home size={20} className="text-white" />
              </button>
            </Link>
          </div>
        </div>
        <div className="flex-1 px-6 pb-6">
          <iframe src={iframeUrl} className="w-full h-full rounded-xl border border-gray-700/50 bg-gray-900" />
        </div>
      </div>
    );
  }

  // Native placeholder UI using feeds and WS
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-purple-900/10 overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 pt-6 pb-2">
        <div className="z-50 flex items-center space-x-3">
          <Link href="/">
            <button className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 p-3 rounded-full border border-gray-700/50 transition-all duration-300 hover:scale-110">
              <Home size={20} className="text-white" />
            </button>
          </Link>
        </div>

        {/* Backend status */}
        <div className="flex items-center gap-3 text-sm">
          <div className={`w-2 h-2 rounded-full ${isBackendRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className={`${isBackendRunning ? 'text-green-400' : 'text-red-400'}`}>
            {isBackendRunning ? 'Connected' : 'Disconnected'}
          </span>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1 bg-gray-800/80 text-gray-200 rounded border border-gray-700/50 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Checking...' : 'Retry'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 px-6 pb-6 gap-6 min-h-0">
        {/* Left: two camera feeds */}
        <div className="w-1/3 flex flex-col min-h-0">
          {/* Feed 1 */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden relative group flex flex-col mb-2">
            <div className="aspect-video bg-black relative flex-1">
              {feed1 ? (
                // Try to use <img> for MJPEG, else <video> fallback via browser controls
                <img src={feed1} alt="Weapon Camera 1" className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Activity size={28} className="text-gray-500 mx-auto mb-2" />
                    <p className="text-sm">Set NEXT_PUBLIC_WEAPON_FEED_1</p>
                  </div>
                </div>
              )}
              {/* Status */}
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${cameraFeed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs bg-black/50 px-2 py-1 rounded ${cameraFeed ? 'text-green-400' : 'text-red-400'}`}>
                  {cameraFeed ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            <div className="p-2"><h3 className="text-white">Weapon Camera 1</h3></div>
          </div>

          {/* Feed 2 */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden relative group flex flex-col flex-1">
            <div className="aspect-video bg-black relative flex-1">
              {feed2 ? (
                <img src={feed2} alt="Weapon Camera 2" className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Activity size={28} className="text-gray-500 mx-auto mb-2" />
                    <p className="text-sm">Set NEXT_PUBLIC_WEAPON_FEED_2</p>
                  </div>
                </div>
              )}
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${cameraFeed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs bg-black/50 px-2 py-1 rounded ${cameraFeed ? 'text-green-400' : 'text-red-400'}`}>
                  {cameraFeed ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            <div className="p-2"><h3 className="text-white">Weapon Camera 2</h3></div>
          </div>
        </div>

        {/* Right: summary panel */}
        <div className="w-2/3 flex flex-col min-h-0">
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 flex-1 relative overflow-hidden p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-semibold">Real-time Weapon Detection</h2>
              {!isBackendRunning && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} /> Backend not running
                </div>
              )}
            </div>

            {/* Detections summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-3">
                <div className="text-gray-300 text-sm">Total events</div>
                <div className="text-2xl text-white font-bold">{totalDetections}</div>
              </div>
              {Object.entries(detections).map(([label, count]) => (
                <div key={label} className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-300 text-sm">{label}</div>
                  <div className="text-2xl text-white font-bold">{count}</div>
                </div>
              ))}
            </div>

            {!wsUrl && (
              <div className="mt-4 text-sm text-gray-400">
                Set NEXT_PUBLIC_WEAPON_WS_URL to enable real-time counts.
              </div>
            )}

            {!dataApi && (
              <div className="mt-4 text-sm text-gray-400">
                Data API health is failing. Configure NEXT_PUBLIC_WEAPON_API_HEALTH_URL.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Home, Route, Brain, Camera, Activity, AlertCircle, RefreshCw, Bell } from "lucide-react"
import Link from "next/link"
import CrowdMap from "@/components/features/crowd-monitoring/CrowdMap"
import {
  loadCamerasFromStorage,
  saveCamerasToStorage,
  loadCoverageFromStorage,
  saveCoverageToStorage,
} from "@/lib/cameraStorage"
import { useBackendStatus } from "@/hooks/use-backend-status"
import { useWeaponStatus } from "@/hooks/use-weapon-status"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { io } from "socket.io-client"

// --- TYPES ---
interface Camera {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: string;
    direction: number; // Direction in degrees (0-360)
    fovRadius: number; // FOV triangle radius in meters
}

interface CameraCoverageCircle {
    center: { lat: number; lng: number };
    radius: number;
}

export default function DashboardPage() {
  // Weapon detection integration
  const weaponFeed1 = (process.env.NEXT_PUBLIC_WEAPON_FEED_1 || "").trim()
  const weaponFeed2 = (process.env.NEXT_PUBLIC_WEAPON_FEED_2 || "").trim()
  const weaponWsUrl = (process.env.NEXT_PUBLIC_WEAPON_WS_URL || "").trim()

  const { cameraFeed: weaponCameraFeed, dataApi: weaponDataApi, isLoading: weaponLoading, isBackendRunning: isWeaponBackendRunning, refresh: refreshWeapon } = useWeaponStatus()
  const [weaponDetections, setWeaponDetections] = useState<Record<string, number>>({})
  const [weaponAlerts, setWeaponAlerts] = useState<any[]>([])

  useEffect(() => {
    if (!weaponWsUrl) return
    const ws = new WebSocket(weaponWsUrl)
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string)
        const key = msg?.label ?? 'weapon'
        setWeaponDetections(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
        setWeaponAlerts(prev => [{ message: msg?.message ?? `${key} detected`, raw: msg, ts: Date.now() }, ...prev].slice(0, 50))
      } catch {}
    }
    return () => ws.close()
  }, [weaponWsUrl])

  // Optional: also support Socket.IO server (like the weapon project at http://localhost:5000)
  useEffect(() => {
    const socketUrl = (process.env.NEXT_PUBLIC_WEAPON_SOCKET_URL || "").trim()
    if (!socketUrl) return
    const socket = io(socketUrl)
    socket.on("detection", (data: any) => {
      const key = data?.label ?? 'weapon'
      setWeaponDetections(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
      setWeaponAlerts(prev => [{ message: data?.message ?? `${key} detected`, raw: data, ts: Date.now() }, ...prev].slice(0, 50))
    })
    return () => { socket.disconnect() }
  }, [])

  const totalWeaponDetections = Object.values(weaponDetections).reduce((a, b) => a + b, 0)

  const [currentMapView, setCurrentMapView] = useState(1) // 0: heatmap, 1: escape routes (default)
  const [isLoaded, setIsLoaded] = useState(false)
  const [cameraPlacementMode, setCameraPlacementMode] = useState(false)
  
  // Shared camera state between both map views
  const [selectedCameraPositions, setSelectedCameraPositions] = useState<Camera[]>([])
  const [cameraCoverageCircle, setCameraCoverageCircle] = useState<CameraCoverageCircle | null>(null)
  
  // Backend connectivity status
  const { cameraFeed, dataApi, isLoading, isBackendRunning, refresh } = useBackendStatus()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Load persisted camera config & coverage on mount
  useEffect(() => {
    const stored = loadCamerasFromStorage()
    if (stored && stored.length > 0) {
      setSelectedCameraPositions(stored as Camera[])
    }
    const storedCoverage = loadCoverageFromStorage()
    if (storedCoverage) {
      setCameraCoverageCircle(storedCoverage)
    }
  }, [])

  const mapViews = ["Heatmap View", "Escape Routes"]

  const openCameraPlacementMode = () => {
    setCameraPlacementMode(true)
  }

  const closeCameraPlacementMode = () => {
    setCameraPlacementMode(false)
  }

  const handleCameraPositionsUpdate = (cameras: Camera[]) => {
    setSelectedCameraPositions(cameras)
    // Persist only camera static config
    saveCamerasToStorage(cameras)
  }

  const handleCameraCoverageUpdate = (coverage: CameraCoverageCircle | null) => {
    setCameraCoverageCircle(coverage)
    saveCoverageToStorage(coverage)
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-purple-900/10 overflow-hidden flex flex-col">
      {/* Top Bar: Home Icon + Place Cameras Button + Map Switcher */}
      <div className="flex items-center justify-between px-8 pt-6 pb-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="z-50 flex items-center space-x-3"
        >
          <Link href="/">
            <button className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 p-3 rounded-full border border-gray-700/50 transition-all duration-300 hover:scale-110">
              <Home size={20} className="text-white" />
            </button>
          </Link>
          
                          {/* Place Cameras Button - Only show when in Escape Routes view */}
                {currentMapView === 1 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    onClick={openCameraPlacementMode}
                    className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 p-3 rounded-full border border-gray-700/50 transition-all duration-300 hover:scale-110"
                  >
                    <Camera size={20} />
                  </motion.button>
                )}
        </motion.div>
        
        {/* Map Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentMapView(1)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-300 ${
              currentMapView === 1
                ? "bg-blue-600 text-white border-blue-400 shadow"
                : "bg-gray-900/80 text-gray-200 border-gray-700 hover:bg-gray-800"
            }`}
          >
            Escape Routes
          </button>
          <button
            onClick={() => setCurrentMapView(0)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-300 ${
              currentMapView === 0
                ? "bg-blue-600 text-white border-blue-400 shadow"
                : "bg-gray-900/80 text-gray-200 border-gray-700 hover:bg-gray-800"
            }`}
          >
            Heatmap
          </button>
        </div>
      </div>

      {/* Main Content: Camera + Map */}
      <div className="flex flex-1 px-6 pb-6 gap-6 min-h-0">
        {/* Left Side - Two Camera Feeds */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -50 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-1/3 flex flex-col min-h-0"
        >
          {/* Weapon Detection Summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.9 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden relative group transition-all duration-300 p-3 mb-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">Weapon Detection</div>
                <div className="text-xs text-gray-300">Total events: <span className="text-white font-bold">{totalWeaponDetections}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isWeaponBackendRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs ${isWeaponBackendRunning ? 'text-green-400' : 'text-red-400'}`}>
                  {isWeaponBackendRunning ? 'Connected' : 'Offline'}
                </span>
                <button
                  onClick={refreshWeapon}
                  disabled={weaponLoading}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-900/70 text-gray-200 rounded border border-gray-700/50 hover:bg-gray-900 transition-colors disabled:opacity-50 text-xs"
                >
                  <RefreshCw size={12} className={weaponLoading ? 'animate-spin' : ''} />
                  {weaponLoading ? 'Checking' : 'Retry'}
                </button>
              </div>
            </div>
            {Object.keys(weaponDetections).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(weaponDetections).slice(0,3).map(([label, count]) => (
                  <span key={label} className="text-xs text-gray-200 bg-gray-900/60 border border-gray-700/50 rounded px-2 py-0.5">
                    {label}: {count}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Camera Overlay 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden relative group hover:border-blue-500/50 transition-all duration-300 flex flex-col mb-2"
          >
            {/* Camera Feed - Weapon Detection 1 */}
            <div className="aspect-video bg-black relative flex-1">
              {weaponFeed1 ? (
                <img src={weaponFeed1} alt="Weapon Camera 1" className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Activity size={28} className="text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Set NEXT_PUBLIC_WEAPON_FEED_1</p>
                  </div>
                </div>
              )}
              {/* Status Indicator */}
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${weaponCameraFeed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs bg-black/50 px-2 py-1 rounded ${weaponCameraFeed ? 'text-green-400' : 'text-red-400'}`}>
                  {weaponCameraFeed ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            {/* Feed Info */}
            <div className="p-2">
              <h3 className="text-white">Weapon Camera 1</h3>
            </div>
          </motion.div>

          {/* Camera Overlay 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden relative group hover:border-blue-500/50 transition-all duration-300 flex flex-col flex-1"
          >
            {/* Camera Feed - Weapon Detection 2 */}
            <div className="aspect-video bg-black relative flex-1">
              {weaponFeed2 ? (
                <img src={weaponFeed2} alt="Weapon Camera 2" className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Activity size={28} className="text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Set NEXT_PUBLIC_WEAPON_FEED_2</p>
                  </div>
                </div>
              )}
              {/* Status Indicator */}
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${weaponCameraFeed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs bg-black/50 px-2 py-1 rounded ${weaponCameraFeed ? 'text-green-400' : 'text-red-400'}`}>
                  {weaponCameraFeed ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            {/* Feed Info */}
            <div className="p-2">
              <h3 className="text-white">Weapon Camera 2</h3>
            </div>
          </motion.div>

          {/* Alerts Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden relative group transition-all duration-300 flex flex-col"
          >
            <div className="p-3 flex items-center gap-2 border-b border-gray-700/50">
              <Bell size={16} className="text-red-400" />
              <h3 className="text-white text-sm font-semibold">Alert Messages</h3>
            </div>
            <div className="h-48">
              <ScrollArea className="h-48 px-3 py-2">
                {weaponAlerts.length === 0 ? (
                  <div className="text-sm text-gray-400">No alerts yet.</div>
                ) : (
                  weaponAlerts.map((a, idx) => (
                    <div key={idx} className="mb-2 p-2 bg-gray-900/70 rounded border border-gray-700/50">
                      <div className="text-red-400 text-sm font-semibold">Weapon Detected</div>
                      <div className="text-gray-200 text-sm">{a.message}</div>
                      <div className="text-gray-500 text-xs">{new Date(a.ts).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side - Large Map Section */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 50 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-2/3 flex flex-col min-h-0"
        >
          {/* Map Display */}
          <motion.div
            key={currentMapView}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 flex-1 relative overflow-hidden"
          >
            {/* Both views now use the CrowdMap component with different mapType props */}
            <CrowdMap 
              cameraPlacementMode={cameraPlacementMode}
              onCloseCameraPlacementMode={closeCameraPlacementMode}
              mapType={currentMapView === 0 ? 'heatmap' : 'escape-routes'}
              selectedCameraPositions={selectedCameraPositions}
              onCameraPositionsUpdate={handleCameraPositionsUpdate}
              cameraCoverageCircle={cameraCoverageCircle}
              onCameraCoverageUpdate={handleCameraCoverageUpdate}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

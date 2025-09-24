"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Camera, Bell, Home, Play, Eye, EyeOff, Volume2, VolumeX, MoreVertical, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { io, Socket } from "socket.io-client"
import DarkVeil from "../../common/DarkVeil"

interface Alert {
  message: string;
  timestamp: string;
  screenshot?: string;
  weapon_type?: string;
  confidence?: number;
}

interface Detection {
  id: number;
  date: string;
  weapon_type: string;
  location: string;
  screenshot: string;
  confidence?: number;
}

export default function DashboardPage() {
  const [selectedCamera, setSelectedCamera] = useState('main-entrance')
  const [isPlaying, setIsPlaying] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [streamError, setStreamError] = useState(false)
  const [modelStatus, setModelStatus] = useState<any>(null)
  const [detectionHistory, setDetectionHistory] = useState<Detection[]>([])
  const socketRef = useRef<Socket | null>(null)

  // Initialize backend connections
  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = io("http://localhost:5000")
    socketRef.current = socket
    
    socket.on("connect", () => {
      console.log("Connected to backend")
      setIsConnected(true)
    })
    
    socket.on("disconnect", () => {
      console.log("Disconnected from backend")
      setIsConnected(false)
    })
    
    socket.on("detection", (data: Alert) => {
      console.log("New detection:", data)
      setAlerts((prev) => [data, ...prev.slice(0, 9)]) // Keep last 10 alerts
    })
    
    socket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setIsConnected(false)
    })
    
    return () => {
      socket.disconnect()
    }
  }, [])

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch model status
        const modelResponse = await fetch('http://localhost:5000/api/model-status')
        if (modelResponse.ok) {
          const modelData = await modelResponse.json()
          setModelStatus(modelData)
        }
        
        // Fetch detection history
        const historyResponse = await fetch('http://localhost:5000/api/history')
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          setDetectionHistory(historyData.detections || [])
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      }
    }
    
    fetchInitialData()
  }, [])

  const cameraLocations = [
    {
      id: 'main-entrance',
      name: 'Main Entrance',
      status: modelStatus?.camera_status === 'connected' ? 'online' : 'offline',
      lastUpdate: '2 min ago'
    },
    {
      id: 'parking-lot',
      name: 'Parking Lot',
      status: 'offline',
      lastUpdate: '1 min ago'
    },
    {
      id: 'side-entrance',
      name: 'Side Entrance',
      status: 'offline',
      lastUpdate: '15 min ago'
    },
    {
      id: 'lobby',
      name: 'Lobby',
      status: 'offline',
      lastUpdate: '30 sec ago'
    },
    {
      id: 'cafeteria',
      name: 'Cafeteria',
      status: 'offline',
      lastUpdate: '5 min ago'
    }
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-purple-900/10 flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-blue-900/20 to-purple-900/20" />
      </div>

      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 px-6 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 rounded-full border border-gray-700/50 transition-all duration-300 hover:scale-110 group"
              >
                <Home size={20} className="text-white group-hover:text-blue-300 transition-colors" />
              </motion.button>
            </Link>
            <h1 className="text-xl font-semibold text-white">CCTV Monitoring Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Backend Connection Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={isConnected ? 'text-green-300' : 'text-red-300'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Model Status */}
            {modelStatus && (
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <div className={`w-2 h-2 rounded-full ${
                  modelStatus.status === 'loaded' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span>{modelStatus.model_type} model {modelStatus.status}</span>
              </div>
            )}
            
            {/* Camera Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <div className={`w-2 h-2 rounded-full ${
                modelStatus?.camera_status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span>Camera {modelStatus?.camera_status || 'unknown'}</span>
            </div>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 font-semibold rounded-lg hover:bg-gradient-to-r hover:from-blue-500/30 hover:via-purple-500/30 hover:to-blue-600/30 hover:border-blue-400/50 hover:text-white transition-all duration-500 shadow-lg hover:shadow-blue-500/25"
              >
                Back to Main
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Side - Live Camera Feed */}
        <div className="flex-1 flex flex-col p-6">
          {/* Main Camera Feed */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900/70 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 overflow-hidden flex-1 mb-6"
          >
            {/* Camera Feed Header */}
            <div className="bg-gray-800/60 backdrop-blur-sm px-4 py-3 border-b border-gray-700/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera size={20} className="text-blue-400" />
                <span className="font-medium text-white">Live Camera Feed</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-300">LIVE</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 hover:bg-gray-700/50 rounded transition-colors border border-gray-600/30"
                >
                  {isPlaying ? <Play size={16} className="text-gray-300" /> : <Eye size={16} className="text-gray-300" />}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className="p-2 hover:bg-gray-700/50 rounded transition-colors border border-gray-600/30"
                >
                  {isAudioEnabled ? <Volume2 size={16} className="text-gray-300" /> : <VolumeX size={16} className="text-gray-300" />}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-gray-700/50 rounded transition-colors border border-gray-600/30"
                >
                  <MoreVertical size={16} className="text-gray-300" />
                </motion.button>
              </div>
            </div>
            
            {/* Camera Feed Content */}
            <div className="bg-black/80 backdrop-blur-sm aspect-video flex items-center justify-center relative border-t border-gray-700/30">
              {streamError || !isConnected || modelStatus?.camera_status !== 'connected' ? (
                <div className="text-center text-gray-300">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-400/30"
                  >
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </motion.div>
                  <p className="text-lg font-medium text-white">Camera Unavailable</p>
                  <p className="text-sm opacity-60 text-gray-400">
                    {!isConnected ? 'Backend disconnected' : 
                     modelStatus?.camera_status !== 'connected' ? 'Camera not connected' : 
                     'Stream error'}
                  </p>
                  {streamError && (
                    <button 
                      onClick={() => setStreamError(false)}
                      className="mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 rounded-lg transition-all duration-200"
                    >
                      Retry Stream
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Actual Video Stream */}
                  <img
                    src="http://localhost:5000/stream"
                    alt="Live Camera Feed"
                    className="w-full h-full object-cover"
                    onError={() => setStreamError(true)}
                    onLoad={() => setStreamError(false)}
                  />
                  
                  {/* Live indicator overlay */}
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-3 py-1 rounded-full border border-red-500/50 shadow-lg animate-pulse">
                    ● LIVE
                  </div>
                  
                  {/* Latest Alert Overlay */}
                  {alerts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg border border-red-500/50 shadow-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-semibold">ALERT</span>
                      </div>
                      <div className="text-xs mt-1 opacity-90">
                        {alerts[0].weapon_type} detected
                        {alerts[0].confidence && ` (${(alerts[0].confidence * 100).toFixed(1)}%)`}
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Camera Location Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/70 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 p-4"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Camera size={16} className="text-blue-400" />
              Camera Locations
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {cameraLocations.map((camera) => (
                <motion.button
                  key={camera.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCamera(camera.id)}
                  className={`aspect-square rounded-lg border-2 transition-all duration-200 backdrop-blur-sm ${
                    selectedCamera === camera.id
                      ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                      : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-500/80 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="h-full flex flex-col items-center justify-center p-2">
                    <div className={`w-8 h-8 rounded mb-2 flex items-center justify-center transition-colors ${
                      selectedCamera === camera.id
                        ? 'bg-blue-500/30 border border-blue-400/50'
                        : 'bg-gray-700/50 border border-gray-600/30'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        selectedCamera === camera.id ? 'text-blue-300' : 'text-gray-400'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight transition-colors ${
                      selectedCamera === camera.id ? 'text-blue-200' : 'text-gray-300'
                    }`}>
                      {camera.name}
                    </span>
                    <div className="flex items-center mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        camera.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side - Alert Messages Panel */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-80 bg-gray-900/40 backdrop-blur-md border-l border-gray-700/50 p-6"
        >
          {/* Alert Panel Header */}
          <div className="flex items-center space-x-2 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Bell size={20} className="text-red-400" />
            </motion.div>
            <h2 className="text-lg font-semibold text-white">Alert Messages</h2>
          </div>

          {/* Alert Panel Content */}
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg shadow-sm border border-gray-700/30 h-full overflow-hidden">
            <div className="p-4 h-full flex flex-col">
              {alerts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-gray-400">
                  <div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                    >
                      <Bell size={48} className="mx-auto mb-4 opacity-40 text-gray-500" />
                    </motion.div>
                    <p className="text-sm text-gray-300">No alerts at this time</p>
                    <p className="text-xs mt-1 opacity-70 text-gray-400">All systems monitoring normally</p>
                    {detectionHistory.length > 0 && (
                      <p className="text-xs mt-2 text-blue-300">
                        {detectionHistory.length} past detections in history
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {alerts.map((alert, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-red-500/10 backdrop-blur-sm border border-red-400/30 rounded-lg hover:bg-red-500/20 transition-colors group"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-red-200">
                              {alert.weapon_type || 'Weapon'} Detected
                            </p>
                            {alert.confidence && (
                              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
                                {(alert.confidence * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-red-300 mt-1">{alert.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-red-400/80">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </p>
                            {alert.screenshot && (
                              <button 
                                onClick={() => window.open(`http://localhost:5000${alert.screenshot}`, '_blank')}
                                className="text-xs text-blue-300 hover:text-blue-200 underline opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View Screenshot
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* Alert Summary Footer */}
              {alerts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700/30">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">
                      {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

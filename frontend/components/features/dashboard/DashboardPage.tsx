"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { 
  IconAlertTriangle, 
  IconBellRinging, 
  IconPlayerPause, 
  IconPlayerPlay,
  IconWifi,
  IconCircleCheck,
  IconCpu,
  IconArrowLeft,
  IconDots,
  IconWifiOff
} from "@tabler/icons-react"
import Link from "next/link"
import { io, Socket } from "socket.io-client"
import { ScrollArea } from "../../ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Card } from "../../ui/card"

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
  const [isPaused, setIsPaused] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [streamError, setStreamError] = useState(false)
  const [modelStatus, setModelStatus] = useState<any>(null)
  const [detectionHistory, setDetectionHistory] = useState<Detection[]>([])
  const [showCameraMessage, setShowCameraMessage] = useState('')
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
      // Stop all cameras when component unmounts
      stopAllCameras()
    }
  }, [])

  // Fetch initial data and initialize cameras
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
        
        // Note: Main camera (index 0) is already running via existing backend
        // Only external cameras will need initialization when selected
        
      } catch (error) {
        console.error('Error fetching initial data:', error)
      }
    }
    
    fetchInitialData()
  }, [])

  // Cleanup cameras on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Stop all cameras when user leaves the page
      stopAllCameras()
    }

    const handleUnload = () => {
      stopAllCameras()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
    }
  }, [])

  const cameraLocations = [
    {
      id: 'main-entrance',
      name: 'Main Entrance',
      status: modelStatus?.camera_status === 'connected' ? 'online' : 'offline',
      lastUpdate: '2 min ago',
      streamUrl: 'http://localhost:5000/stream', // Main working camera
      cameraIndex: 0,
      isActive: true
    },
    {
      id: 'parking-lot',
      name: 'Parking Lot',
      status: 'offline',
      lastUpdate: '1 min ago',
      streamUrl: 'http://localhost:5000/stream/1', // Future external camera
      cameraIndex: 1,
      isActive: false
    },
    {
      id: 'side-entrance',
      name: 'Side Entrance',
      status: 'offline',
      lastUpdate: '15 min ago',
      streamUrl: 'http://localhost:5000/stream/2', // Future external camera
      cameraIndex: 2,
      isActive: false
    },
    {
      id: 'lobby',
      name: 'Lobby',
      status: 'offline',
      lastUpdate: '30 sec ago',
      streamUrl: 'http://localhost:5000/stream/3', // Future external camera
      cameraIndex: 3,
      isActive: false
    },
    {
      id: 'cafeteria',
      name: 'Cafeteria',
      status: 'offline',
      lastUpdate: '5 min ago',
      streamUrl: 'http://localhost:5000/stream/4', // Future external camera
      cameraIndex: 4,
      isActive: false
    }
  ]

  const getActiveStreamUrl = () => {
    const camera = cameraLocations.find(cam => cam.id === selectedCamera)
    return camera ? camera.streamUrl : cameraLocations[0].streamUrl
  }

  const getActiveCameraName = () => {
    const camera = cameraLocations.find(cam => cam.id === selectedCamera)
    return camera ? camera.name : cameraLocations[0].name
  }

  const handleCameraSelect = async (cameraId: string) => {
    const newCamera = cameraLocations.find(cam => cam.id === cameraId)
    
    // If selecting an external camera that's not active, show message
    if (newCamera && !newCamera.isActive) {
      setShowCameraMessage(`${newCamera.name} camera is not currently connected. Please connect external camera ${newCamera.cameraIndex} to enable this feed.`)
      setTimeout(() => setShowCameraMessage(''), 4000)
      return
    }
    
    // For active cameras, proceed with selection
    setSelectedCamera(cameraId)
    setIsPaused(false)
    setShowCameraMessage('')
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const stopAllCameras = async () => {
    console.log('Stopping external cameras...')
    try {
      // Stop only external cameras (not the main active camera)
      for (const camera of cameraLocations) {
        if (!camera.isActive) {
          await fetch(`http://localhost:5000/api/camera/stop/${camera.cameraIndex}`, {
            method: 'POST'
          })
        }
      }
      
      console.log('External cameras stopped successfully')
    } catch (error) {
      console.error('Error stopping external cameras:', error)
    }
  }

  const initializeCamera = async (cameraIndex: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/camera/initialize/${cameraIndex}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        console.log(`Camera ${cameraIndex} initialized successfully`)
        return true
      } else {
        console.error(`Failed to initialize camera ${cameraIndex}`)
        return false
      }
    } catch (error) {
      console.error(`Error initializing camera ${cameraIndex}:`, error)
      return false
    }
  }

  const checkCameraAvailability = async (cameraIndex: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/camera/check/${cameraIndex}`)
      if (response.ok) {
        const data = await response.json()
        return data.available || false
      }
    } catch (error) {
      console.error(`Error checking camera ${cameraIndex}:`, error)
    }
    return false
  }

  // Update external camera statuses periodically
  useEffect(() => {
    const checkExternalCameras = async () => {
      const updatedStatuses = {}
      for (const camera of cameraLocations) {
        if (camera.isActive) {
          // Main camera status is handled by existing modelStatus
          updatedStatuses[camera.id] = modelStatus?.camera_status === 'connected' ? 'online' : 'offline'
        } else {
          // Check external cameras only
          const isAvailable = await checkCameraAvailability(camera.cameraIndex)
          updatedStatuses[camera.id] = isAvailable ? 'online' : 'offline'
        }
      }
      console.log('Camera statuses:', updatedStatuses)
    }

    // Check camera statuses every 30 seconds
    const interval = setInterval(checkExternalCameras, 30000)
    
    // Initial check after a delay to allow modelStatus to load
    setTimeout(checkExternalCameras, 2000)

    return () => clearInterval(interval)
  }, [modelStatus])

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-800 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-neutral-800 border-b border-slate-200 dark:border-neutral-700 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-all duration-200"
              onClick={async () => {
                await stopAllCameras()
                window.location.href = '/'
              }}
            >
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back to Main
            </Button>
            <div className="h-6 w-px bg-slate-300 dark:bg-neutral-600" />
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
              CCTV Monitoring Dashboard
            </h1>
          </div>
          
          {/* System Status */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <IconWifi className="w-4 h-4 text-emerald-500" />
              ) : (
                <IconWifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <IconCpu className={`w-4 h-4 ${modelStatus?.status === 'loaded' ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Model {modelStatus?.status === 'loaded' ? 'Loaded' : 'Loading'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <IconCircleCheck className={`w-4 h-4 ${modelStatus?.camera_status === 'connected' ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Camera {modelStatus?.camera_status === 'connected' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* Camera Selection Message */}
          {showCameraMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <IconAlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-800 dark:text-blue-200">Camera Information</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  {showCameraMessage}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Live Camera Feed */}
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-6xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-xl overflow-hidden">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                {streamError || !isConnected || modelStatus?.camera_status !== 'connected' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="text-center">
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"
                      >
                        <IconAlertTriangle className="w-8 h-8 text-red-400" />
                      </motion.div>
                      <p className="text-xl font-medium text-white">Camera Unavailable</p>
                      <p className="text-slate-300 mt-2">
                        {!isConnected ? 'Backend disconnected' : 
                         modelStatus?.camera_status !== 'connected' ? 'Camera not connected' : 
                         'Stream error'}
                      </p>
                      {streamError && (
                        <Button 
                          onClick={() => setStreamError(false)}
                          className="mt-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                        >
                          Retry Stream
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={isPaused ? '' : getActiveStreamUrl()}
                      alt={`Live Feed - ${getActiveCameraName()}`}
                      className="w-full h-full object-cover"
                      style={{ display: isPaused ? 'none' : 'block' }}
                      onError={() => setStreamError(true)}
                      onLoad={() => setStreamError(false)}
                    />
                    
                    {isPaused && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-50">
                        <div className="text-center">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <IconPlayerPlay size={80} className="mx-auto mb-4 text-white" />
                          </motion.div>
                          <p className="text-2xl font-medium text-white">Camera Paused</p>
                          <p className="text-slate-300 mt-2">Click play to resume</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Camera Info Overlay */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-black bg-opacity-70 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <h3 className="text-white font-semibold text-lg">{getActiveCameraName()}</h3>
                        <p className="text-slate-300 text-sm">Live Feed • Camera Online</p>
                      </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="absolute bottom-4 right-4">
                      <Button
                        onClick={togglePause}
                        size="lg"
                        className={`bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-800 border-none shadow-lg backdrop-blur-sm transition-all duration-200 ${
                          isPaused ? 'hover:shadow-green-200' : 'hover:shadow-red-200'
                        }`}
                      >
                        {isPaused ? (
                          <IconPlayerPlay className="w-6 h-6 mr-2" />
                        ) : (
                          <IconPlayerPause className="w-6 h-6 mr-2" />
                        )}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                    </div>

                    {/* Alert Overlay */}
                    {alerts.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-4 right-4"
                      >
                        <Alert variant="destructive" className="bg-red-500 bg-opacity-90 backdrop-blur-sm text-white border-red-400">
                          <IconAlertTriangle className="h-4 w-4" />
                          <AlertTitle className="text-white">Weapon Detected!</AlertTitle>
                          <AlertDescription className="text-red-100">
                            {alerts[0].weapon_type} detected {alerts[0].confidence && `(${(alerts[0].confidence * 100).toFixed(1)}%)`}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>

          
          {/* Camera Locations Grid */}
          <div className="h-36">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Camera Locations</h2>
            <div className="grid grid-cols-5 gap-3 h-24">
              {cameraLocations.map((camera) => {
                const isActive = camera.id === selectedCamera
                const isOnline = camera.status === 'online'
                
                return (
                  <motion.div
                    key={camera.id}
                    onClick={() => handleCameraSelect(camera.id)}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 group ${
                      isActive 
                        ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-100 dark:shadow-blue-900/20 scale-105' 
                        : 'hover:shadow-lg hover:scale-102'
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="h-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
                      <div className="relative h-full">
                        <img
                          src={camera.streamUrl}
                          alt={camera.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg?height=120&width=200&text=Camera ${camera.id.split('-')[0]}`
                          }}
                        />
                        
                        {/* Status Indicator */}
                        <div className="absolute top-1 right-1">
                          <div className={`w-2 h-2 rounded-full ${
                            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                          } shadow-md`} />
                        </div>
                        
                        {/* Camera Info Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-2">
                          <p className="text-white font-medium text-xs truncate">{camera.name}</p>
                          <p className="text-slate-300 text-[10px]">
                            {isOnline ? 'Online' : 'Offline'} • {camera.lastUpdate}
                          </p>
                        </div>
                        
                        {/* Active Indicator */}
                        {isActive && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
                            <div className="bg-blue-500 text-white px-1 py-0.5 rounded text-[10px] font-medium">
                              ACTIVE
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>


        {/* Right Alerts Panel */}
        <div className="w-80 bg-white dark:bg-neutral-800 border-l border-slate-200 dark:border-neutral-700 flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Detection Alerts</h2>
              {alerts.length > 0 && (
                <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                  {alerts.length}
                </Badge>
              )}
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <IconBellRinging className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No Recent Alerts</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">System monitoring active</p>
                  {detectionHistory.length > 0 && (
                    <p className="text-xs mt-2 text-blue-300">
                      {detectionHistory.length} past detections in history
                    </p>
                  )}
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <IconAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <h3 className="font-semibold text-red-700 dark:text-red-300 text-sm">
                            {alert.weapon_type || 'Weapon'} Detected
                          </h3>
                          {alert.confidence && (
                            <Badge variant="outline" className="text-xs bg-red-500/20 text-red-600 border-red-300">
                              {(alert.confidence * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                          {alert.message || "Potential threat detected in camera feed"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          {alert.screenshot && (
                            <button 
                              onClick={() => window.open(`http://localhost:5000${alert.screenshot}`, '_blank')}
                              className="text-blue-500 hover:text-blue-600 underline"
                            >
                              View Screenshot
                            </button>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                        <IconDots className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

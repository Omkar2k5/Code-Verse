"use client";
import { 
  IconAlertTriangle, 
  IconBellRinging, 
  IconPlayerPause, 
  IconPlayerPlay,
  IconHome,
  IconVideo,
  IconSettings,
  IconFileText,
  IconWifi,
  IconCircleCheck,
  IconCpu,
  IconArrowLeft,
  IconBell,
  IconDots
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const Dashboard = () => {
  const cameras = [
    { id: 1, name: "Main Entrance", streamUrl: process.env.NEXT_PUBLIC_WEAPON_FEED_1 || "http://localhost:5000/stream" },
    { id: 2, name: "Parking Lot", streamUrl: process.env.NEXT_PUBLIC_WEAPON_FEED_2 || "http://localhost:5001/stream" },
    { id: 3, name: "Side Entrance", streamUrl: process.env.NEXT_PUBLIC_WEAPON_FEED_3 || "http://localhost:5002/stream" },
    { id: 4, name: "Lobby", streamUrl: process.env.NEXT_PUBLIC_WEAPON_FEED_4 || "http://localhost:5003/stream" },
    { id: 5, name: "Cafeteria", streamUrl: process.env.NEXT_PUBLIC_WEAPON_FEED_5 || "http://localhost:5004/stream" },
  ];

  const [activeCamera, setActiveCamera] = useState(1);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('cameras');
  const [systemStatus, setSystemStatus] = useState({
    connected: true,
    modelLoaded: true,
    cameraOnline: true
  });
  const videoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const socketUrl = (process.env.NEXT_PUBLIC_WEAPON_SOCKET_URL || "http://localhost:5000").trim();
    const socket = io(socketUrl);
    socket.on("detection", (data: any) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50));
    });
    return () => socket.disconnect();
  }, []);

  const getActiveStreamUrl = () => {
    const camera = cameras.find(cam => cam.id === activeCamera);
    return camera ? camera.streamUrl.trim() : cameras[0].streamUrl.trim();
  };

  const getActiveCameraName = () => {
    const camera = cameras.find(cam => cam.id === activeCamera);
    return camera ? camera.name : cameras[0].name;
  };

  const handleCameraSelect = (cameraId: number) => {
    setActiveCamera(cameraId);
    setIsPaused(false); // Reset pause state when switching cameras
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Navigation items
  const navigationItems = [
    { id: 'home', icon: IconHome, label: 'Home' },
    { id: 'cameras', icon: IconVideo, label: 'Cameras' },
    { id: 'alerts', icon: IconBell, label: 'Alerts' },
    { id: 'settings', icon: IconSettings, label: 'Settings' },
    { id: 'reports', icon: IconFileText, label: 'Reports' },
  ];

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
            >
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back to Main
            </Button>
            <div className="h-6 w-px bg-slate-300 dark:bg-neutral-600" />
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
              Weapon Detection Dashboard
            </h1>
          </div>
          
          {/* System Status */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <IconWifi className={`w-4 h-4 ${systemStatus.connected ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {systemStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <IconCpu className={`w-4 h-4 ${systemStatus.modelLoaded ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Model {systemStatus.modelLoaded ? 'Loaded' : 'Loading'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <IconCircleCheck className={`w-4 h-4 ${systemStatus.cameraOnline ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Camera {systemStatus.cameraOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className="w-16 bg-white dark:bg-neutral-800 border-r border-slate-200 dark:border-neutral-700 flex flex-col items-center py-6 space-y-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveNavItem(item.id)}
                className={`p-3 rounded-lg transition-all duration-200 group relative ${
                  activeNavItem === item.id
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-6 h-6" />
                {activeNavItem === item.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg opacity-10"
                    layoutId="activeNav"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="absolute left-16 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {item.label}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* Live Camera Feed */}
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-6xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-xl overflow-hidden">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <img
                  ref={videoRef}
                  src={isPaused ? '' : getActiveStreamUrl()}
                  alt={`Live Feed - ${getActiveCameraName()}`}
                  className="w-full h-full object-cover"
                  style={{ display: isPaused ? 'none' : 'block' }}
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
                    <p className="text-slate-300 text-sm">Camera {activeCamera} • Live Feed</p>
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
                        {alerts[0]?.message ?? "Threat detected in camera view"}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Camera Locations Grid */}
          <div className="h-36">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Camera Locations</h2>
            <div className="grid grid-cols-5 gap-3 h-24">
              {cameras.map((camera) => {
                const isActive = camera.id === activeCamera;
                const isOnline = Math.random() > 0.2; // Simulate camera status
                
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
                            e.currentTarget.src = `/placeholder.svg?height=120&width=200&text=Camera ${camera.id}`;
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
                            {isOnline ? 'Online' : 'Offline'} • Cam {camera.id}
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
                );
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
                          <h3 className="font-semibold text-red-700 dark:text-red-300 text-sm">Weapon Detected</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                          {alert.message ?? "Potential threat detected in camera feed"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>Camera {alert.camera_id || activeCamera}</span>
                          <span>{new Date().toLocaleTimeString()}</span>
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
  );
};

export default Dashboard;
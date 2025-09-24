"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Camera, Bell, Home, Play, Eye, EyeOff, Volume2, VolumeX, MoreVertical } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function DashboardPage() {
  const [selectedCamera, setSelectedCamera] = useState('main-entrance')
  const [isPlaying, setIsPlaying] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const cameraLocations = [
    {
      id: 'main-entrance',
      name: 'Main Entrance',
      status: 'online',
      lastUpdate: '2 min ago'
    },
    {
      id: 'parking-lot',
      name: 'Parking Lot',
      status: 'online',
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
      status: 'online',
      lastUpdate: '30 sec ago'
    },
    {
      id: 'cafeteria',
      name: 'Cafeteria',
      status: 'online',
      lastUpdate: '5 min ago'
    }
  ]

  const alerts = [
    // Placeholder for alerts - empty for now as shown in the design
  ]

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Home size={20} className="text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">CCTV Monitoring Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>5 cameras online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Live Camera Feed */}
        <div className="flex-1 flex flex-col p-6">
          {/* Main Camera Feed */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 mb-6"
          >
            {/* Camera Feed Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">Live Camera Feed</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600">LIVE</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                >
                  {isPlaying ? <Play size={16} className="text-gray-600" /> : <Eye size={16} className="text-gray-600" />}
                </button>
                <button 
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                >
                  {isAudioEnabled ? <Volume2 size={16} className="text-gray-600" /> : <VolumeX size={16} className="text-gray-600" />}
                </button>
                <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                  <MoreVertical size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Camera Feed Content */}
            <div className="bg-black aspect-video flex items-center justify-center relative">
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Live Camera Feed</p>
                <p className="text-sm opacity-60">Camera stream will appear here</p>
              </div>
              {/* Live indicator overlay */}
              <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded">
                ● LIVE
              </div>
            </div>
          </motion.div>

          {/* Camera Location Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-4"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Camera Locations</h3>
            <div className="grid grid-cols-5 gap-3">
              {cameraLocations.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setSelectedCamera(camera.id)}
                  className={`aspect-square rounded-lg border-2 transition-all duration-200 ${
                    selectedCamera === camera.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="h-full flex flex-col items-center justify-center p-2">
                    <div className="w-8 h-8 bg-gray-300 rounded mb-2 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {camera.name}
                    </span>
                    <div className="flex items-center mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side - Alert Messages Panel */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-80 bg-gray-50 border-l border-gray-200 p-6"
        >
          {/* Alert Panel Header */}
          <div className="flex items-center space-x-2 mb-6">
            <Bell size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Alert Messages</h2>
          </div>

          {/* Alert Panel Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="p-4 h-full flex items-center justify-center">
              {alerts.length === 0 ? (
                <div className="text-center text-gray-400">
                  <Bell size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No alerts at this time</p>
                  <p className="text-xs mt-1 opacity-70">All systems monitoring normally</p>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  {alerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-red-900">{alert.message}</p>
                          <p className="text-xs text-red-600 mt-1">{alert.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

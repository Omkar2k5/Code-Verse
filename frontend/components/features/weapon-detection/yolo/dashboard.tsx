"use client";
import { IconAlertTriangle, IconBellRinging } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const Dashboard = () => {
  const cameras = [
    { id: 1, name: "Main Entrance" },
    { id: 2, name: "Parking Lot" },
    { id: 3, name: "Side Entrance" },
    { id: 4, name: "Lobby" },
    { id: 5, name: "Cafeteria" },
  ];

  const [activeCamera, setActiveCamera] = useState(1);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const socketUrl = (process.env.NEXT_PUBLIC_WEAPON_SOCKET_URL || "http://localhost:5000").trim();
    const socket = io(socketUrl);
    socket.on("detection", (data: any) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50));
    });
    return () => socket.disconnect();
  }, []);

  const streamUrl = (process.env.NEXT_PUBLIC_WEAPON_FEED_1 || "http://localhost:5000/stream").trim();

  return (
    <div className="flex flex-1 p-4 bg-white dark:bg-neutral-900">
      <div className="flex-1 pr-4">
        {alerts.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>{alerts[0]?.message ?? "Weapon detected"}</AlertDescription>
          </Alert>
        )}
        <div className="relative">
          <img
            src={streamUrl}
            alt="Live Camera Feed"
            className="w-full h-[500px] object-cover rounded-lg shadow-lg"
          />
        </div>
        <div className="mt-4 relative">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {cameras.map((camera) => (
              <div key={camera.id} className="flex flex-col items-center">
                <img
                  src={`/placeholder.svg?height=100&width=150&text=Camera ${camera.id}`}
                  alt={`Camera ${camera.id}`}
                  className="w-[150px] h-[100px] object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => setActiveCamera(camera.id)}
                />
                <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">{camera.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-[30%] bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <IconBellRinging className="mr-2 h-5 w-5 text-red-500" />
          Alert Messages
        </h2>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="mb-4 p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="font-semibold text-red-600 dark:text-red-400">Weapon Detected</h3>
              <p className="text-sm mt-1">{alert.message ?? "Event"}</p>
            </motion.div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
};

export default Dashboard;
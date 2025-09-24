"use client";
import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Analysis = () => {
  const [weaponData, setWeaponData] = useState<any>({ labels: [], datasets: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_WEAPON_API_BASE || "http://localhost:5000").trim();
      const weaponRes = await axios.get(`${apiBase}/api/analysis/weapon-distribution`);
      const labels = weaponRes.data.labels || [];
      const data = weaponRes.data.data || [];
      setWeaponData({
        labels,
        datasets: [
          {
            label: "Weapon Types Detected",
            data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(75, 192, 192, 0.6)",
            ].slice(0, data.length),
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
            ].slice(0, data.length),
            borderWidth: 1,
          },
        ],
      });
      setError(null);
    } catch (e) {
      setError("Failed to load analysis data.");
    }
  };

  return (
    <div className="flex-1 p-4 overflow-auto">
      <h2 className="text-2xl font-semibold mb-4">Detection Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Weapon Types</h3>
          {error ? <p className="text-red-500">{error}</p> : <Bar data={weaponData} />}
        </div>
      </div>
    </div>
  );
};

export default Analysis;
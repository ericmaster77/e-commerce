// src/components/CashbackReminders.js - NUEVO
import React, { useState, useEffect } from 'react';
import { Bell, DollarSign, AlertCircle } from 'lucide-react';
import { recommendationService } from '../services/recommendationService';

const CashbackReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
    // Actualizar cada hora
    const interval = setInterval(loadReminders, 3600000);
    return () => clearInterval(interval);
  }, []);

  const loadReminders = async () => {
    try {
      const data = await recommendationService.checkUnusedCashback();
      setReminders(data);
    } catch (error) {
      console.error('Error cargando recordatorios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando recordatorios...</div>;
  if (reminders.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border-2 border-yellow-400 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold">Clientes con Cashback sin usar</h3>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {reminders.slice(0, 5).map((reminder, idx) => (
            <div 
              key={idx} 
              className={`p-2 rounded ${
                reminder.priority === 'high' ? 'bg-red-50' : 'bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium">{reminder.name}</p>
                  <p className="text-xs text-gray-600">
                    ${reminder.cashbackBalance.toLocaleString()} disponible
                  </p>
                </div>
                <div className="text-xs text-right">
                  <p className="text-gray-500">Sin comprar hace</p>
                  <p className="font-semibold">{reminder.daysSinceLastPurchase} días</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {reminders.length > 5 && (
          <p className="text-xs text-gray-500 mt-2">
            +{reminders.length - 5} clientes más
          </p>
        )}
      </div>
    </div>
  );
};

export default CashbackReminders;
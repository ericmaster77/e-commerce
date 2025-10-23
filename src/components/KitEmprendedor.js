// src/components/KitEmprendedor.js
import React, { useState } from 'react';
import { Package, TrendingUp, Users, Award, ChevronRight, ShoppingBag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const KitEmprendedor = () => {
  const { classes, isMinimal } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const benefits = [
    { icon: Package, title: 'Precio de Mayoreo', desc: 'Acceso inmediato a precios especiales' },
    { icon: TrendingUp, title: 'Márgenes de Ganancia', desc: 'Hasta 50% de utilidad en cada venta' },
    { icon: Users, title: 'Capacitación Incluida', desc: 'Aprende a vender y crecer tu negocio' },
    { icon: Award, title: 'Certificado Rosa Oliva', desc: 'Respaldo de nuestra marca' }
  ];

  return (
    <section className={`py-12 md:py-16 ${isMinimal ? 'bg-gray-50' : 'bg-gradient-to-br from-rosa-light to-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className={`${classes.sectionTitle} text-2xl md:text-3xl font-bold mb-4`}>
            ARMA TU KIT EMPRENDEDOR
          </h2>
          <p className={`${classes.sectionSubtitle} text-lg`}>
            A personas a encontrar su propio camino, impulsadas por el legado de Rosa Oliva
          </p>
        </div>

        {/* Main Card */}
        <div className={`${isMinimal ? 'bg-white' : 'bg-gradient-to-r from-white to-rosa-light'} rounded-2xl shadow-2xl overflow-hidden`}>
          <div className="md:flex">
            {/* Left Side - Pricing */}
            <div className={`md:w-1/3 p-8 text-center ${
              isMinimal ? 'bg-black text-white' : 'bg-gradient-to-br from-rosa-primary to-rosa-secondary text-white'
            }`}>
              <div className="mb-4">
                <div className="text-sm uppercase tracking-wide opacity-90">Precio Especial</div>
                <div className="text-5xl font-bold my-3">$5,000</div>
                <div className="text-lg line-through opacity-70">$10,000</div>
                <div className="mt-2 inline-block bg-white/20 px-3 py-1 rounded-full text-sm">
                  25% y 50% de Descuento
                </div>
              </div>
              
              <div className="border-t border-white/30 pt-4 mt-6">
                <div className="text-2xl font-bold mb-1">PRECIO DE MAYOREO</div>
                <div className="text-sm opacity-90">Para emprendedores</div>
              </div>
            </div>

            {/* Right Side - Benefits */}
            <div className="md:w-2/3 p-8">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isMinimal ? 'bg-gray-100' : 'bg-rosa-light'
                      }`}>
                        <Icon className={`w-5 h-5 ${isMinimal ? 'text-black' : 'text-rosa-primary'}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${classes.sectionTitle} text-sm`}>
                          {benefit.title}
                        </h3>
                        <p className={`${classes.missionText} text-xs mt-1`}>
                          {benefit.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className={`${classes.buttonPrimary} px-6 py-3 rounded-lg flex items-center justify-center gap-2`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  Quiero Mi Kit
                </button>
                <button 
                  className={`${classes.buttonSecondary} px-6 py-3 rounded-lg flex items-center justify-center gap-2`}
                >
                  Ver Catálogo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Additional Info */}
              <div className={`mt-6 p-4 rounded-lg ${isMinimal ? 'bg-gray-50' : 'bg-blue-50'}`}>
                <p className="text-sm text-gray-700">
                  <strong>💡 Incluye:</strong> 10 productos best seller + Material de apoyo + 
                  Acceso a grupo VIP de WhatsApp + Asesoría personalizada
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-6 p-6 bg-white rounded-xl shadow-lg animate-fade-in">
            <h3 className="font-bold text-lg mb-4">¿Qué incluye el Kit Emprendedor?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl mb-2">💎</div>
                <h4 className="font-semibold">10 Productos</h4>
                <p className="text-sm text-gray-600">Los más vendidos</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl mb-2">📚</div>
                <h4 className="font-semibold">Capacitación</h4>
                <p className="text-sm text-gray-600">Videos y guías</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-semibold">Soporte 24/7</h4>
                <p className="text-sm text-gray-600">Te acompañamos</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default KitEmprendedor;
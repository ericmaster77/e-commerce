// src/contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('rosa-oliva-theme');
    return savedTheme || 'colorful';
  });

  useEffect(() => {
    localStorage.setItem('rosa-oliva-theme', theme);
    
    if (theme === 'minimal') {
      document.body.classList.add('theme-minimal');
      document.body.classList.remove('theme-colorful');
    } else {
      document.body.classList.add('theme-colorful');
      document.body.classList.remove('theme-minimal');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'colorful' ? 'minimal' : 'colorful');
  };

  const themes = {
    colorful: {
      primary: '#d4a574',
      secondary: '#2596be',
      dark: '#90983d',
      light: '#f3e5d8',
      accent: '#7a8131',
      
      bg: {
        main: 'bg-gray-50',
        card: 'bg-white',
        gradient: 'bg-gradient-to-r from-[#90983d] to-[#7a8131]',
        headerGradient: 'bg-gradient-to-r from-[#90983d] to-[#7a8131]',
        heroGradient: 'bg-gradient-to-br from-rosa-light to-white',
        footerGradient: 'bg-gradient-to-br from-gray-900 to-gray-800'
      },
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        accent: 'text-rosa-primary',
        dark: 'text-rosa-dark'
      },
      button: {
        primary: 'bg-rosa-primary hover:bg-rosa-dark text-white',
        secondary: 'bg-rosa-secondary hover:bg-[#1e7a9e] text-white',
        outline: 'border-2 border-rosa-primary text-rosa-dark hover:bg-rosa-light'
      },
      badge: {
        featured: 'bg-rosa-primary text-white',
        discount: 'bg-red-500 text-white',
        stock: 'bg-green-100 text-green-800'
      }
    },
    
    minimal: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      dark: '#000000',
      light: '#f5f5f5',
      accent: '#2d2d2d',
      
      bg: {
        main: 'bg-white',
        card: 'bg-gray-50',
        gradient: 'bg-gradient-to-r from-gray-900 to-gray-800',
        headerGradient: 'bg-white border-b border-gray-200',
        heroGradient: 'bg-gradient-to-br from-gray-100 to-white',
        footerGradient: 'bg-gray-900'
      },
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        accent: 'text-gray-800',
        dark: 'text-black'
      },
      button: {
        primary: 'bg-black hover:bg-gray-800 text-white',
        secondary: 'bg-gray-800 hover:bg-gray-700 text-white',
        outline: 'border-2 border-black text-black hover:bg-gray-100'
      },
      badge: {
        featured: 'bg-black text-white',
        discount: 'bg-gray-800 text-white',
        stock: 'bg-gray-200 text-gray-800'
      }
    }
  };

  const currentTheme = themes[theme];
  const isMinimal = theme === 'minimal';
  const isColorful = theme === 'colorful';

  const value = {
    theme,
    setTheme,
    toggleTheme,
    currentTheme,
    isMinimal,
    isColorful,
    
    classes: {
      // ========== HEADER ==========
      header: isMinimal 
        ? 'bg-white shadow-sm border-b border-gray-200' 
        : 'bg-gradient-to-r from-[#90983d] to-[#7a8131] shadow-md',
      headerText: isMinimal ? 'text-gray-900' : 'text-gray-700',
      headerLogo: isMinimal ? 'text-black' : 'text-rosa-dark',
      linkHover: isMinimal ? 'hover:text-black' : 'hover:text-rosa-primary',
      
      // ========== HERO / HOME ==========
      hero: isMinimal 
        ? 'bg-gradient-to-br from-gray-50 to-white' 
        : 'bg-gradient-to-br from-rosa-light to-white',
      heroTitle: isMinimal ? 'text-black' : 'text-gray-900',
      heroSubtitle: isMinimal ? 'text-gray-700' : 'text-rosa-dark',
      heroText: isMinimal ? 'text-gray-600' : 'text-gray-600',
      
      // ========== BUTTONS ==========
      buttonPrimary: isMinimal 
        ? 'bg-black text-white hover:bg-gray-800 transition-colors shadow-lg' 
        : 'bg-rosa-primary text-white hover:bg-rosa-dark transition-colors shadow-lg',
      buttonSecondary: isMinimal
        ? 'border-2 border-black text-black hover:bg-gray-100 transition-colors'
        : 'border-2 border-rosa-primary text-rosa-dark hover:bg-rosa-light transition-colors',
      buttonAdmin: isMinimal
        ? 'bg-gray-800 text-white hover:bg-gray-700'
        : 'bg-red-600 text-white hover:bg-red-700',
      buttonAddToCart: isMinimal
        ? 'bg-black text-white hover:bg-gray-800'
        : 'bg-rosa-primary text-white hover:bg-rosa-dark',
      
      // ========== CARDS ==========
      card: 'bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300',
      cardBadgeFeatured: isMinimal 
        ? 'bg-black text-white' 
        : 'bg-rosa-primary text-white',
      cardBadgeDiscount: isMinimal
        ? 'bg-gray-800 text-white'
        : 'bg-red-500 text-white',
      
      // ========== PRODUCT ==========
      productPrice: isMinimal ? 'text-black' : 'text-gray-900',
      productPriceLabel: isMinimal ? 'text-gray-600' : 'text-rosa-secondary',
      productTitle: isMinimal ? 'text-gray-900' : 'text-gray-900',
      productDescription: isMinimal ? 'text-gray-600' : 'text-gray-600',
      
      // ========== FOOTER ==========
      footer: isMinimal 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-900 to-gray-800 text-white',
      footerTitle: 'text-white',
      footerText: 'text-gray-400',
      footerLink: isMinimal 
        ? 'hover:text-white transition-colors' 
        : 'hover:text-rosa-primary transition-colors',
      footerLogo: isMinimal ? 'text-white' : 'text-rosa-primary',
      
      // ========== SECTIONS ==========
      sectionBg: isMinimal ? 'bg-white' : 'bg-gray-50',
      sectionTitle: isMinimal ? 'text-black' : 'text-gray-900',
      sectionSubtitle: isMinimal ? 'text-gray-700' : 'text-gray-600',
      
      // ========== MISSION CARDS ==========
      missionCard: isMinimal
        ? 'bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow'
        : 'bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow',
      missionIcon: isMinimal
        ? 'w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4'
        : 'w-16 h-16 bg-gradient-to-br from-rosa-primary to-rosa-secondary rounded-full flex items-center justify-center mx-auto mb-4',
      missionTitle: isMinimal ? 'text-black' : 'text-gray-900',
      missionText: isMinimal ? 'text-gray-600' : 'text-gray-600',
      
      // ========== MEMBERSHIP ==========
      membershipCard: isMinimal
        ? 'bg-gradient-to-br from-gray-100 to-white rounded-2xl p-8 mb-8 shadow-lg'
        : 'bg-gradient-to-br from-rosa-light to-white rounded-2xl p-8 mb-8 shadow-lg',
      membershipPrice: isMinimal ? 'text-black' : 'text-rosa-primary',
      membershipCheckmark: isMinimal
        ? 'w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-1'
        : 'w-6 h-6 bg-rosa-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1',
      
      // ========== ABOUT ==========
      aboutCard: isMinimal
        ? 'bg-white p-8 rounded-2xl shadow-lg'
        : 'bg-white p-8 rounded-2xl shadow-lg',
      aboutQuote: isMinimal
        ? 'border-l-4 border-black pl-4 italic text-lg text-gray-700'
        : 'border-l-4 border-rosa-primary pl-4 italic text-lg text-rosa-dark',
      
      // ========== CART ==========
      cartBg: 'bg-white',
      cartHeader: isMinimal ? 'border-b border-gray-200' : 'border-b border-gray-200',
      cartTotal: isMinimal ? 'text-black' : 'text-rosa-primary',
      cartButton: isMinimal
        ? 'bg-black text-white hover:bg-gray-800'
        : 'bg-rosa-primary text-white hover:bg-rosa-dark',
      
      // ========== PLACEHOLDERS ==========
      placeholderGradient: isMinimal
        ? 'bg-gradient-to-br from-gray-200 to-gray-300'
        : 'bg-gradient-to-br from-rosa-light to-rosa-primary',
      placeholderText: isMinimal ? 'text-gray-700' : 'text-rosa-dark',
      
      // ========== ICONS ==========
      iconAccent: isMinimal ? 'text-gray-900' : 'text-rosa-primary',
      iconCircle: isMinimal ? 'bg-black' : 'bg-rosa-primary',
      
      // ========== CONTACT CARDS ==========
      contactIcon: isMinimal
        ? 'w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-3'
        : 'w-12 h-12 bg-rosa-primary rounded-full flex items-center justify-center mx-auto mb-3',
      
      // ========== FILTERS & SEARCH ==========
      filterBg: isMinimal ? 'bg-gray-50' : 'bg-gray-50',
      filterLabel: isMinimal ? 'text-gray-700' : 'text-gray-700',
      filterInput: 'border border-gray-300 rounded-lg focus:ring-2',
      filterInputFocus: isMinimal
        ? 'focus:ring-gray-900 focus:border-gray-900'
        : 'focus:ring-rosa-primary focus:border-rosa-primary',
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
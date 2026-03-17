import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomDropdown = ({ options, value, onChange, label, className = "", renderTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
          {label}
        </label>
      )}
      
      {renderTrigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>
          {renderTrigger(isOpen)}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-left 
            flex items-center justify-between transition-all duration-300
            hover:bg-white/10 hover:border-white/40
            ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/20 bg-white/10' : ''}
          `}
        >
          <div className="flex items-center gap-3">
            {selectedOption.icon && (
              <selectedOption.icon size={18} className="text-indigo-400" />
            )}
            <span className="text-sm font-semibold text-white">
              {selectedOption.label}
            </span>
          </div>
          <ChevronDown 
            size={18} 
            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} 
          />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile/Overlay backdrop to capture clicks and close */}
            <div 
              className="fixed inset-0 z-[105] lg:hidden" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute z-[110] w-full mt-2 bg-[#1e293b] border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10"
            >
              <div className="py-2 max-h-72 overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-all
                      ${value === option.value 
                        ? 'bg-indigo-500/20 text-indigo-300' 
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        <option.icon size={16} className={value === option.value ? 'text-indigo-400' : 'text-slate-500'} />
                      )}
                      <span className="font-semibold">{option.label}</span>
                    </div>
                    {value === option.value && (
                      <Check size={16} className="text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDropdown;

import React, { useState, useRef, useEffect, ReactNode, useMemo } from 'react';
import { ChevronDownIcon } from './icons';

interface CustomDropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: (string | CustomDropdownOption)[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  icon?: ReactNode;
  labelClassName?: string;
  buttonClassName?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, id, label, icon, labelClassName, buttonClassName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      // Delay unmounting to allow for exit animation
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 150); // Match 'animate-scale-out' duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // Only add listener when dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };
  
  const isObjectOptions = useMemo(() => options.length > 0 && typeof options[0] === 'object' && options[0] !== null, [options]);

  const displayValue = useMemo(() => {
    if (!isObjectOptions) {
        return value;
    }
    const selectedOption = (options as CustomDropdownOption[]).find(opt => opt.value === value);
    return selectedOption ? selectedOption.label : value;
  }, [value, options, isObjectOptions]);


  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium text-text-secondary mb-1 ${labelClassName}`}>
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`form-input flex items-center justify-between text-left ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 overflow-hidden">
          {icon}
          <span className="truncate">{displayValue}</span>
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isRendered && (
        <div
          className={`absolute z-10 mt-1 w-full origin-top glass-pane popover-pane !p-2 shadow-lg ${isOpen ? 'animate-scale-in' : 'animate-scale-out'}`}
          role="listbox"
        >
          <ul className="max-h-60 overflow-y-auto pr-1">
            {options.map((option, index) => {
              const optionValue = isObjectOptions ? (option as CustomDropdownOption).value : (option as string);
              const optionLabel = isObjectOptions ? (option as CustomDropdownOption).label : (option as string);
              return (
              <li
                key={index}
                onClick={() => handleSelect(optionValue)}
                className="px-3 py-2 text-sm text-text-primary rounded-md cursor-pointer hover:bg-white/10 transition-colors"
                role="option"
                aria-selected={value === optionValue}
              >
                {optionLabel}
              </li>
            )})}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
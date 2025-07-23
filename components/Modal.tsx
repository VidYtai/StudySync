import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const modalRoot = document.getElementById('modal-root');

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 200); // Corresponds to animate-modal-dialog-out duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      // Only reset overflow if no other modals are open
      setTimeout(() => {
        if (document.querySelectorAll('[role="dialog"]').length === 0) {
          document.body.style.overflow = '';
        }
      }, 200);
    };
  }, [isOpen, onClose]);

  if (!isRendered || !modalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 ${isOpen ? 'animate-fade-in' : 'animate-fade-out'}`}
        style={{ animationDuration: '0.3s' }}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`glass-pane relative w-full max-w-md p-6 overflow-y-auto ${isOpen ? 'animate-modal-dialog-in' : 'animate-modal-dialog-out'}`}
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 id="modal-title" className="text-xl font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="text-text-secondary">{children}</div>
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;
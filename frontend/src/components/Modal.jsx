import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({
  open,
  onClose,
  labelledBy,
  describedBy,
  children,
  maxWidthClass = 'max-w-md',
  closeOnOverlay = true,
  closeOnEscape = true,
  animationMs = 180,
  containerClassName = '',
  panelClassName = '',
}) => {
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeTimerRef = useRef(null);
  const pointerDownOnOverlayRef = useRef(false);
  const [isMounted, setIsMounted] = useState(open);
  const [isActive, setIsActive] = useState(open);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      const raf = requestAnimationFrame(() => setIsActive(true));
      return () => cancelAnimationFrame(raf);
    }

    setIsActive(false);
    closeTimerRef.current = setTimeout(() => {
      setIsMounted(false);
    }, animationMs);

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [open, animationMs]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarCompensation = window.innerWidth - document.documentElement.clientWidth;
    const previousActive = document.activeElement;
    document.body.style.overflow = 'hidden';
    if (scrollbarCompensation > 0) {
      document.body.style.paddingRight = `${scrollbarCompensation}px`;
    }

    const trapFocus = (event) => {
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll(
        'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onKeyDown = (event) => {
      if (closeOnEscape && event.key === 'Escape') onCloseRef.current?.();
      trapFocus(event);
    };

    document.addEventListener('keydown', onKeyDown);

    const firstFocusable = modalRef.current?.querySelector(
      '[data-autofocus], input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
    );
    if (firstFocusable instanceof HTMLElement) {
      firstFocusable.focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener('keydown', onKeyDown);
      if (previousActive instanceof HTMLElement) previousActive.focus();
    };
  }, [open, closeOnEscape]);

  if (!isMounted || !portalTarget) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] modal-overlay ${isActive ? 'modal-overlay-open' : 'modal-overlay-closed'} p-3 sm:p-4 flex items-center justify-center ${containerClassName}`}
      onPointerDown={(e) => {
        pointerDownOnOverlayRef.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        if (closeOnOverlay && pointerDownOnOverlayRef.current && e.target === e.currentTarget) {
          onClose();
        }
        pointerDownOnOverlayRef.current = false;
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`app-card modal-panel ${isActive ? 'modal-panel-open' : 'modal-panel-closed'} w-full ${maxWidthClass} text-white ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    portalTarget,
  );
};

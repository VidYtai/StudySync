
import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useTutorial } from '../contexts/TutorialContext';
import { SparklesIcon } from './icons';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const HIGHLIGHT_PADDING = 8;
const HIGHLIGHT_BORDER_RADIUS = '12px';

const TutorialPrompt: React.FC = () => {
    const { isPromptActive, activeStep, isLastStep, nextStep, endEntireTutorial } = useTutorial();
    const [targetBox, setTargetBox] = useState<Box | null>(null);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
    const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
    const popoverRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    
    const [isRendered, setIsRendered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    
    useEffect(() => {
        if (isPromptActive) {
            setIsRendered(true);
            const timer = setTimeout(() => setIsAnimating(true), 10); 
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsRendered(false), 500); 
            return () => clearTimeout(timer);
        }
    }, [isPromptActive]);

    
    const updatePosition = () => {
        if (!activeStep || !popoverRef.current) return;

        const PADDING = 16;
        const ARROW_SIZE = 12;
        const POPOVER_WIDTH = 288; 

        const element = activeStep.selector ? document.querySelector(activeStep.selector) : null;
        const tBox = element ? element.getBoundingClientRect() : null;
        
        if (activeStep.placement === 'center' || !tBox) {
            setTargetBox(null);
            const popoverHeight = popoverRef.current?.offsetHeight || 200;
            setPopoverStyle({
                top: `calc(50% - ${popoverHeight / 2}px)`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: POPOVER_WIDTH,
            });
            setArrowStyle({ display: 'none' });
            return;
        }

        setTargetBox({ top: tBox.top, left: tBox.left, width: tBox.width, height: tBox.height });

        const popoverHeight = popoverRef.current.offsetHeight;

        
        let finalPlacement = activeStep.placement || 'bottom';
        const canPlace = {
            top: tBox.top - popoverHeight - PADDING > 0,
            bottom: tBox.bottom + popoverHeight + PADDING < window.innerHeight,
            left: tBox.left - POPOVER_WIDTH - PADDING > 0,
            right: tBox.right + POPOVER_WIDTH + PADDING < window.innerWidth
        };
        
        
        if (finalPlacement === 'top' && !canPlace.top) {
            finalPlacement = 'bottom';
        } else if (finalPlacement === 'bottom' && !canPlace.bottom) {
            finalPlacement = 'top';
        } else if (finalPlacement === 'left' && !canPlace.left) {
            finalPlacement = 'right';
        } else if (finalPlacement === 'right' && !canPlace.right) {
            finalPlacement = 'left';
        }


        let idealTop = 0;
        let idealLeft = 0;
        let arrowTop = 0;
        let arrowLeft = 0;
        let arrowRotation = 0;

        switch (finalPlacement) {
            case 'top':
                idealTop = tBox.top - popoverHeight - PADDING;
                idealLeft = tBox.left + tBox.width / 2 - POPOVER_WIDTH / 2;
                arrowTop = popoverHeight - ARROW_SIZE / 2;
                arrowRotation = 180;
                break;
            case 'left':
                idealTop = tBox.top + tBox.height / 2 - popoverHeight / 2;
                idealLeft = tBox.left - POPOVER_WIDTH - PADDING;
                arrowLeft = POPOVER_WIDTH - ARROW_SIZE / 2;
                arrowRotation = 90;
                break;
            case 'right':
                idealTop = tBox.top + tBox.height / 2 - popoverHeight / 2;
                idealLeft = tBox.left + tBox.width + PADDING;
                arrowLeft = -ARROW_SIZE / 2;
                arrowRotation = -90;
                break;
            case 'bottom':
            default:
                idealTop = tBox.top + tBox.height + PADDING;
                idealLeft = tBox.left + tBox.width / 2 - POPOVER_WIDTH / 2;
                arrowTop = -ARROW_SIZE / 2;
                arrowRotation = 0;
                break;
        }

        
        if (idealLeft < PADDING) idealLeft = PADDING;
        if (idealLeft + POPOVER_WIDTH > window.innerWidth - PADDING) idealLeft = window.innerWidth - POPOVER_WIDTH - PADDING;
        
        if (idealTop < PADDING) idealTop = PADDING;
        if (idealTop + popoverHeight > window.innerHeight - PADDING) idealTop = window.innerHeight - popoverHeight - PADDING;

        
        if (finalPlacement === 'top' || finalPlacement === 'bottom') {
            arrowLeft = tBox.left + tBox.width / 2 - idealLeft - ARROW_SIZE / 2;
            arrowLeft = Math.max(ARROW_SIZE, Math.min(arrowLeft, POPOVER_WIDTH - ARROW_SIZE * 2));
        } else { 
            arrowTop = tBox.top + tBox.height / 2 - idealTop - ARROW_SIZE / 2;
            arrowTop = Math.max(ARROW_SIZE, Math.min(arrowTop, popoverHeight - ARROW_SIZE * 2));
        }
        
        setPopoverStyle({ top: `${idealTop}px`, left: `${idealLeft}px`, width: `${POPOVER_WIDTH}px` });
        setArrowStyle({ top: `${arrowTop}px`, left: `${arrowLeft}px`, transform: `rotate(${arrowRotation}deg)` });
    };

    useLayoutEffect(() => {
        if (!isPromptActive || !activeStep) {
            setTargetBox(null);
            return;
        }

        let poller: ReturnType<typeof setInterval>;
        let timeout: ReturnType<typeof setTimeout>;
        let mainContent: Element | null = null;
        
        const setupPositioning = () => {
            updatePosition();
            mainContent = document.querySelector('.main-content');
            window.addEventListener('resize', updatePosition);
            mainContent?.addEventListener('scroll', updatePosition, { passive: true });
        };
        
        const onElementFound = (element: Element) => {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
            setTimeout(() => setupPositioning(), 350);
        };
        
        if (activeStep.placement === 'center' || !activeStep.selector) {
            setupPositioning();
            return;
        }
        
        const findElement = () => {
            const element = document.querySelector(activeStep.selector);
            if (element) {
                clearInterval(poller);
                clearTimeout(timeout);
                onElementFound(element);
            }
        };

        poller = setInterval(findElement, 100);
        timeout = setTimeout(() => {
            clearInterval(poller);
            console.warn("Tutorial target element not found:", activeStep.selector);
            setTargetBox(null); 
            setupPositioning();
        }, 3000);

        return () => {
            clearInterval(poller);
            clearTimeout(timeout);
            window.removeEventListener('resize', updatePosition);
            mainContent?.removeEventListener('scroll', updatePosition);
        };
    }, [isPromptActive, activeStep, location.pathname]);
    
    
    useLayoutEffect(() => {
        if (popoverRef.current) {
            updatePosition();
        }
    }, [activeStep?.content]);

    if (!isRendered || !activeStep) return null;

    if (activeStep.isWelcome) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" aria-live="polite">
                <div className={`fixed inset-0 bg-black/70 ${isAnimating ? 'animate-fade-in' : 'animate-fade-out'}`} style={{animationDuration: '0.4s'}} />
                <div
                    className={`relative glass-pane p-8 w-full max-w-lg text-center ${isAnimating ? 'animate-modal-dialog-in' : 'animate-modal-dialog-out'}`}
                    role="dialog" aria-labelledby="tutorial-title"
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center">
                        <SparklesIcon className="w-8 h-8 text-primary-accent" />
                    </div>
                    <h3 id="tutorial-title" className="text-2xl font-bold text-text-primary mb-2">{activeStep.title}</h3>
                    <p id="tutorial-content" className="text-base text-text-secondary max-w-md mx-auto">{activeStep.content}</p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8">
                        <button onClick={endEntireTutorial} className="btn btn-secondary w-full sm:w-auto">Skip Tour</button>
                        <button onClick={nextStep} className="btn btn-primary w-full sm:w-auto">
                            Let's Go!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none" aria-live="polite">
            {targetBox ? (
                 <div
                    style={{
                        position: 'fixed',
                        top: targetBox.top - HIGHLIGHT_PADDING,
                        left: targetBox.left - HIGHLIGHT_PADDING,
                        width: targetBox.width + HIGHLIGHT_PADDING * 2,
                        height: targetBox.height + HIGHLIGHT_PADDING * 2,
                        borderRadius: HIGHLIGHT_BORDER_RADIUS,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                        transition: `all 0.7s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.4s ease-in-out`,
                        opacity: isAnimating ? 1 : 0,
                        pointerEvents: 'none',
                        zIndex: 200,
                    }}
                />
            ) : (
                <div
                    className={`fixed inset-0 z-[200] pointer-events-auto`}
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        transition: 'opacity 0.4s ease-in-out',
                        opacity: isAnimating ? 1 : 0,
                    }}
                />
            )}
           
            <div
                ref={popoverRef}
                className={`absolute glass-pane popover-pane p-4 w-72 z-[201] pointer-events-auto ${isAnimating ? 'animate-scale-in' : 'animate-scale-out'}`}
                style={{ ...popoverStyle, transition: 'top 0.7s cubic-bezier(0.65, 0, 0.35, 1), left 0.7s cubic-bezier(0.65, 0, 0.35, 1)' }}
                role="dialog"
                aria-labelledby="tutorial-title"
                aria-describedby="tutorial-content"
            >
                 {targetBox && (
                    <div
                        className="absolute w-3 h-3 bg-[rgba(30,30,32,0.92)]"
                        style={{ ...arrowStyle, transition: 'top 0.7s cubic-bezier(0.65, 0, 0.35, 1), left 0.7s cubic-bezier(0.65, 0, 0.35, 1)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', opacity: isAnimating ? 1 : 0 }}
                    />
                 )}
                <h3 id="tutorial-title" className="text-lg font-bold text-text-primary mb-2">{activeStep.title}</h3>
                <p id="tutorial-content" className="text-sm text-text-secondary">{activeStep.content}</p>
                <div className="flex justify-between items-center mt-4">
                    <button onClick={endEntireTutorial} className="btn btn-secondary !py-1 !px-3 text-xs">Skip Tour</button>
                    <button onClick={nextStep} className="btn btn-primary !py-1 !px-3 text-xs">
                        {isLastStep ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialPrompt;

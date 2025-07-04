export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private announcements: HTMLElement;

  constructor() {
    this.createAnnouncementRegion();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private createAnnouncementRegion() {
    // Create screen reader announcement region
    this.announcements = document.createElement('div');
    this.announcements.setAttribute('aria-live', 'polite');
    this.announcements.setAttribute('aria-atomic', 'true');
    this.announcements.style.position = 'absolute';
    this.announcements.style.left = '-10000px';
    this.announcements.style.width = '1px';
    this.announcements.style.height = '1px';
    this.announcements.style.overflow = 'hidden';
    document.body.appendChild(this.announcements);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.announcements.setAttribute('aria-live', priority);
    this.announcements.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      this.announcements.textContent = '';
    }, 1000);
  }

  announceScore(score: number) {
    this.announce(`Score: ${score.toLocaleString()}`);
  }

  announceLevel(level: number) {
    this.announce(`Level ${level} started`, 'assertive');
  }

  announceGameOver(finalScore: number, level: number) {
    this.announce(`Game Over. Final score: ${finalScore.toLocaleString()}. Level reached: ${level}`, 'assertive');
  }

  announceAreaCompleted(areaFilled: number) {
    this.announce(`Area completed! ${areaFilled.toFixed(1)}% filled`);
  }

  announceHighScore() {
    this.announce('New high score achieved!', 'assertive');
  }

  // Keyboard navigation helpers
  static addKeyboardNavigation(element: HTMLElement, onActivate: () => void) {
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');
    
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    });
  }

  // Focus management
  static trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });

    // Focus first element
    firstElement?.focus();
  }
}

export const accessibilityManager = AccessibilityManager.getInstance();
export class KeyboardNavigation {
  constructor(sistema) {
      this.sistema = sistema;
      this.currentFocusMode = 'menu';
      this.menuButtons = Array.from(document.querySelectorAll('#menu button'));
      this.currentMenuIndex = 0;
      this.currentContentFocusIndex = 0;

      this.initializeKeyboardNavigation();
  }

  initializeKeyboardNavigation() {
      document.addEventListener('keydown', (event) => {
          const activeElement = document.activeElement;
          
          // More comprehensive keyboard handling
          switch(event.key) {
              case 'Enter':
                  this.handleEnterKey(event);
                  break;
              case 'Escape':
                  this.handleEscapeKey(event);
                  break;
              case 'ArrowDown':
              case 'ArrowUp':
              case 'ArrowLeft':
              case 'ArrowRight':
                  this.handleNavigationKeys(event);
                  break;
          }
      });

      // Improve mouse interaction
      this.menuButtons.forEach((button, index) => {
          button.addEventListener('click', () => {
              this.currentMenuIndex = index;
              this.currentFocusMode = 'menu';
              const screen = button.getAttribute('data-screen');
              this.sistema.showScreen(screen);
          });
      });
  }

  handleEnterKey(event) {
      const activeElement = document.activeElement;
      
      // If button is focused, trigger its click
      if (activeElement.tagName === 'BUTTON') {
          event.preventDefault();
          activeElement.click();
          return;
      }

      // Prevent form submission reset
      if (activeElement.closest('form')) {
          event.preventDefault();
      }
  }

  handleEscapeKey(event) {
      const activeElement = document.activeElement;
      
      // If an input is focused, blur it
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(activeElement.tagName)) {
          activeElement.blur();
          
          // Return focus to the last active menu button
          const menuButtons = document.querySelectorAll('#menu button');
          menuButtons[this.currentMenuIndex].focus();
          
          event.preventDefault();
          return;
      }
      
      // If in content, return to menu
      if (this.currentFocusMode === 'content') {
          this.returnToMenu();
          event.preventDefault();
      }
  }

  handleNavigationKeys(event) {
      // Only intervene if no input is currently focused
      const activeElement = document.activeElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement?.tagName);
      
      if (isInputFocused) {
          // Allow navigation within form elements
          if (event.key === 'Escape') {
              activeElement.blur(); // Remove focus from input
              this.returnToMenu();
          }
          return;
      }

      switch(event.key) {
          case 'ArrowDown':
              this.navigateDown(event);
              break;
          case 'ArrowUp':
              this.navigateUp(event);
              break;
          case 'ArrowRight':
              this.navigateRight(event);
              break;
          case 'ArrowLeft':
              this.navigateLeft(event);
              break;
      }
  }

  navigateDown(event) {
      event.preventDefault();
      if (this.currentFocusMode === 'menu') {
          // Navigate menu buttons
          this.currentMenuIndex = (this.currentMenuIndex + 1) % this.menuButtons.length;
          this.menuButtons[this.currentMenuIndex].focus();
      } else if (this.currentFocusMode === 'content') {
          // Navigate content elements
          const focusableElements = this.getFocusableContentElements();
          if (focusableElements.length > 0) {
              this.currentContentFocusIndex = (this.currentContentFocusIndex + 1) % focusableElements.length;
              focusableElements[this.currentContentFocusIndex].focus();
          }
      }
  }

  navigateUp(event) {
      event.preventDefault();
      if (this.currentFocusMode === 'menu') {
          // Navigate menu buttons
          this.currentMenuIndex = (this.currentMenuIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
          this.menuButtons[this.currentMenuIndex].focus();
      } else if (this.currentFocusMode === 'content') {
          // Navigate content elements
          const focusableElements = this.getFocusableContentElements();
          if (focusableElements.length > 0) {
              this.currentContentFocusIndex = (this.currentContentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
              focusableElements[this.currentContentFocusIndex].focus();
          }
      }
  }

  navigateRight(event) {
      event.preventDefault();
      if (this.currentFocusMode === 'menu') {
          this.currentFocusMode = 'content';
          const focusableElements = this.getFocusableContentElements();
          if (focusableElements.length > 0) {
              this.currentContentFocusIndex = 0;
              focusableElements[0].focus();
          }
      } else if (this.currentFocusMode === 'content') {
          // If in content, try to move to next input/button
          const focusableElements = this.getFocusableContentElements();
          if (focusableElements.length > 0) {
              this.currentContentFocusIndex = (this.currentContentFocusIndex + 1) % focusableElements.length;
              focusableElements[this.currentContentFocusIndex].focus();
          }
      }
  }

  navigateLeft(event) {
      event.preventDefault();
      if (this.currentFocusMode === 'content') {
          // Check if we're at the first focusable element
          const focusableElements = this.getFocusableContentElements();
          if (this.currentContentFocusIndex === 0) {
              // If at first element, return to menu
              this.returnToMenu();
          } else {
              // Otherwise, move to previous element
              this.currentContentFocusIndex--;
              focusableElements[this.currentContentFocusIndex].focus();
          }
      }
  }

  returnToMenu() {
      this.currentFocusMode = 'menu';
      this.menuButtons[this.currentMenuIndex].focus();
  }

  getFocusableContentElements() {
      const content = document.getElementById('content');
      return Array.from(content.querySelectorAll(
          'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.disabled && el.offsetParent !== null);
  }
}
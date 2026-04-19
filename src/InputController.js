export class InputController {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
    };
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.isLocked = false;

    document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
    document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
  }

  onMouseMove(e) {
    if (!this.isLocked) return;

    this.mouseX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    this.mouseY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = true; break;
      case 'KeyA': this.keys.left = true; break;
      case 'KeyS': this.keys.backward = true; break;
      case 'KeyD': this.keys.right = true; break;
      case 'Space': this.keys.space = true; break;
      case 'ShiftLeft': this.keys.shift = true; break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = false; break;
      case 'KeyA': this.keys.left = false; break;
      case 'KeyS': this.keys.backward = false; break;
      case 'KeyD': this.keys.right = false; break;
      case 'Space': this.keys.space = false; break;
      case 'ShiftLeft': this.keys.shift = false; break;
    }
  }
  
  consumeMouseMovement() {
    const mx = this.mouseX;
    const my = this.mouseY;
    this.mouseX = 0;
    this.mouseY = 0;
    return { x: mx, y: my };
  }
}

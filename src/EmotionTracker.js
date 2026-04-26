import { EMOTIONS } from './EmotionSystem.js';

export class EmotionTracker {
    constructor(emotionSystem, player) {
        this.emotionSystem = emotionSystem;
        this.player = player;
        
        this.idleTimer = 0;
        this.continuousMovementTimer = 0;
        this.frequentStopsCounter = 0;
        this.stopResetTimer = 0;
        this.fallCounter = 0;
        
        this.lastPosition = player.mesh.position.clone();
        this.wasMoving = false;
        
        this.boredomEventTriggered = false;
    }
    
    notifyFall() {
        this.fallCounter += 1;
        // Check frustration
        if (this.fallCounter >= 2) {
            this.setTargetEmotion(EMOTIONS.FRUSTRATION);
            // Reset after some time happens naturally? Let's bleed this over time.
        }
    }

    setTargetEmotion(emotion) {
        if (this.emotionSystem.targetState !== emotion) {
            console.log("Emotion shifting to: " + emotion);
            this.emotionSystem.setEmotion(emotion);
        }
    }

    update(delta) {
        // Bleed off fall counter slowly
        if (this.fallCounter > 0) {
            this.fallCounter -= delta * 0.05; // takes 20 seconds to forget 1 fall
        }

        const isMoving = this.player.velocity.lengthSq() > 1.0;
        
        // Boredom Logic
        if (!isMoving && this.player.onGround) {
            this.idleTimer += delta;
            this.continuousMovementTimer = 0;
            
            if (this.idleTimer > 8) { // Transition to boredom after 8s
                this.setTargetEmotion(EMOTIONS.BOREDOM);
            }
            if (this.idleTimer > 15 && !this.boredomEventTriggered && this.emotionSystem.targetState === EMOTIONS.BOREDOM) {
                // Dramatic event!
                this.boredomEventTriggered = true;
                this.triggerDramaticEvent();
            }
        } else {
            this.idleTimer = 0;
            this.boredomEventTriggered = false;
        }

        // Anxiety Logic (Hesitant movement)
        if (this.wasMoving && !isMoving) {
            this.frequentStopsCounter++;
            this.stopResetTimer = 5.0; // 5 seconds to reset stop counter
        }
        
        if (this.stopResetTimer > 0) {
            this.stopResetTimer -= delta;
            if (this.stopResetTimer <= 0) {
                this.frequentStopsCounter = 0;
            }
        }
        
        if (this.frequentStopsCounter > 3 && this.fallCounter < 2) {
            this.setTargetEmotion(EMOTIONS.ANXIETY);
        }

        // Excitement / Flow Logic
        if (isMoving && this.player.onGround) {
            this.continuousMovementTimer += delta;
            
            if (this.continuousMovementTimer > 12 && this.fallCounter < 1 && this.frequentStopsCounter < 2) {
                this.setTargetEmotion(EMOTIONS.EXCITEMENT);
            } else if (this.continuousMovementTimer > 3 && this.emotionSystem.targetState === EMOTIONS.BOREDOM) {
                // Wake up from boredom naturally
                this.setTargetEmotion(EMOTIONS.HAPPY);
            }
        } else if (!isMoving) {
            this.continuousMovementTimer = 0;
        }

        // Default back to Happy
        if (this.fallCounter < 1 && 
            this.frequentStopsCounter < 2 && 
            this.idleTimer < 5 && 
            this.continuousMovementTimer < 10) {
            
            // If we are coming from Anxiety or Frustration, and conditions stabilize, go back to Happy
            if (this.emotionSystem.targetState === EMOTIONS.ANXIETY || 
                this.emotionSystem.targetState === EMOTIONS.FRUSTRATION) {
                this.setTargetEmotion(EMOTIONS.HAPPY);
            }
        }
        
        this.wasMoving = isMoving;
    }

    triggerDramaticEvent() {
        console.log("BOREDOM INTERRUPTED: Dramatic Event!");
        // We blow the player up into the air with a gust of wind
        this.player.velocity.y += 40;
        this.setTargetEmotion(EMOTIONS.EXCITEMENT);
        this.idleTimer = 0; // reset
    }
}

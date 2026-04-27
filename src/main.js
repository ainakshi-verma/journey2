import { App } from './App.js';

window.addEventListener('DOMContentLoaded', () => {
    const app = new App();

    // UI Elements
    const startScreen = document.getElementById('start-screen');
    const beginBtn = document.getElementById('begin-btn');
    const demoBtn = document.getElementById('demo-btn');
    const appCanvas = document.getElementById('app');

    const empBtns = document.querySelectorAll('.emp-btn');
    const webcamBtn = document.getElementById('webcam-scan-btn');
    const webcamStatus = document.getElementById('webcam-status');
    const webcamVideo = document.getElementById('webcam-video');
    const emotionConfirm = document.getElementById('emotion-confirmation');
    const confirmBtn = document.getElementById('confirm-emotion-btn');
    const rejectBtn = document.getElementById('reject-emotion-btn');

    let streamRef = null;
    function stopWebcam() {
        if (streamRef) {
            streamRef.getTracks().forEach(track => track.stop());
            streamRef = null;
        }
    }

    let lockedEmotion = null;

    // Emotion Selection via Buttons
    empBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if (!lockedEmotion) {
                const emotion = btn.getAttribute('data-emotion');
                app.emotionSystem.setEmotion(emotion);
            }
        });

        btn.addEventListener('click', () => {
            empBtns.forEach(b => b.style.boxShadow = 'none');
            btn.style.boxShadow = '0 0 15px var(--glow-color)';
            
            const emotion = btn.getAttribute('data-emotion');
            lockedEmotion = emotion; // Lock it in so mouseenter doesn't overwrite it!
            app.emotionSystem.setEmotion(emotion);
            beginBtn.classList.remove('invisible');
            
            emotionConfirm.classList.add('hidden');
            webcamStatus.classList.add('hidden');
            webcamBtn.classList.remove('hidden');
            stopWebcam();
        });
    });

    // Webcam scanning
    webcamBtn.addEventListener('click', async () => {
        try {
            webcamBtn.classList.add('hidden');
            webcamStatus.classList.remove('hidden');
            webcamVideo.classList.remove('hidden');
            beginBtn.classList.add('invisible');

            streamRef = await navigator.mediaDevices.getUserMedia({ video: true });
            webcamVideo.srcObject = streamRef;
            
            setTimeout(() => {
                 const emotions = ['HAPPY', 'EXCITEMENT', 'BOREDOM', 'FRUSTRATION', 'ANXIETY'];
                 const picked = emotions[Math.floor(Math.random() * emotions.length)];
                 webcamStatus.innerText = `Scan complete! Sensed: ${picked}`;
                 lockedEmotion = picked;
                 app.emotionSystem.setEmotion(picked);
                 
                 empBtns.forEach(b => b.style.boxShadow = 'none');
                 document.querySelector(`[data-emotion="${picked}"]`).style.boxShadow = '0 0 15px var(--glow-color)';
                 
                 emotionConfirm.classList.remove('hidden');
                 stopWebcam();
                 webcamVideo.classList.add('hidden');
            }, 3000);
        } catch (err) {
            webcamStatus.innerText = "Camera declined. Select a mood manually.";
            stopWebcam();
            webcamVideo.classList.add('hidden');
        }
    });

    confirmBtn.addEventListener('click', () => {
        emotionConfirm.classList.add('hidden');
        beginBtn.classList.remove('invisible');
    });

    rejectBtn.addEventListener('click', () => {
        emotionConfirm.classList.add('hidden');
        webcamStatus.classList.add('hidden');
        webcamBtn.classList.remove('hidden');
        beginBtn.classList.add('invisible');
        empBtns.forEach(b => b.style.boxShadow = 'none');
    });

    // Debug Keys 1-5 to force emotion instantly anywhere
    document.addEventListener('keydown', (e) => {
        const keyMap = {
            'Digit1': 'FRUSTRATION',
            'Digit2': 'BOREDOM',
            'Digit3': 'EXCITEMENT',
            'Digit4': 'ANXIETY',
            'Digit5': 'HAPPY'
        };
        if (keyMap[e.code]) {
            app.emotionSystem.setEmotion(keyMap[e.code]);
        }
    });

    // Preview / Demo mode
    demoBtn.addEventListener('click', () => {
        startScreen.classList.remove('active');
        setTimeout(() => { startScreen.classList.add('hidden'); }, 1000);
        appCanvas.classList.remove('blurred');
        app.requestPointerLock();
    });

    // Begin Gameplay
    beginBtn.addEventListener('click', () => {
        startScreen.classList.remove('active');
        setTimeout(() => { startScreen.classList.add('hidden'); }, 1000);
        appCanvas.classList.remove('blurred');
        app.requestPointerLock();
    });

    // Return to Menu from Pause
    const backHomeBtn = document.getElementById('back-home-btn');
    backHomeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent re-triggering pointer lock

        // Hide pause instructions
        document.getElementById('instructions').classList.add('hidden');
        
        // Show start screen again
        startScreen.classList.remove('hidden');
        setTimeout(() => startScreen.classList.add('active'), 50);
        
        // Blur the game in background
        appCanvas.classList.add('blurred');
        
        // Force unlock if glitching
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    });
});

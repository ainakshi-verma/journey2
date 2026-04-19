import { App } from './App.js';

window.addEventListener('DOMContentLoaded', () => {
    const app = new App();

    // UI Elements
    const startScreen = document.getElementById('start-screen');
    const beginBtn = document.getElementById('begin-btn');
    const empBtns = document.querySelectorAll('.emp-btn');
    const webcamBtn = document.getElementById('webcam-scan-btn');
    const webcamStatus = document.getElementById('webcam-status');
    const webcamVideo = document.getElementById('webcam-video');
    const emotionConfirm = document.getElementById('emotion-confirmation');
    const confirmBtn = document.getElementById('confirm-emotion-btn');
    const rejectBtn = document.getElementById('reject-emotion-btn');
    const appCanvas = document.getElementById('app');

    // Emotion Selection Option A (Buttons)
    empBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const emotion = btn.getAttribute('data-emotion');
            app.emotionSystem.setEmotion(emotion);
        });

        btn.addEventListener('click', () => {
            empBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            const emotion = btn.getAttribute('data-emotion');
            app.emotionSystem.setEmotion(emotion);
            beginBtn.classList.remove('hidden');
            
            // Cleanup webcam junk if clicking manual
            emotionConfirm.classList.add('hidden');
            webcamStatus.classList.add('hidden');
            webcamBtn.classList.remove('hidden');
            stopWebcam();
        });
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

    // Emotion Selection Option B (Webcam Simulation)
    let streamRef = null;
    webcamBtn.addEventListener('click', async () => {
        try {
            webcamBtn.classList.add('hidden');
            webcamStatus.classList.remove('hidden');
            webcamVideo.classList.remove('hidden');

            streamRef = await navigator.mediaDevices.getUserMedia({ video: true });
            webcamVideo.srcObject = streamRef;
            
            // Wait 3 seconds to "scan"
            setTimeout(() => {
                 const emotions = ['HAPPY', 'EXCITEMENT', 'BOREDOM', 'FRUSTRATION', 'ANXIETY'];
                 const picked = emotions[Math.floor(Math.random() * emotions.length)];
                 
                 webcamStatus.innerText = `Scan complete. We sense ${picked.toLowerCase()}.`;
                 app.emotionSystem.setEmotion(picked);
                 
                 // Light up button
                 empBtns.forEach(b => b.classList.remove('selected'));
                 document.querySelector(`[data-emotion="${picked}"]`).classList.add('selected');
                 
                 emotionConfirm.classList.remove('hidden');
                 stopWebcam();
                 webcamVideo.classList.add('hidden');
            }, 3000);

        } catch (err) {
            webcamStatus.innerText = "Camera declined. Please select an emotion.";
            stopWebcam();
        }
    });

    confirmBtn.addEventListener('click', () => {
        emotionConfirm.classList.add('hidden');
        beginBtn.classList.remove('hidden');
    });

    rejectBtn.addEventListener('click', () => {
        emotionConfirm.classList.add('hidden');
        webcamStatus.classList.add('hidden');
        webcamBtn.classList.remove('hidden');
        
        // Let user select manually
        beginBtn.classList.add('hidden');
        empBtns.forEach(b => b.classList.remove('selected'));
        app.emotionSystem.setEmotion('HAPPY'); // Revert base
    });

    function stopWebcam() {
        if (streamRef) {
            streamRef.getTracks().forEach(track => track.stop());
            streamRef = null;
        }
    }

    // Begin Gameplay
    beginBtn.addEventListener('click', () => {
        startScreen.classList.remove('active');
        setTimeout(() => {
             startScreen.classList.add('hidden');
        }, 1000);
        
        appCanvas.classList.remove('blurred');
        
        // Initial pointer lock request
        app.requestPointerLock();
    });
});

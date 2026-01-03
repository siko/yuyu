// 音效系统
let audioContext = null;
let soundEnabled = true;

// 初始化音频上下文（需要用户交互后）
function initAudio() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
            soundEnabled = false;
        }
    }
}

// 在用户第一次交互时初始化音频
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });

// 生成音效函数
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    if (!soundEnabled || !audioContext) return;
    
    try {
        // 如果音频上下文被暂停，恢复它
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('Audio error:', e);
    }
}

// 音效库
const sounds = {
    // 发射子弹
    shoot: () => {
        playSound(800, 0.1, 'square', 0.2);
    },
    
    // 击中障碍
    hit: () => {
        playSound(400, 0.15, 'sine', 0.25);
        playSound(600, 0.1, 'sine', 0.2);
    },
    
    // 击中TNT爆炸
    explosion: () => {
        // 爆炸音效 - 多个频率叠加
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                playSound(100 + i * 50, 0.2, 'sawtooth', 0.3);
            }, i * 20);
        }
        // 低音爆炸
        playSound(80, 0.3, 'square', 0.4);
    },
    
    // 碰撞
    crash: () => {
        playSound(200, 0.4, 'sawtooth', 0.5);
        playSound(150, 0.3, 'square', 0.4);
    },
    
    // 关卡完成
    levelComplete: () => {
        // 上升音阶
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, i) => {
            setTimeout(() => {
                playSound(freq, 0.2, 'sine', 0.3);
            }, i * 150);
        });
    },
    
    // 游戏胜利
    victory: () => {
        // 胜利音效 - 上升音阶
        const notes = [523, 659, 784, 1047, 1319]; // C, E, G, C, E
        notes.forEach((freq, i) => {
            setTimeout(() => {
                playSound(freq, 0.25, 'sine', 0.35);
            }, i * 120);
        });
    },
    
    // 游戏结束
    gameOver: () => {
        // 下降音阶
        const notes = [523, 440, 349, 262]; // C, A, F, C
        notes.forEach((freq, i) => {
            setTimeout(() => {
                playSound(freq, 0.3, 'sine', 0.4);
            }, i * 200);
        });
    },
    
    // 连击
    combo: (count) => {
        const freq = 600 + (count * 50);
        playSound(freq, 0.15, 'sine', 0.3);
    },
    
    // 按钮点击
    button: () => {
        playSound(600, 0.1, 'sine', 0.2);
    }
};


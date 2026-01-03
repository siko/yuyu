// 游戏主逻辑
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

// 游戏状态
let gameRunning = false;
let gamePaused = false;
let currentLevel = 1;
let score = 0;
let totalReward = 0;
let selectedCarIndex = 0;
let gameTime = 0;
let levelStartTime = 0;
let barriersPassed = 0;
let comboCount = 0;  // 连击数
let lastHitTime = 0;  // 上次击中的时间
let currentPhase = 0;  // 当前阶段
let levelTheme = null;  // 当前关卡主题

// 赛车样式配置
const carStyles = [
    { emoji: '🚗', color: '#ff6b6b', name: '红色轿车' },
    { emoji: '🏎️', color: '#feca57', name: '跑车' },
    { emoji: '🚙', color: '#4ecdc4', name: 'SUV' },
    { emoji: '🚕', color: '#ff9ff3', name: '出租车' },
    { emoji: '🚓', color: '#54a0ff', name: '警车' }
];

// 赛车
const car = {
    x: 380,  // 初始位置在底部中央
    y: 450,  // 固定在底部
    width: 40,
    height: 25,
    speed: 6,
    color: '#ff6b6b'
};

// 屏障数组
let barriers = [];

// 子弹数组
let bullets = [];

// TNT爆炸障碍数组
let tntObstacles = [];

// 爆炸效果数组
let explosions = [];

// 按键状态
const keys = {
    left: false,
    right: false,
    space: false
};

// 子弹发射冷却
let bulletCooldown = 0;
const bulletCooldownTime = 200;  // 200ms冷却时间

// 屏障生成计时器
let barrierSpawnTimer = 0;
let lastFrameTime = 0;

// TNT生成计时器
let tntSpawnTimer = 0;

// 关卡主题配置
const levelThemes = {
    training: {
        name: '新手训练',
        description: '慢速障碍，熟悉操作',
        bgColor: '#2d3436',
        roadColor: 'rgba(100, 100, 100, 0.4)',
        accentColor: '#4ecdc4'
    },
    speed: {
        name: '速度挑战',
        description: '高速障碍，考验反应',
        bgColor: '#1a1a2e',
        roadColor: 'rgba(255, 107, 107, 0.3)',
        accentColor: '#ff6b6b'
    },
    dense: {
        name: '密集模式',
        description: '大量障碍，密集来袭',
        bgColor: '#16213e',
        roadColor: 'rgba(254, 202, 87, 0.3)',
        accentColor: '#feca57'
    },
    mixed: {
        name: '混合模式',
        description: '多种障碍混合出现',
        bgColor: '#2d1b3d',
        roadColor: 'rgba(255, 159, 243, 0.3)',
        accentColor: '#ff9ff3'
    },
    wave: {
        name: '波浪模式',
        description: '障碍成波浪式出现',
        bgColor: '#1e3a5f',
        roadColor: 'rgba(84, 160, 255, 0.3)',
        accentColor: '#54a0ff'
    },
    extreme: {
        name: '极限模式',
        description: '高速+高密度，极限挑战',
        bgColor: '#3d1a1a',
        roadColor: 'rgba(255, 71, 87, 0.4)',
        accentColor: '#ff4757'
    },
    boss: {
        name: '终极Boss',
        description: '所有机制叠加，最终挑战',
        bgColor: '#1a1a1a',
        roadColor: 'rgba(255, 215, 0, 0.4)',
        accentColor: '#ffd700'
    }
};

// 障碍类型配置
const barrierTypes = {
    small: { width: 80, height: 25, speed: 1.2, color: '#ff6b6b', score: 30 },
    medium: { width: 120, height: 30, speed: 1.0, color: '#ff6b6b', score: 50 },
    large: { width: 180, height: 35, speed: 0.8, color: '#ee5a6f', score: 70 },
    fast: { width: 100, height: 25, speed: 1.5, color: '#ff4757', score: 60 },
    slow: { width: 150, height: 30, speed: 0.6, color: '#ff6b6b', score: 40 }
};

// 7个关卡设计 - 多样化机制
const levels = [
    // 第1关 - 新手训练：慢速、少量障碍
    {
        name: '新手训练',
        theme: 'training',
        reward: 100,
        duration: 30000,
        phases: [
            { startTime: 0, barrierSpawnRate: 2500, barrierTypes: ['medium', 'slow'], tntSpawnRate: 6000, tntCount: 1 },
            { startTime: 15000, barrierSpawnRate: 2000, barrierTypes: ['medium', 'small'], tntSpawnRate: 5000, tntCount: 2 }
        ],
        targetBarriers: 10,
        tntCount: 2
    },
    // 第2关 - 速度挑战：高速障碍
    {
        name: '速度挑战',
        theme: 'speed',
        reward: 200,
        duration: 40000,
        phases: [
            { startTime: 0, barrierSpawnRate: 1800, barrierTypes: ['fast', 'small'], tntSpawnRate: 4500, tntCount: 2 },
            { startTime: 20000, barrierSpawnRate: 1500, barrierTypes: ['fast', 'medium'], tntSpawnRate: 4000, tntCount: 3 }
        ],
        targetBarriers: 15,
        tntCount: 4
    },
    // 第3关 - 密集模式：大量障碍
    {
        name: '密集模式',
        theme: 'dense',
        reward: 300,
        duration: 50000,
        phases: [
            { startTime: 0, barrierSpawnRate: 1200, barrierTypes: ['small', 'medium'], tntSpawnRate: 4000, tntCount: 3 },
            { startTime: 25000, barrierSpawnRate: 1000, barrierTypes: ['small', 'medium', 'large'], tntSpawnRate: 3500, tntCount: 4 }
        ],
        targetBarriers: 20,
        tntCount: 6
    },
    // 第4关 - 混合模式：多种障碍混合
    {
        name: '混合模式',
        theme: 'mixed',
        reward: 500,
        duration: 60000,
        phases: [
            { startTime: 0, barrierSpawnRate: 1500, barrierTypes: ['medium', 'fast'], tntSpawnRate: 3500, tntCount: 4 },
            { startTime: 20000, barrierSpawnRate: 1200, barrierTypes: ['small', 'medium', 'fast'], tntSpawnRate: 3000, tntCount: 5 },
            { startTime: 40000, barrierSpawnRate: 1000, barrierTypes: ['small', 'medium', 'large', 'fast'], tntSpawnRate: 2500, tntCount: 6 }
        ],
        targetBarriers: 25,
        tntCount: 8
    },
    // 第5关 - 波浪模式：节奏性出现
    {
        name: '波浪模式',
        theme: 'wave',
        reward: 1000,
        duration: 70000,
        phases: [
            { startTime: 0, barrierSpawnRate: 1000, barrierTypes: ['medium', 'large'], tntSpawnRate: 3000, tntCount: 5 },
            { startTime: 23000, barrierSpawnRate: 800, barrierTypes: ['fast', 'medium'], tntSpawnRate: 2500, tntCount: 6 },
            { startTime: 46000, barrierSpawnRate: 600, barrierTypes: ['small', 'fast', 'large'], tntSpawnRate: 2000, tntCount: 7 }
        ],
        targetBarriers: 30,
        tntCount: 10
    },
    // 第6关 - 极限模式：高速+高密度
    {
        name: '极限模式',
        theme: 'extreme',
        reward: 1500,
        duration: 80000,
        phases: [
            { startTime: 0, barrierSpawnRate: 900, barrierTypes: ['fast', 'small'], tntSpawnRate: 2500, tntCount: 6 },
            { startTime: 26000, barrierSpawnRate: 700, barrierTypes: ['fast', 'medium', 'small'], tntSpawnRate: 2000, tntCount: 7 },
            { startTime: 52000, barrierSpawnRate: 500, barrierTypes: ['fast', 'small', 'medium', 'large'], tntSpawnRate: 1800, tntCount: 8 }
        ],
        targetBarriers: 35,
        tntCount: 12
    },
    // 第7关 - 终极Boss：所有机制叠加
    {
        name: '终极Boss',
        theme: 'boss',
        reward: 2000,
        duration: 90000,
        phases: [
            { startTime: 0, barrierSpawnRate: 800, barrierTypes: ['medium', 'fast'], tntSpawnRate: 2200, tntCount: 7 },
            { startTime: 30000, barrierSpawnRate: 600, barrierTypes: ['fast', 'small', 'large'], tntSpawnRate: 1800, tntCount: 8 },
            { startTime: 60000, barrierSpawnRate: 400, barrierTypes: ['small', 'fast', 'medium', 'large'], tntSpawnRate: 1500, tntCount: 10 }
        ],
        targetBarriers: 40,
        tntCount: 15
    }
];

// 选择赛车
function selectCar(index) {
    selectedCarIndex = index;
    car.color = carStyles[index].color;
    sounds.button();  // 播放按钮音效
    
    // 更新UI
    document.querySelectorAll('.car-option').forEach((option, i) => {
        if (i === index) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    // 更新移动端按钮图标
    updateMobileButtons();
}

// 更新移动端按钮图标（使用选中的汽车图标）
function updateMobileButtons() {
    const carEmoji = carStyles[selectedCarIndex].emoji;
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    
    // 左右按钮显示选中的汽车图标
    if (btnLeft) btnLeft.textContent = carEmoji;
    if (btnRight) btnRight.textContent = carEmoji;
}

// 获取当前阶段
function getCurrentPhase() {
    const level = levels[currentLevel - 1];
    const elapsed = Date.now() - levelStartTime;
    
    for (let i = level.phases.length - 1; i >= 0; i--) {
        if (elapsed >= level.phases[i].startTime) {
            return level.phases[i];
        }
    }
    return level.phases[0];
}

// 生成屏障（支持多种类型）
function spawnBarrier() {
    const phase = getCurrentPhase();
    const roadWidth = 400;
    const roadX = (canvas.width - roadWidth) / 2;
    
    // 随机选择障碍类型
    const typeName = phase.barrierTypes[Math.floor(Math.random() * phase.barrierTypes.length)];
    const type = barrierTypes[typeName];
    
    const startX = roadX + Math.random() * (roadWidth - type.width);
    const baseSpeed = type.speed;
    const level = levels[currentLevel - 1];
    
    barriers.push({
        x: startX,
        y: -type.height,
        width: type.width,
        height: type.height,
        speedY: baseSpeed * (1 + (currentLevel - 1) * 0.2),  // 随关卡增加速度
        speedX: (1 + (currentLevel - 1) * 0.15) * (typeName === 'fast' ? 1.5 : 1),
        direction: Math.random() > 0.5 ? 1 : -1,
        roadX: roadX,
        roadWidth: roadWidth,
        type: typeName,
        color: type.color,
        score: type.score
    });
}

// 发射子弹
function shootBullet() {
    if (bulletCooldown <= 0) {
        bullets.push({
            x: car.x + car.width / 2 - 3,  // 从汽车中心发射
            y: car.y,  // 从汽车顶部发射
            width: 6,
            height: 12,
            speed: 8
        });
        bulletCooldown = bulletCooldownTime;
        sounds.shoot();  // 播放发射音效
    }
}

// 生成TNT障碍
function spawnTNT() {
    const phase = getCurrentPhase();
    const roadWidth = 400;
    const roadX = (canvas.width - roadWidth) / 2;
    const tntSize = 40;
    const startX = roadX + Math.random() * (roadWidth - tntSize);
    const baseSpeed = 0.8 * (1 + (currentLevel - 1) * 0.2);
    
    tntObstacles.push({
        x: startX,
        y: -tntSize,  // 从画布上方开始
        width: tntSize,
        height: tntSize,
        speedY: baseSpeed,
        speedX: (1 + (currentLevel - 1) * 0.15) * 0.6,
        direction: Math.random() > 0.5 ? 1 : -1,
        roadX: roadX,
        roadWidth: roadWidth
    });
}

// 创建爆炸效果
function createExplosion(x, y, size = 60) {
    const particleCount = 40;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.8;
        const speed = 3 + Math.random() * 5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,  // 生命周期，从1到0
            decay: 0.015 + Math.random() * 0.025,  // 衰减速度
            size: 4 + Math.random() * 6,
            color: i % 4 === 0 ? '#ff6b6b' : (i % 4 === 1 ? '#feca57' : (i % 4 === 2 ? '#ff4757' : '#ff9ff3'))  // 红、黄、深红、粉红
        });
    }
    
    explosions.push({
        x: x,
        y: y,
        particles: particles,
        life: 1.0,
        maxSize: size,
        centerSize: size * 0.3  // 中心光球大小
    });
}

// 初始化关卡
function initLevel(levelNum) {
    const level = levels[levelNum - 1];
    car.x = canvas.width / 2 - car.width / 2;  // 底部中央
    car.y = canvas.height - car.height - 10;  // 固定在底部
    
    // 重置状态
    barriers = [];
    bullets = [];
    tntObstacles = [];
    explosions = [];
    barrierSpawnTimer = 0;
    tntSpawnTimer = 0;
    barriersPassed = 0;
    levelStartTime = Date.now();
    gameTime = 0;
    lastFrameTime = 0;
    bulletCooldown = 0;
    comboCount = 0;
    lastHitTime = 0;
    currentPhase = 0;
    
    // 应用关卡主题
    levelTheme = levelThemes[level.theme];
    document.body.style.background = `linear-gradient(135deg, ${levelTheme.bgColor} 0%, ${levelTheme.bgColor}dd 100%)`;
    
    // 应用选中的赛车样式
    car.color = carStyles[selectedCarIndex].color;
    
    // 更新移动端按钮图标
    updateMobileButtons();

    updateUI();
    
    // 显示关卡开始提示
    showLevelStart(level);
}

// 显示关卡开始提示
function showLevelStart(level) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'levelStartOverlay';
    overlay.innerHTML = `
        <div class="overlay-content">
            <h2 style="color: ${levelTheme.accentColor}; font-size: 2.5em;">第${currentLevel}关</h2>
            <h3 style="color: ${levelTheme.accentColor}; font-size: 1.8em; margin: 15px 0;">${level.name}</h3>
            <p style="font-size: 1.2em; margin: 10px 0; color: #aaa;">${levelThemes[level.theme].description}</p>
            <p style="font-size: 1em; margin: 20px 0; color: #888;">奖励: ${level.reward}分 | 目标: ${level.targetBarriers}个障碍</p>
            <button id="startLevelBtn" style="margin-top: 20px;">开始挑战</button>
        </div>
    `;
    document.body.appendChild(overlay);
    gameRunning = false;
    
    // 绑定按钮事件
    document.getElementById('startLevelBtn').addEventListener('click', () => {
        sounds.button();  // 播放按钮音效
        overlay.remove();
        gameRunning = true;
    });
}

// 更新UI
function updateUI() {
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('score').textContent = score;
    document.getElementById('totalReward').textContent = totalReward;
    
    // 显示连击数（如果有）
    if (comboCount > 1) {
        const comboEl = document.getElementById('combo') || (() => {
            const el = document.createElement('div');
            el.id = 'combo';
            el.style.cssText = 'position: fixed; top: 100px; right: 20px; font-size: 1.5em; color: #feca57; font-weight: bold; z-index: 999; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);';
            document.body.appendChild(el);
            return el;
        })();
        comboEl.textContent = `连击 x${comboCount}!`;
        comboEl.style.display = 'block';
    } else {
        const comboEl = document.getElementById('combo');
        if (comboEl) comboEl.style.display = 'none';
    }
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 绘制游戏
function draw() {
    // 清空画布（使用主题背景色）
    ctx.fillStyle = levelTheme ? levelTheme.bgColor : '#2d3436';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格背景
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // 绘制竖向道路（使用主题色）
    const roadWidth = 400;
    const roadX = (canvas.width - roadWidth) / 2;
    ctx.fillStyle = levelTheme ? levelTheme.roadColor : 'rgba(100, 100, 100, 0.4)';
    ctx.fillRect(roadX, 0, roadWidth, canvas.height);
    
    // 绘制道路中线（竖向）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 30]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 绘制道路边界
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, canvas.height);
    ctx.moveTo(roadX + roadWidth, 0);
    ctx.lineTo(roadX + roadWidth, canvas.height);
    ctx.stroke();

    // 绘制屏障（使用障碍类型颜色）
    barriers.forEach(barrier => {
        // 屏障阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barrier.x + 3, barrier.y + 3, barrier.width, barrier.height);

        // 屏障主体 - 使用障碍类型颜色
        const barrierColor = barrier.color || '#ff6b6b';
        const gradient = ctx.createLinearGradient(barrier.x, barrier.y, barrier.x, barrier.y + barrier.height);
        gradient.addColorStop(0, barrierColor);
        gradient.addColorStop(0.5, barrierColor + 'dd');
        gradient.addColorStop(1, barrierColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height);

        // 屏障边框
        ctx.strokeStyle = barrierColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(barrier.x, barrier.y, barrier.width, barrier.height);
        
        // 屏障警告条纹
        ctx.fillStyle = '#ffd32a';
        for (let i = 0; i < barrier.width; i += 20) {
            ctx.fillRect(barrier.x + i, barrier.y, 10, barrier.height);
        }
    });

    // 绘制赛车（使用选中的汽车emoji）
    ctx.save();
    
    // 获取选中的汽车emoji
    const carEmoji = carStyles[selectedCarIndex].emoji;
    
    // 设置字体大小，确保emoji能正确显示
    const fontSize = Math.max(car.width, car.height) * 0.8;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 绘制汽车阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText(carEmoji, car.x + car.width/2 + 2, car.y + car.height/2 + 2);
    
    // 绘制汽车主体（emoji）
    ctx.fillStyle = '#000';  // emoji本身有颜色，这里只是确保显示
    ctx.fillText(carEmoji, car.x + car.width/2, car.y + car.height/2);
    
    // 绘制炮管（表示可以发射）
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(car.x + car.width / 2 - 2, car.y - 8, 4, 8);

    ctx.restore();

    // 绘制子弹
    bullets.forEach(bullet => {
        // 子弹发光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#feca57';
        ctx.fillStyle = '#feca57';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
        
        // 子弹高光
        ctx.fillStyle = '#fff';
        ctx.fillRect(bullet.x + 1, bullet.y + 1, bullet.width - 2, 3);
    });

    // 绘制TNT障碍
    tntObstacles.forEach(tnt => {
        // TNT阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(tnt.x + 3, tnt.y + 3, tnt.width, tnt.height);

        // TNT主体 - 红色警告色
        const gradient = ctx.createLinearGradient(tnt.x, tnt.y, tnt.x + tnt.width, tnt.y + tnt.height);
        gradient.addColorStop(0, '#ff4757');
        gradient.addColorStop(0.5, '#c44569');
        gradient.addColorStop(1, '#ff4757');
        ctx.fillStyle = gradient;
        ctx.fillRect(tnt.x, tnt.y, tnt.width, tnt.height);

        // TNT边框
        ctx.strokeStyle = '#ff3838';
        ctx.lineWidth = 3;
        ctx.strokeRect(tnt.x, tnt.y, tnt.width, tnt.height);
        
        // TNT字样
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', tnt.x + tnt.width / 2, tnt.y + tnt.height / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    });

    // 绘制爆炸效果
    explosions.forEach(explosion => {
        const life = explosion.life;
        
        // 绘制中心爆炸光球
        if (life > 0) {
            ctx.save();
            const centerAlpha = life * 0.8;
            const centerSize = explosion.centerSize * (1 - life * 0.5);
            
            // 中心光球 - 白色到黄色渐变
            const centerGradient = ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, centerSize
            );
            centerGradient.addColorStop(0, 'rgba(255, 255, 255, ' + centerAlpha + ')');
            centerGradient.addColorStop(0.5, 'rgba(255, 236, 87, ' + centerAlpha + ')');
            centerGradient.addColorStop(1, 'rgba(255, 107, 107, ' + centerAlpha * 0.5 + ')');
            
            ctx.fillStyle = centerGradient;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, centerSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // 绘制爆炸粒子
        explosion.particles.forEach(particle => {
            if (particle.life > 0) {
                // 根据生命周期调整透明度和大小
                const alpha = particle.life;
                const size = particle.size * particle.life;
                
                // 绘制粒子
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = particle.color;
                ctx.shadowBlur = 15 * alpha;
                ctx.shadowColor = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
    });
}

// 暂停/继续游戏
function togglePause() {
    if (!gameRunning) return;  // 游戏未运行时不能暂停
    
    gamePaused = !gamePaused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (gamePaused) {
        pauseOverlay.classList.remove('hidden');
        pauseBtn.textContent = '▶️ 继续';
        sounds.button();
    } else {
        pauseOverlay.classList.add('hidden');
        pauseBtn.textContent = '⏸️ 暂停';
        sounds.button();
    }
}

// 更新游戏逻辑
function update(currentTime) {
    if (!gameRunning || gamePaused) return;

    // 计算帧时间差
    const deltaTime = lastFrameTime ? currentTime - lastFrameTime : 16;
    lastFrameTime = currentTime;

    // 移动赛车（只能左右移动，限制在道路范围内）
    const roadWidth = 400;
    const roadX = (canvas.width - roadWidth) / 2;
    if (keys.left && car.x > roadX) {
        car.x -= car.speed;
    }
    if (keys.right && car.x < roadX + roadWidth - car.width) {
        car.x += car.speed;
    }

    const level = levels[currentLevel - 1];
    
    // 更新子弹冷却
    if (bulletCooldown > 0) {
        bulletCooldown -= deltaTime;
    }
    
    // 发射子弹
    if (keys.space && bulletCooldown <= 0) {
        shootBullet();
    }
    
    // 更新子弹位置
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;  // 向上移动
        
        // 移除超出画布的子弹
        if (bullet.y + bullet.height < 0) {
            bullets.splice(i, 1);
            continue;
        }
        
        // 检测子弹与屏障的碰撞
        for (let j = barriers.length - 1; j >= 0; j--) {
            const barrier = barriers[j];
            if (checkCollision(bullet, barrier)) {
                // 连击系统
                const now = Date.now();
                if (now - lastHitTime < 2000) {  // 2秒内连续击中
                    comboCount++;
                } else {
                    comboCount = 1;
                }
                lastHitTime = now;
                
                // 计算分数（基础分数 + 连击奖励）
                const baseScore = barrier.score || 50;
                const comboBonus = comboCount > 1 ? comboCount * 10 : 0;
                const finalScore = baseScore + comboBonus;
                
                bullets.splice(i, 1);
                barriers.splice(j, 1);
                score += finalScore;
                barriersPassed++;
                
                // 播放音效
                if (comboCount > 1) {
                    sounds.combo(comboCount);
                } else {
                    sounds.hit();
                }
                break;
            }
        }
        
        // 检测子弹与TNT的碰撞
        for (let j = tntObstacles.length - 1; j >= 0; j--) {
            const tnt = tntObstacles[j];
            if (checkCollision(bullet, tnt)) {
                // 连击系统
                const now = Date.now();
                if (now - lastHitTime < 2000) {
                    comboCount++;
                } else {
                    comboCount = 1;
                }
                lastHitTime = now;
                
                // TNT爆炸，连击奖励更高
                const comboBonus = comboCount > 1 ? comboCount * 20 : 0;
                const finalScore = 100 + comboBonus;
                
                createExplosion(tnt.x + tnt.width / 2, tnt.y + tnt.height / 2, 80);
                sounds.explosion();  // 播放爆炸音效
                bullets.splice(i, 1);
                tntObstacles.splice(j, 1);
                score += finalScore;
                break;
            }
        }
    }
    
    // 获取当前阶段
    const phase = getCurrentPhase();
    
    // 生成屏障（基于阶段配置）
    barrierSpawnTimer += deltaTime;
    if (barrierSpawnTimer >= phase.barrierSpawnRate) {
        spawnBarrier();
        barrierSpawnTimer = 0;
    }
    
    // 生成TNT（基于阶段配置和数量限制）
    const currentTntCount = tntObstacles.length;
    if (currentTntCount < phase.tntCount) {
        tntSpawnTimer += deltaTime;
        if (tntSpawnTimer >= phase.tntSpawnRate) {
            spawnTNT();
            tntSpawnTimer = 0;
        }
    }
    
    // 检查阶段变化
    const elapsed = Date.now() - levelStartTime;
    const newPhaseIndex = level.phases.findIndex((p, idx) => {
        const nextPhase = level.phases[idx + 1];
        return elapsed >= p.startTime && (!nextPhase || elapsed < nextPhase.startTime);
    });
    if (newPhaseIndex !== -1 && newPhaseIndex !== currentPhase) {
        currentPhase = newPhaseIndex;
    }

    // 更新屏障位置
    for (let i = barriers.length - 1; i >= 0; i--) {
        const barrier = barriers[i];
        
        // 向下移动
        barrier.y += barrier.speedY;
        
        // 左右移动（在道路范围内）
        barrier.x += barrier.speedX * barrier.direction;
        
        // 碰到道路左右边界反向
        const roadX = barrier.roadX || (canvas.width - 400) / 2;
        const roadWidth = barrier.roadWidth || 400;
        if (barrier.x + barrier.width > roadX + roadWidth || barrier.x < roadX) {
            barrier.direction *= -1;
            // 确保不超出道路边界
            barrier.x = Math.max(roadX, Math.min(barrier.x, roadX + roadWidth - barrier.width));
        }
        
        // 移除超出底部的屏障
        if (barrier.y > canvas.height) {
            barriers.splice(i, 1);
            barriersPassed++;
            score += 10;  // 每躲过一个屏障加10分
        }
    }

    // 更新TNT位置
    for (let i = tntObstacles.length - 1; i >= 0; i--) {
        const tnt = tntObstacles[i];
        
        // 向下移动
        tnt.y += tnt.speedY;
        
        // 左右移动（在道路范围内）
        tnt.x += tnt.speedX * tnt.direction;
        
        // 碰到道路左右边界反向
        const roadX = tnt.roadX || (canvas.width - 400) / 2;
        const roadWidth = tnt.roadWidth || 400;
        if (tnt.x + tnt.width > roadX + roadWidth || tnt.x < roadX) {
            tnt.direction *= -1;
            // 确保不超出道路边界
            tnt.x = Math.max(roadX, Math.min(tnt.x, roadX + roadWidth - tnt.width));
        }
        
        // 移除超出底部的TNT
        if (tnt.y > canvas.height) {
            tntObstacles.splice(i, 1);
        }
    }

    // 检测与屏障的碰撞
    for (let barrier of barriers) {
        if (checkCollision(car, barrier)) {
            sounds.crash();  // 播放碰撞音效
            gameOver();
            return;
        }
    }
    
    // 更新爆炸效果
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.life -= 0.02;
        
        // 更新粒子
        explosion.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98;  // 减速
            particle.vy *= 0.98;
        });
        
        // 移除已完成的爆炸
        if (explosion.life <= 0) {
            explosions.splice(i, 1);
        }
    }

    // 检测与TNT的碰撞（会爆炸）
    for (let tnt of tntObstacles) {
        if (checkCollision(car, tnt)) {
            // TNT爆炸，创建爆炸效果
            createExplosion(car.x + car.width / 2, car.y + car.height / 2, 100);
            sounds.explosion();  // 播放爆炸音效
            // 延迟一下再结束游戏，让玩家看到爆炸效果
            setTimeout(() => {
                gameOver('tnt');
            }, 300);
            return;
        }
    }

    // 检查关卡完成条件
    gameTime = Date.now() - levelStartTime;
    if (gameTime >= level.duration || barriersPassed >= level.targetBarriers) {
        levelComplete();
        return;
    }

    // 增加分数（时间分数）
    score += 1;
    updateUI();
}

// 游戏结束
function gameOver(reason) {
    gameRunning = false;
    gamePaused = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalReward').textContent = totalReward;
    const reasonText = document.getElementById('gameOverReason');
    if (reason === 'tnt') {
        reasonText.textContent = '💥 TNT爆炸了！';
    } else {
        reasonText.textContent = '你撞到屏障了！';
    }
    document.getElementById('gameOverOverlay').classList.remove('hidden');
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.classList.remove('visible');
    sounds.gameOver();  // 播放游戏结束音效
}

// 关卡完成
function levelComplete() {
    gameRunning = false;
    gamePaused = false;
    const reward = levels[currentLevel - 1].reward;
    totalReward += reward;
    score += reward;

    if (currentLevel >= 7) {
        // 游戏胜利
        document.getElementById('winReward').textContent = totalReward;
        document.getElementById('winScore').textContent = score;
        document.getElementById('winOverlay').classList.remove('hidden');
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.classList.remove('visible');
        sounds.victory();  // 播放胜利音效
    } else {
        // 下一关
        document.getElementById('levelReward').textContent = reward;
        document.getElementById('nextLevel').textContent = currentLevel + 1;
        document.getElementById('levelCompleteOverlay').classList.remove('hidden');
        sounds.levelComplete();  // 播放关卡完成音效
    }
}

// 下一关
function nextLevel() {
    sounds.button();  // 播放按钮音效
    currentLevel++;
    document.getElementById('levelCompleteOverlay').classList.add('hidden');
    gamePaused = false;
    initLevel(currentLevel);
    gameRunning = true;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸️ 暂停';
}

// 开始游戏
function startGame() {
    sounds.button();  // 播放按钮音效
    document.getElementById('startOverlay').classList.add('hidden');
    currentLevel = 1;
    score = 0;
    totalReward = 0;
    gamePaused = false;
    initLevel(currentLevel);
    gameRunning = true;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.textContent = '⏸️ 暂停';
        pauseBtn.classList.add('visible');
    }
}

// 重新开始
function restartGame() {
    sounds.button();  // 播放按钮音效
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('winOverlay').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');
    currentLevel = 1;
    score = 0;
    totalReward = 0;
    gamePaused = false;
    initLevel(currentLevel);
    gameRunning = true;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸️ 暂停';
}

// 键盘事件
document.addEventListener('keydown', (e) => {
    // ESC键或P键暂停/继续
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameRunning) {
            togglePause();
        }
        e.preventDefault();
        return;
    }
    
    // 暂停时不允许其他操作
    if (gamePaused) return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            e.preventDefault();
            break;
        case ' ':
        case 'Space':
            keys.space = true;
            e.preventDefault();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
        case ' ':
        case 'Space':
            keys.space = false;
            break;
    }
});

// 移动端按钮事件
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnShoot = document.getElementById('btnShoot');

if (btnLeft && btnRight && btnShoot) {
    // 左移按钮
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.left = true;
    });
    btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.left = false;
    });
    btnLeft.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys.left = true;
    });
    btnLeft.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys.left = false;
    });

    // 右移按钮
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.right = true;
    });
    btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.right = false;
    });
    btnRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys.right = true;
    });
    btnRight.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys.right = false;
    });

    // 发射按钮
    btnShoot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.space = true;
    });
    btnShoot.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.space = false;
    });
    btnShoot.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys.space = true;
    });
    btnShoot.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys.space = false;
    });
}

// 触摸滑动控制（可选）
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // 如果主要是水平移动，则控制左右
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
            if (deltaX > 0) {
                keys.right = true;
                setTimeout(() => { keys.right = false; }, 100);
            } else {
                keys.left = true;
                setTimeout(() => { keys.left = false; }, 100);
            }
        }
    }
});

// 防止页面滚动和缩放
document.addEventListener('touchmove', (e) => {
    if (e.target === canvas || e.target.closest('.mobile-controls')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
});

// 响应式画布调整
function resizeCanvas() {
    if (window.innerWidth <= 768) {
        // 移动端：保持宽高比，适应屏幕
        const aspectRatio = 800 / 500;
        const padding = 20;
        const controlsHeight = 150; // 为控制按钮预留空间
        const availableWidth = window.innerWidth - padding * 2;
        const availableHeight = window.innerHeight - controlsHeight - 100; // 减去UI元素高度
        
        let newWidth = availableWidth;
        let newHeight = newWidth / aspectRatio;
        
        // 如果高度超出，按高度调整
        if (newHeight > availableHeight) {
            newHeight = availableHeight;
            newWidth = newHeight * aspectRatio;
        }
        
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
    } else {
        // 桌面端：保持原始尺寸
        canvas.style.width = '';
        canvas.style.height = '';
    }
}

// 监听窗口大小变化和方向变化
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});
resizeCanvas();

// 游戏循环
function gameLoop(currentTime) {
    update(currentTime);
    draw();
    requestAnimationFrame(gameLoop);
}

// 启动游戏循环
gameLoop();

// 初始化移动端按钮图标
updateMobileButtons();

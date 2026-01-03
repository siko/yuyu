// 游戏配置文件

// 赛车样式配置
const carStyles = [
    { emoji: '🚗', color: '#ff6b6b', name: '红色轿车' },
    { emoji: '🏎️', color: '#feca57', name: '跑车' },
    { emoji: '🚙', color: '#4ecdc4', name: 'SUV' },
    { emoji: '🚕', color: '#ff9ff3', name: '出租车' },
    { emoji: '🚓', color: '#54a0ff', name: '警车' }
];

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

// 赛车初始配置
const car = {
    x: 380,  // 初始位置在底部中央
    y: 450,  // 固定在底部
    width: 40,
    height: 25,
    speed: 6,
    color: '#ff6b6b'
};

// 子弹冷却时间配置
const bulletCooldownTime = 200;  // 200ms冷却时间


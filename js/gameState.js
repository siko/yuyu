// 游戏状态管理

// 游戏运行状态
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
let lives = 1;  // 生命数（初始1条命）

// 游戏对象数组
let barriers = [];
let bullets = [];
let tntObstacles = [];
let giftBoxes = [];
let explosions = [];

// 按键状态
const keys = {
    left: false,
    right: false,
    space: false
};

// 子弹发射冷却
let bulletCooldown = 0;

// 屏障生成计时器
let barrierSpawnTimer = 0;
let lastFrameTime = 0;

// TNT生成计时器
let tntSpawnTimer = 0;


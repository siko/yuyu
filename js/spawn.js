// 游戏对象生成函数

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

// 生成礼物盒（每关2个）
function spawnGiftBox() {
    const roadWidth = 400;
    const roadX = (canvas.width - roadWidth) / 2;
    const giftSize = 35;
    const startX = roadX + Math.random() * (roadWidth - giftSize);
    const baseSpeed = 0.7 * (1 + (currentLevel - 1) * 0.15);
    
    giftBoxes.push({
        x: startX,
        y: -giftSize,  // 从画布上方开始
        width: giftSize,
        height: giftSize,
        speedY: baseSpeed,
        speedX: (1 + (currentLevel - 1) * 0.1) * 0.5,
        direction: Math.random() > 0.5 ? 1 : -1,
        roadX: roadX,
        roadWidth: roadWidth,
        rotation: 0  // 用于旋转动画
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


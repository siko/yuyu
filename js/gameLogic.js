// 游戏逻辑

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

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
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
    giftBoxes = [];
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
    
    // 每关生成2个礼物盒（延迟生成，避免一开始就出现）
    setTimeout(() => {
        spawnGiftBox();
    }, 5000 + Math.random() * 5000);  // 5-10秒后生成第一个
    setTimeout(() => {
        spawnGiftBox();
    }, 15000 + Math.random() * 10000);  // 15-25秒后生成第二个
    
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
                const baseScore = 20;  // 击中障碍得20分
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
                const finalScore = 50 + comboBonus;  // 击中TNT得50分
                
                createExplosion(tnt.x + tnt.width / 2, tnt.y + tnt.height / 2, 80);
                sounds.explosion();  // 播放爆炸音效
                bullets.splice(i, 1);
                tntObstacles.splice(j, 1);
                score += finalScore;
                break;
            }
        }
        
        // 检测子弹与礼物盒的碰撞
        for (let j = giftBoxes.length - 1; j >= 0; j--) {
            const gift = giftBoxes[j];
            if (checkCollision(bullet, gift)) {
                // 击中礼物盒，增加一条命
                lives++;
                sounds.button();  // 播放获得奖励音效
                bullets.splice(i, 1);
                giftBoxes.splice(j, 1);
                updateUI();
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

    // 更新礼物盒位置
    for (let i = giftBoxes.length - 1; i >= 0; i--) {
        const gift = giftBoxes[i];
        
        // 向下移动
        gift.y += gift.speedY;
        
        // 左右移动（在道路范围内）
        gift.x += gift.speedX * gift.direction;
        
        // 旋转动画
        gift.rotation += 0.05;
        
        // 碰到道路左右边界反向
        const roadX = gift.roadX || (canvas.width - 400) / 2;
        const roadWidth = gift.roadWidth || 400;
        if (gift.x + gift.width > roadX + roadWidth || gift.x < roadX) {
            gift.direction *= -1;
            // 确保不超出道路边界
            gift.x = Math.max(roadX, Math.min(gift.x, roadX + roadWidth - gift.width));
        }
        
        // 移除超出底部的礼物盒
        if (gift.y > canvas.height) {
            giftBoxes.splice(i, 1);
        }
    }

    // 检测与屏障的碰撞
    for (let barrier of barriers) {
        if (checkCollision(car, barrier)) {
            sounds.crash();  // 播放碰撞音效
            lives--;
            updateUI();
            // 移除碰撞的屏障
            const index = barriers.indexOf(barrier);
            if (index > -1) {
                barriers.splice(index, 1);
            }
            // 如果生命为0，游戏结束
            if (lives <= 0) {
                gameOver();
                return;
            }
            // 生命大于0，继续游戏（可以添加短暂无敌时间）
            break;
        }
    }
    
    // 检测与礼物盒的碰撞（直接获得）
    for (let i = giftBoxes.length - 1; i >= 0; i--) {
        const gift = giftBoxes[i];
        if (checkCollision(car, gift)) {
            lives++;
            sounds.button();  // 播放获得奖励音效
            giftBoxes.splice(i, 1);
            updateUI();
            break;
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
            // 移除碰撞的TNT
            const index = tntObstacles.indexOf(tnt);
            if (index > -1) {
                tntObstacles.splice(index, 1);
            }
            // 扣除生命
            lives--;
            updateUI();
            // 如果生命为0，游戏结束
            if (lives <= 0) {
                setTimeout(() => {
                    gameOver('tnt');
                }, 300);
                return;
            }
            // 生命大于0，继续游戏
            break;
        }
    }

    // 检查关卡完成条件
    gameTime = Date.now() - levelStartTime;
    if (gameTime >= level.duration || barriersPassed >= level.targetBarriers) {
        levelComplete();
        return;
    }

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
    updateUI();
}

// 开始游戏
function startGame() {
    sounds.button();  // 播放按钮音效
    document.getElementById('startOverlay').classList.add('hidden');
    currentLevel = 1;
    score = 0;
    totalReward = 0;
    lives = 1;  // 重置生命数
    gamePaused = false;
    initLevel(currentLevel);
    gameRunning = true;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.textContent = '⏸️ 暂停';
        pauseBtn.classList.add('visible');
    }
    updateUI();
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
    lives = 1;  // 重置生命数
    gamePaused = false;
    initLevel(currentLevel);
    gameRunning = true;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸️ 暂停';
    updateUI();
}


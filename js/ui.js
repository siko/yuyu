// UI管理

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
    
    // 更新生命数显示
    const livesEl = document.getElementById('lives') || (() => {
        const el = document.createElement('div');
        el.id = 'lives';
        el.className = 'info-item';
        el.innerHTML = '生命: <span id="livesCount">1</span>';
        const infoPanel = document.querySelector('.info-panel');
        if (infoPanel) {
            infoPanel.insertBefore(el, infoPanel.firstChild);
        }
        return el;
    })();
    const livesCountEl = document.getElementById('livesCount');
    if (livesCountEl) {
        livesCountEl.textContent = lives;
    }
    
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


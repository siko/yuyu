// 游戏主逻辑 - 主入口文件

// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

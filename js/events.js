// 事件处理

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


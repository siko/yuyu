// 绘制函数

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

    // 绘制礼物盒
    giftBoxes.forEach(gift => {
        ctx.save();
        
        // 礼物盒阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(gift.x + 2, gift.y + 2, gift.width, gift.height);

        // 礼物盒主体 - 金色渐变
        const giftGradient = ctx.createLinearGradient(gift.x, gift.y, gift.x + gift.width, gift.y + gift.height);
        giftGradient.addColorStop(0, '#ffd700');
        giftGradient.addColorStop(0.3, '#ffed4e');
        giftGradient.addColorStop(0.7, '#ffd700');
        giftGradient.addColorStop(1, '#ffb347');
        ctx.fillStyle = giftGradient;
        ctx.fillRect(gift.x, gift.y, gift.width, gift.height);

        // 礼物盒边框
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 2;
        ctx.strokeRect(gift.x, gift.y, gift.width, gift.height);
        
        // 礼物盒丝带（十字形）
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        // 横向丝带
        ctx.beginPath();
        ctx.moveTo(gift.x, gift.y + gift.height / 2);
        ctx.lineTo(gift.x + gift.width, gift.y + gift.height / 2);
        ctx.stroke();
        // 纵向丝带
        ctx.beginPath();
        ctx.moveTo(gift.x + gift.width / 2, gift.y);
        ctx.lineTo(gift.x + gift.width / 2, gift.y + gift.height);
        ctx.stroke();
        
        // 礼物盒中心装饰
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(gift.x + gift.width / 2, gift.y + gift.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
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


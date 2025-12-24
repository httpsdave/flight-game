import Matter from 'matter-js';

class World {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
        this.grounds = [];
        this.stars = [];
        this.clouds = [];
        
        this.createInitialWorld();
    }
    
    createInitialWorld() {
        for (let i = 0; i < 100; i++) {
            this.createGroundSegment(i * 300);
        }
        
        for (let i = 0; i < 30; i++) {
            this.clouds.push({
                x: Math.random() * 10000,
                y: 100 + Math.random() * 300,
                size: 40 + Math.random() * 60,
                speed: 0.1 + Math.random() * 0.3
            });
        }
    }
    
    createGroundSegment(x) {
        const baseY = this.canvas.height - 100;
        const variance = Math.sin(x * 0.005) * 80;
        const y = baseY + variance;
        
        const ground = Matter.Bodies.rectangle(x, y, 300, 200, {
            isStatic: true,
            friction: 0.8,
            render: { fillStyle: '#90EE90' }
        });
        
        Matter.World.add(this.engine.world, ground);
        this.grounds.push({ body: ground, x });
        
        if (Math.random() > 0.6 && x > 500) {
            this.stars.push({
                x: x + Math.random() * 200,
                y: y - 120 - Math.random() * 150,
                collected: false,
                rotation: 0,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(playerPos, player) {
        const lastGround = this.grounds[this.grounds.length - 1];
        if (playerPos.x > lastGround.x - 2000) {
            this.createGroundSegment(lastGround.x + 300);
        }
        
        this.stars.forEach(star => {
            if (star.collected) return;
            
            const dx = playerPos.x - star.x;
            const dy = playerPos.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 40) {
                star.collected = true;
            }
            
            star.rotation += 0.05;
            star.pulse += 0.1;
        });
    }
    
    render(ctx, camera, canvas) {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, camera.y, 0, camera.y + canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#5FA9D8');
        gradient.addColorStop(1, '#2E5F8A');
        ctx.fillStyle = gradient;
        ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);
        
        // Clouds
        this.clouds.forEach(cloud => {
            if (cloud.x < camera.x - 200 || cloud.x > camera.x + canvas.width + 200) return;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.7, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            ctx.arc(cloud.x - cloud.size * 0.7, cloud.y + cloud.size * 0.3, cloud.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Ground
        this.grounds.forEach(ground => {
            const pos = ground.body.position;
            const vertices = ground.body.vertices;
            
            if (pos.x < camera.x - 300 || pos.x > camera.x + canvas.width + 300) return;
            
            ctx.fillStyle = '#90EE90';
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Grass details
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const gx = pos.x - 120 + i * 60;
                const gy = pos.y - 95;
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx - 3, gy - 8);
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx + 3, gy - 10);
                ctx.stroke();
            }
        });
        
        // Stars
        this.stars.forEach(star => {
            if (star.collected) return;
            if (star.x < camera.x - 100 || star.x > camera.x + canvas.width + 100) return;
            
            const scale = 1 + Math.sin(star.pulse) * 0.2;
            
            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate(star.rotation);
            ctx.scale(scale, scale);
            
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const radius = i % 2 === 0 ? 15 : 7;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Distance markers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 24px "Indie Flower"';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 3;
        
        const startMarker = Math.floor(camera.x / 1000) * 1000;
        for (let i = 0; i < 5; i++) {
            const mx = startMarker + i * 1000;
            const dist = Math.floor(mx / 10);
            
            ctx.strokeText(`${dist}m`, mx + 20, camera.y + 80);
            ctx.fillText(`${dist}m`, mx + 20, camera.y + 80);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mx, camera.y);
            ctx.lineTo(mx, camera.y + canvas.height);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        }
    }
    
    reset() {
        this.grounds.forEach(g => {
            Matter.World.remove(this.engine.world, g.body);
        });
        this.grounds = [];
        this.stars = [];
        this.createInitialWorld();
    }
}

export default World;

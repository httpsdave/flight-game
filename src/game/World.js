import Matter from 'matter-js';

class World {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
        this.grounds = [];
        this.stars = [];
        this.clouds = [];
        this.thermals = [];
        this.collectEffects = [];
        
        this.createInitialWorld();
    }
    
    createInitialWorld() {
        for (let i = 0; i < 100; i++) {
            this.createGroundSegment(i * 300);
        }
        
        for (let i = 0; i < 50; i++) {
            this.clouds.push({
                x: Math.random() * 15000,
                y: 50 + Math.random() * 250,
                size: 40 + Math.random() * 80,
                speed: 0.05 + Math.random() * 0.15
            });
        }
        
        // Create thermals (updrafts)
        for (let i = 0; i < 20; i++) {
            this.thermals.push({
                x: 1000 + i * 800 + Math.random() * 400,
                strength: 0.0008 + Math.random() * 0.0005,
                width: 100 + Math.random() * 100
            });
        }
    }
    
    createGroundSegment(x) {
        const baseY = this.canvas.height - 80;
        const variance = Math.sin(x * 0.003) * 60 + Math.sin(x * 0.008) * 30;
        const y = baseY + variance;
        
        const ground = Matter.Bodies.rectangle(x, y, 300, 200, {
            isStatic: true,
            friction: 0.8,
            label: 'ground'
        });
        
        Matter.World.add(this.engine.world, ground);
        this.grounds.push({ body: ground, x, baseY: y - 100 });
        
        // More stars at varying heights
        const starChance = Math.random();
        if (starChance > 0.5 && x > 400) {
            const starHeight = starChance > 0.8 ? 250 : 150;
            this.stars.push({
                x: x + Math.random() * 250,
                y: y - 80 - Math.random() * starHeight,
                collected: false,
                rotation: 0,
                pulse: Math.random() * Math.PI * 2,
                value: starChance > 0.85 ? 20 : 10
            });
        }
        
        // Add thermals dynamically
        if (Math.random() > 0.85) {
            this.thermals.push({
                x: x + Math.random() * 200,
                strength: 0.0006 + Math.random() * 0.0004,
                width: 80 + Math.random() * 120
            });
        }
    }
    
    checkStarCollisions(playerPos) {
        let collected = 0;
        
        this.stars.forEach(star => {
            if (star.collected) return;
            
            const dx = playerPos.x - star.x;
            const dy = playerPos.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 45) {
                star.collected = true;
                collected++;
                
                // Add collection effect
                this.collectEffects.push({
                    x: star.x,
                    y: star.y,
                    life: 1,
                    text: `+$${star.value || 10}`
                });
            }
        });
        
        return collected;
    }
    
    applyThermals(playerBody) {
        const pos = playerBody.position;
        
        this.thermals.forEach(thermal => {
            const dx = Math.abs(pos.x - thermal.x);
            if (dx < thermal.width) {
                const factor = 1 - (dx / thermal.width);
                Matter.Body.applyForce(playerBody, pos, {
                    x: 0,
                    y: -thermal.strength * factor
                });
            }
        });
    }
    
    update(playerPos, player) {
        const lastGround = this.grounds[this.grounds.length - 1];
        if (playerPos.x > lastGround.x - 3000) {
            this.createGroundSegment(lastGround.x + 300);
        }
        
        // Apply thermal effects
        if (player && player.body) {
            this.applyThermals(player.body);
        }
        
        // Update star animations
        this.stars.forEach(star => {
            star.rotation += 0.04;
            star.pulse += 0.08;
        });
        
        // Update collection effects
        this.collectEffects = this.collectEffects.filter(effect => {
            effect.y -= 2;
            effect.life -= 0.03;
            return effect.life > 0;
        });
        
        // Move clouds slowly
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x < playerPos.x - 2000) {
                cloud.x = playerPos.x + 2000 + Math.random() * 1000;
            }
        });
    }
    
    render(ctx, camera, canvas) {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, camera.y - 200, 0, camera.y + canvas.height);
        gradient.addColorStop(0, '#5BA3D8');
        gradient.addColorStop(0.4, '#87CEEB');
        gradient.addColorStop(0.7, '#98D4E8');
        gradient.addColorStop(1, '#B8E4F0');
        ctx.fillStyle = gradient;
        ctx.fillRect(camera.x - 100, camera.y - 200, canvas.width + 200, canvas.height + 400);
        
        // Clouds
        this.clouds.forEach(cloud => {
            if (cloud.x < camera.x - 200 || cloud.x > camera.x + canvas.width + 200) return;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.6, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
            ctx.arc(cloud.x - cloud.size * 0.5, cloud.y + cloud.size * 0.1, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.3, cloud.y + cloud.size * 0.3, cloud.size * 0.4, 0, Math.PI * 2);
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
        
        // Render thermals as subtle updraft indicators
        this.thermals.forEach(thermal => {
            if (thermal.x < camera.x - 200 || thermal.x > camera.x + canvas.width + 200) return;
            
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#FFFFFF';
            
            // Draw wavy lines going up
            for (let i = 0; i < 3; i++) {
                const offset = (Date.now() / 1000 + i * 0.3) % 1;
                const y = camera.y + canvas.height - 100 - offset * 400;
                
                ctx.beginPath();
                ctx.arc(thermal.x - 20 + i * 20, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
        
        // Render collection effects (floating +$10 text)
        this.collectEffects.forEach(effect => {
            ctx.save();
            ctx.globalAlpha = effect.life;
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#8B6914';
            ctx.lineWidth = 3;
            ctx.font = 'bold 20px "Permanent Marker"';
            ctx.strokeText(effect.text, effect.x - 15, effect.y);
            ctx.fillText(effect.text, effect.x - 15, effect.y);
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
        this.clouds = [];
        this.thermals = [];
        this.collectEffects = [];
        this.createInitialWorld();
    }
    
    getCollectedStarValue() {
        return this.stars.filter(s => s.collected).reduce((sum, s) => sum + (s.value || 10), 0);
    }
}

export default World;

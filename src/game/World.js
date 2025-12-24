import Matter from 'matter-js';

class World {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
        this.grounds = [];
        this.stars = [];
        this.spaceStars = [];     // High altitude, worth more
        this.cranes = [];          // Paper cranes - multiplier bonus
        this.shootingStars = [];   // Boosts
        this.clouds = [];
        this.thermals = [];
        this.collectEffects = [];
        this.windZones = [];       // Dangerous wind areas
        
        // World progression (locations)
        this.currentLocation = 0;
        this.locations = [
            { name: 'Backyard', distance: 0, groundColor: '#90EE90', skyTop: '#87CEEB' },
            { name: 'Town', distance: 2000, groundColor: '#8FBC8F', skyTop: '#6CA6CD' },
            { name: 'Forest', distance: 5000, groundColor: '#228B22', skyTop: '#4A708B' },
            { name: 'Mountains', distance: 10000, groundColor: '#A0522D', skyTop: '#5D478B' },
            { name: 'Ocean', distance: 18000, groundColor: '#4682B4', skyTop: '#191970' },
            { name: 'North Pole', distance: 30000, groundColor: '#F0F8FF', skyTop: '#1E3A5F' }
        ];
        
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
        
        // Create space stars (very high altitude)
        for (let i = 0; i < 30; i++) {
            this.spaceStars.push({
                x: 800 + i * 600 + Math.random() * 400,
                y: -100 - Math.random() * 200,  // Very high up
                collected: false,
                rotation: 0,
                pulse: Math.random() * Math.PI * 2,
                value: 50,  // Worth more!
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        // Create paper cranes (multiplier bonus)
        for (let i = 0; i < 25; i++) {
            this.cranes.push({
                x: 600 + i * 500 + Math.random() * 300,
                y: 150 + Math.random() * 200,
                collected: false,
                wingAngle: 0,
                bobOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Create shooting stars periodically
        this.shootingStarTimer = 0;
        
        // Create wind zones (hazardous areas)
        for (let i = 0; i < 15; i++) {
            this.windZones.push({
                x: 2000 + i * 1200 + Math.random() * 500,
                width: 150 + Math.random() * 150,
                strength: 0.0015 + Math.random() * 0.001,
                direction: Math.random() > 0.5 ? 1 : -1  // Push up or down
            });
        }
    }
    
    getLocationAt(distance) {
        for (let i = this.locations.length - 1; i >= 0; i--) {
            if (distance >= this.locations[i].distance) {
                return this.locations[i];
            }
        }
        return this.locations[0];
    }
    
    createGroundSegment(x) {
        const baseY = this.canvas.height - 80;
        const location = this.getLocationAt(x);
        
        // Vary terrain based on location
        let variance = Math.sin(x * 0.003) * 60 + Math.sin(x * 0.008) * 30;
        if (location.name === 'Mountains') {
            variance = Math.sin(x * 0.002) * 100 + Math.sin(x * 0.01) * 50;
        } else if (location.name === 'Ocean') {
            variance = Math.sin(x * 0.005) * 20;
        }
        
        const y = baseY + variance;
        
        const ground = Matter.Bodies.rectangle(x, y, 300, 200, {
            isStatic: true,
            friction: 0.8,
            label: 'ground'
        });
        ground.locationColor = location.groundColor;
        
        Matter.World.add(this.engine.world, ground);
        this.grounds.push({ body: ground, x, baseY: y - 100, color: location.groundColor });
        
        // Regular stars
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
        
        // Add more cranes as distance increases
        if (Math.random() > 0.92 && x > 1000) {
            this.cranes.push({
                x: x + Math.random() * 200,
                y: 100 + Math.random() * 250,
                collected: false,
                wingAngle: 0,
                bobOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Add space stars at high altitudes
        if (Math.random() > 0.9 && x > 500) {
            this.spaceStars.push({
                x: x + Math.random() * 250,
                y: -50 - Math.random() * 300,
                collected: false,
                rotation: 0,
                pulse: Math.random() * Math.PI * 2,
                value: 50,
                twinkle: Math.random() * Math.PI * 2
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
        
        // Add wind zones in later areas
        if (Math.random() > 0.93 && x > 3000) {
            this.windZones.push({
                x: x + Math.random() * 200,
                width: 100 + Math.random() * 150,
                strength: 0.001 + Math.random() * 0.001,
                direction: Math.random() > 0.5 ? 1 : -1
            });
        }
    }
    
    checkStarCollisions(playerPos) {
        let collected = 0;
        let multiplier = 0;
        let boost = false;
        
        // Regular stars
        this.stars.forEach(star => {
            if (star.collected) return;
            
            const dx = playerPos.x - star.x;
            const dy = playerPos.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 45) {
                star.collected = true;
                collected += star.value || 10;
                
                this.collectEffects.push({
                    x: star.x,
                    y: star.y,
                    life: 1,
                    text: `+$${star.value || 10}`,
                    color: '#FFD700'
                });
            }
        });
        
        // Space stars (high altitude, worth more)
        this.spaceStars.forEach(star => {
            if (star.collected) return;
            
            const dx = playerPos.x - star.x;
            const dy = playerPos.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50) {
                star.collected = true;
                collected += star.value;
                
                this.collectEffects.push({
                    x: star.x,
                    y: star.y,
                    life: 1.2,
                    text: `+$${star.value}!`,
                    color: '#FF69B4',
                    big: true
                });
            }
        });
        
        // Paper cranes (give multiplier)
        this.cranes.forEach(crane => {
            if (crane.collected) return;
            
            const dx = playerPos.x - crane.x;
            const dy = playerPos.y - crane.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 40) {
                crane.collected = true;
                multiplier += 2;  // 2x multiplier bonus
                
                this.collectEffects.push({
                    x: crane.x,
                    y: crane.y,
                    life: 1.5,
                    text: '2x BONUS!',
                    color: '#FF6B6B',
                    big: true
                });
            }
        });
        
        // Shooting stars (give boost)
        this.shootingStars.forEach((star, index) => {
            if (star.collected) return;
            
            const dx = playerPos.x - star.x;
            const dy = playerPos.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 60) {
                star.collected = true;
                boost = true;
                
                this.collectEffects.push({
                    x: star.x,
                    y: star.y,
                    life: 1.5,
                    text: 'BOOST!',
                    color: '#00FFFF',
                    big: true
                });
            }
        });
        
        return { collected, multiplier, boost };
    }
    
    applyWindZones(playerBody) {
        const pos = playerBody.position;
        
        this.windZones.forEach(zone => {
            const dx = Math.abs(pos.x - zone.x);
            if (dx < zone.width) {
                const factor = 1 - (dx / zone.width);
                Matter.Body.applyForce(playerBody, pos, {
                    x: 0,
                    y: zone.strength * zone.direction * factor
                });
            }
        });
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
        
        // Also apply wind zones
        this.applyWindZones(playerBody);
    }
    
    spawnShootingStar(playerX) {
        // Spawn shooting star ahead of player
        this.shootingStars.push({
            x: playerX + 500 + Math.random() * 400,
            y: -50 - Math.random() * 150,
            vx: -8 - Math.random() * 4,
            vy: 3 + Math.random() * 2,
            collected: false,
            trail: [],
            life: 200
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
        
        // Update shooting star timer - spawn periodically
        this.shootingStarTimer = (this.shootingStarTimer || 0) + 1;
        if (this.shootingStarTimer > 300 && Math.random() > 0.97) {
            this.spawnShootingStar(playerPos.x);
            this.shootingStarTimer = 0;
        }
        
        // Update shooting stars
        this.shootingStars = this.shootingStars.filter(star => {
            if (star.collected) return false;
            
            star.x += star.vx;
            star.y += star.vy;
            star.life--;
            
            // Add trail
            star.trail.push({ x: star.x, y: star.y, life: 20 });
            star.trail = star.trail.filter(t => {
                t.life--;
                return t.life > 0;
            });
            
            return star.life > 0 && star.y < this.canvas.height;
        });
        
        // Update star animations
        this.stars.forEach(star => {
            star.rotation += 0.04;
            star.pulse += 0.08;
        });
        
        // Update space stars
        this.spaceStars.forEach(star => {
            star.rotation += 0.02;
            star.pulse += 0.06;
            star.twinkle += 0.15;
        });
        
        // Update cranes (flapping animation)
        this.cranes.forEach(crane => {
            crane.wingAngle = Math.sin(Date.now() / 150 + crane.bobOffset) * 0.4;
            crane.y += Math.sin(Date.now() / 500 + crane.bobOffset) * 0.3;
        });
        
        // Update collection effects
        this.collectEffects = this.collectEffects.filter(effect => {
            effect.y -= 2;
            effect.life -= 0.025;
            return effect.life > 0;
        });
        
        // Move clouds slowly
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x < playerPos.x - 2000) {
                cloud.x = playerPos.x + 2000 + Math.random() * 1000;
            }
        });
        
        // Update current location
        const location = this.getLocationAt(playerPos.x);
        if (location.name !== this.currentLocationName) {
            this.currentLocationName = location.name;
            this.collectEffects.push({
                x: playerPos.x + 200,
                y: 100,
                life: 3,
                text: `~ ${location.name} ~`,
                color: '#FFFFFF',
                big: true,
                fixed: true
            });
        }
    }
    
    render(ctx, camera, canvas) {
        // Get current location for theming
        const location = this.getLocationAt(camera.x);
        
        // Dynamic sky gradient based on location
        const gradient = ctx.createLinearGradient(0, camera.y - 300, 0, camera.y + canvas.height);
        gradient.addColorStop(0, location.skyTop);
        gradient.addColorStop(0.3, '#87CEEB');
        gradient.addColorStop(0.6, '#98D4E8');
        gradient.addColorStop(1, '#B8E4F0');
        ctx.fillStyle = gradient;
        ctx.fillRect(camera.x - 100, camera.y - 400, canvas.width + 200, canvas.height + 600);
        
        // Background stars at high altitudes (space atmosphere)
        if (camera.y < 100) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let i = 0; i < 50; i++) {
                const sx = ((camera.x * 0.1 + i * 137) % canvas.width) + camera.x;
                const sy = ((i * 73) % 300) - 200;
                const twinkle = Math.sin(Date.now() / 200 + i) * 0.5 + 0.5;
                ctx.globalAlpha = twinkle * 0.7;
                ctx.beginPath();
                ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        
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
        
        // Wind zones (visual warning)
        this.windZones.forEach(zone => {
            if (zone.x < camera.x - 200 || zone.x > camera.x + canvas.width + 200) return;
            
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = zone.direction > 0 ? '#FF6B6B' : '#6BCB77';
            ctx.fillRect(zone.x - zone.width/2, camera.y - 200, zone.width, canvas.height + 400);
            
            // Wind lines
            ctx.strokeStyle = zone.direction > 0 ? '#FF0000' : '#00FF00';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 5; i++) {
                const offset = (Date.now() / 500 + i * 0.2) % 1;
                const y = zone.direction > 0 
                    ? camera.y + offset * canvas.height
                    : camera.y + canvas.height - offset * canvas.height;
                ctx.beginPath();
                ctx.moveTo(zone.x - 20, y);
                ctx.lineTo(zone.x + 20, y + zone.direction * 30);
                ctx.stroke();
            }
            ctx.restore();
        });
        
        // Ground with location-based colors
        this.grounds.forEach(ground => {
            const pos = ground.body.position;
            const vertices = ground.body.vertices;
            
            if (pos.x < camera.x - 300 || pos.x > camera.x + canvas.width + 300) return;
            
            ctx.fillStyle = ground.color || '#90EE90';
            ctx.strokeStyle = this.darkenColor(ground.color || '#90EE90');
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Grass details (skip for ocean/snow)
            if (ground.color !== '#4682B4' && ground.color !== '#F0F8FF') {
                ctx.strokeStyle = this.darkenColor(ground.color || '#90EE90');
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
            }
        });
        
        // Shooting stars
        this.shootingStars.forEach(star => {
            if (star.collected) return;
            
            // Trail
            ctx.save();
            star.trail.forEach((t, i) => {
                ctx.globalAlpha = t.life / 20;
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.arc(t.x, t.y, 3 + i * 0.5, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Main shooting star
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#00FFFF';
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        });
        
        // Regular Stars
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
            
            this.drawStar(ctx, 0, 0, 5, 15, 7);
            ctx.restore();
        });
        
        // Space Stars (pink/purple, larger, high up)
        this.spaceStars.forEach(star => {
            if (star.collected) return;
            if (star.x < camera.x - 100 || star.x > camera.x + canvas.width + 100) return;
            
            const scale = 1.2 + Math.sin(star.pulse) * 0.3;
            const twinkle = Math.sin(star.twinkle) * 0.3 + 0.7;
            
            ctx.save();
            ctx.globalAlpha = twinkle;
            ctx.translate(star.x, star.y);
            ctx.rotate(star.rotation);
            ctx.scale(scale, scale);
            
            ctx.fillStyle = '#FF69B4';
            ctx.strokeStyle = '#FF1493';
            ctx.shadowColor = '#FF69B4';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 2;
            
            this.drawStar(ctx, 0, 0, 5, 18, 8);
            ctx.shadowBlur = 0;
            ctx.restore();
        });
        
        // Paper Cranes
        this.cranes.forEach(crane => {
            if (crane.collected) return;
            if (crane.x < camera.x - 100 || crane.x > camera.x + canvas.width + 100) return;
            
            ctx.save();
            ctx.translate(crane.x, crane.y);
            
            // Body
            ctx.fillStyle = '#FF6B6B';
            ctx.strokeStyle = '#CC5555';
            ctx.lineWidth = 2;
            
            // Simple origami crane shape
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-15, -5);
            ctx.lineTo(-25, 0);  // Tail
            ctx.lineTo(-15, 5);
            ctx.lineTo(0, 0);
            ctx.lineTo(20, -3);  // Head
            ctx.lineTo(25, 0);   // Beak
            ctx.lineTo(20, 3);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.stroke();
            
            // Wings (animated)
            ctx.fillStyle = '#FF8888';
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(0, -15 - crane.wingAngle * 20);
            ctx.lineTo(5, 0);
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(0, 15 + crane.wingAngle * 20);
            ctx.lineTo(5, 0);
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Thermals (subtle updraft indicators)
        this.thermals.forEach(thermal => {
            if (thermal.x < camera.x - 200 || thermal.x > camera.x + canvas.width + 200) return;
            
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = '#FFFFFF';
            
            for (let i = 0; i < 4; i++) {
                const offset = (Date.now() / 800 + i * 0.25) % 1;
                const y = camera.y + canvas.height - 50 - offset * 500;
                const wobble = Math.sin(Date.now() / 300 + i) * 10;
                
                ctx.beginPath();
                ctx.arc(thermal.x + wobble, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
        
        // Collection effects (floating text)
        this.collectEffects.forEach(effect => {
            ctx.save();
            ctx.globalAlpha = Math.min(effect.life, 1);
            ctx.fillStyle = effect.color || '#FFD700';
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = effect.big ? 4 : 3;
            ctx.font = effect.big ? 'bold 28px "Permanent Marker"' : 'bold 20px "Permanent Marker"';
            
            const x = effect.fixed ? effect.x : effect.x - 20;
            const y = effect.y;
            
            ctx.strokeText(effect.text, x, y);
            ctx.fillText(effect.text, x, y);
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
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    darkenColor(color) {
        // Simple color darkening
        const colors = {
            '#90EE90': '#228B22',
            '#8FBC8F': '#2E8B57',
            '#228B22': '#006400',
            '#A0522D': '#8B4513',
            '#4682B4': '#2E5D87',
            '#F0F8FF': '#B0C4DE'
        };
        return colors[color] || '#228B22';
    }
    
    reset() {
        this.grounds.forEach(g => {
            Matter.World.remove(this.engine.world, g.body);
        });
        this.grounds = [];
        this.stars = [];
        this.spaceStars = [];
        this.cranes = [];
        this.shootingStars = [];
        this.clouds = [];
        this.thermals = [];
        this.windZones = [];
        this.collectEffects = [];
        this.currentLocationName = null;
        this.shootingStarTimer = 0;
        this.createInitialWorld();
    }
    
    getCollectedStarValue() {
        const regularStars = this.stars.filter(s => s.collected).reduce((sum, s) => sum + (s.value || 10), 0);
        const spaceStarsValue = this.spaceStars.filter(s => s.collected).reduce((sum, s) => sum + s.value, 0);
        return regularStars + spaceStarsValue;
    }
}

export default World;

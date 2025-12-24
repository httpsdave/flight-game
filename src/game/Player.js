import Matter from 'matter-js';

class Player {
    constructor(engine, x, y, upgrades) {
        this.engine = engine;
        this.upgrades = upgrades;
        
        const width = 50;
        const height = 25;
        
        // Better physics for paper airplane feel
        this.body = Matter.Bodies.trapezoid(x, y, width, height, 0.3, {
            density: 0.0015 / (upgrades.weight * 0.8),
            friction: 0.01,
            frictionAir: 0.012 / (upgrades.aero * 0.7),
            restitution: 0.15,
            label: 'player'
        });
        
        Matter.World.add(engine.world, this.body);
        
        this.boostFuel = upgrades.fuel * 100;
        this.maxBoostFuel = upgrades.fuel * 100;
        this.isBoosting = false;
        
        // Lift coefficient based on aero upgrade
        this.liftCoef = 0.00015 * upgrades.aero;
        
        // Trail particles
        this.trail = [];
    }
    
    handleInput(keys) {
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed < 0.3) return;
        
        // Pitch up - apply lift force
        if (keys['w'] || keys['arrowup']) {
            const liftForce = speed * this.liftCoef * this.upgrades.aero;
            Matter.Body.applyForce(this.body, this.body.position, {
                x: 0,
                y: -liftForce
            });
        }
        
        // Pitch down - dive for speed
        if (keys['s'] || keys['arrowdown']) {
            Matter.Body.applyForce(this.body, this.body.position, {
                x: 0.0003,
                y: 0.0006
            });
        }
        
        // Boost with spacebar
        if ((keys[' '] || keys['space']) && this.boostFuel > 0) {
            this.isBoosting = true;
            this.boostFuel = Math.max(0, this.boostFuel - 0.8);
            
            const angle = this.body.angle;
            Matter.Body.applyForce(this.body, this.body.position, {
                x: Math.cos(angle) * 0.004,
                y: Math.sin(angle) * 0.004
            });
        } else {
            this.isBoosting = false;
        }
    }
    
    update(deltaTime) {
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // Apply lift based on forward speed
        if (speed > 2 && velocity.x > 0) {
            const lift = speed * this.liftCoef * 0.5;
            Matter.Body.applyForce(this.body, this.body.position, {
                x: 0,
                y: -lift
            });
        }
        
        // Auto-rotate plane to face velocity direction
        const targetAngle = Math.atan2(velocity.y, velocity.x);
        const currentAngle = this.body.angle;
        
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        Matter.Body.setAngle(this.body, currentAngle + angleDiff * 0.12);
        
        // Update trail
        if (speed > 1) {
            this.trail.push({
                x: this.body.position.x - Math.cos(this.body.angle) * 25,
                y: this.body.position.y - Math.sin(this.body.angle) * 25,
                life: 1
            });
        }
        
        // Fade trail
        this.trail = this.trail.filter(p => {
            p.life -= 0.02;
            return p.life > 0;
        });
        
        // Limit trail length
        if (this.trail.length > 30) {
            this.trail.shift();
        }
    }
    
    render(ctx) {
        const pos = this.body.position;
        const angle = this.body.angle;
        
        // Draw trail
        this.trail.forEach((p, i) => {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(28, 6);
        ctx.lineTo(-28, -16);
        ctx.lineTo(-28, 16);
        ctx.closePath();
        ctx.fill();
        
        // Main body - paper airplane shape
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(28, 0);
        ctx.lineTo(-25, -14);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-25, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Top wing fold
        ctx.fillStyle = '#F0F0F0';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-20, -20);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Bottom wing fold
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-20, 20);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Center fold line
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(-18, 0);
        ctx.stroke();
        
        // Boost flame effect
        if (this.isBoosting) {
            const flameColors = ['#FF4400', '#FF8800', '#FFCC00'];
            for (let i = 0; i < 3; i++) {
                const size = 12 - i * 3;
                ctx.fillStyle = flameColors[i];
                ctx.beginPath();
                ctx.arc(-28 - i * 8 + Math.random() * 4, Math.random() * 4 - 2, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

export default Player;

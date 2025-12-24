import Matter from 'matter-js';

class Player {
    constructor(engine, x, y, upgrades) {
        this.engine = engine;
        this.upgrades = upgrades;
        
        const width = 50;
        const height = 25;
        
        this.body = Matter.Bodies.trapezoid(x, y, width, height, 0.3, {
            density: 0.002 / upgrades.weight,
            friction: 0.02,
            frictionAir: 0.015 / upgrades.aero,
            restitution: 0.2
        });
        
        Matter.World.add(engine.world, this.body);
        
        this.boostFuel = upgrades.fuel * 100;
        this.maxBoostFuel = upgrades.fuel * 100;
        this.isBoosting = false;
    }
    
    handleInput(keys) {
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed < 0.5) return;
        
        if (keys['w'] || keys['arrowup']) {
            Matter.Body.applyForce(this.body, this.body.position, {
                x: 0,
                y: -0.0008 * this.upgrades.aero
            });
        }
        
        if (keys['s'] || keys['arrowdown']) {
            Matter.Body.applyForce(this.body, this.body.position, {
                x: 0,
                y: 0.0008 * this.upgrades.aero
            });
        }
        
        if ((keys[' '] || keys['space']) && this.boostFuel > 0) {
            this.isBoosting = true;
            this.boostFuel = Math.max(0, this.boostFuel - 1);
            
            const angle = this.body.angle;
            Matter.Body.applyForce(this.body, this.body.position, {
                x: Math.cos(angle) * 0.003,
                y: Math.sin(angle) * 0.003
            });
        } else {
            this.isBoosting = false;
        }
    }
    
    update(deltaTime) {
        const velocity = this.body.velocity;
        const targetAngle = Math.atan2(velocity.y, velocity.x);
        const currentAngle = this.body.angle;
        
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        Matter.Body.setAngle(this.body, currentAngle + angleDiff * 0.15);
    }
    
    render(ctx) {
        const pos = this.body.position;
        const angle = this.body.angle;
        
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(25, 5);
        ctx.lineTo(-25, -15);
        ctx.lineTo(-25, 15);
        ctx.closePath();
        ctx.fill();
        
        // Main body
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(-25, -12);
        ctx.lineTo(-25, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Wings
        ctx.fillStyle = '#E8E8E8';
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-18, -18);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-18, 18);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Detail lines
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-20, 0);
        ctx.stroke();
        
        // Boost effect
        if (this.isBoosting) {
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = `rgba(255, ${100 + i * 50}, 0, ${0.7 - i * 0.2})`;
                ctx.beginPath();
                ctx.arc(-25 - i * 8, 0, 8 - i * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

export default Player;

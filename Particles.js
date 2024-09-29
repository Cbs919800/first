// particles.js

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = Math.random() * 2 - 1; // Random horizontal velocity between -1 and 1
        this.vy = Math.random() * -2 - 1; // Random upward velocity
        this.alpha = 1; // Opacity
        this.lifetime = 30; // Duration before disappearing
        this.size = Math.floor(Math.random() * (20 - 5 + 1)) + 5; // Random size between 5 and 20
    }

    update() {
        this.x += this.vx; // Move the particle horizontally
        this.y += this.vy; // Move the particle up
        this.alpha -= 1 / this.lifetime; // Fade out effect
    }

    isAlive() {
        return this.alpha > 0;
    }
}

const particles = [];

function createParticles(x, y) {
    for (let i = 0; i < 20; i++) { // Create 20 particles
        particles.push(new Particle(x, y));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (!particles[i].isAlive()) {
            particles.splice(i, 1); // Remove dead particles
        }
    }
}

function drawParticles(ctx) {
    ctx.save();
    for (const particle of particles) {
        ctx.fillStyle = `rgba(255, 215, 0, ${particle.alpha})`; // Gold color with fading effect
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); // Draw each particle as a small circle
        ctx.fill();
    }
    ctx.restore();
}

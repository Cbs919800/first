// setup.js
const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');
const dropButton = document.getElementById('dropButton');
const scoreElement = document.getElementById('score');
const ballValueInput = document.getElementById('ballValueInput');
const ballCountInput = document.getElementById('ballCountInput');

let balls = [];
let score = 1000; // Starting score
let ballValue = 1;
let ballCount = 1;
let maxAffordableBalls = 1;
let pendingScore = 0; // Track pending score changes
let shakeDuration = 0; // Duration for the shake effect
let shakeMagnitude = 5; // Magnitude (how strong the shake is)

const multipliers = [100, 10, 2.5, 1, 0.5, 0.25, 0.5, 1, 2.5, 10, 100];
const pegRows = 10;
const pegColumns = pegRows + 1;
const widthFactor = 1.2; // Width factor for the triangle

let pegRadius, ballRadius, pegSpacing, slotHeight, gameWidth, gameHeight, scale, gameLeft, gameTop;

// function to start screen shake effect
function startScreenShake(duration) {
    shakeDuration = duration;
}

// function to apply the screen shake effect
function applyScreenShake() {
    if (shakeDuration > 0) {
        const shakeX = (Math.random() - 0.5) * shakeMagnitude;
        const shakeY = (Math.random() - 0.5) * shakeMagnitude;
        canvas.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        shakeDuration--;
    } else {
        canvas.style.transform = '';
    }
}

// function to handle canvas resizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const margin = Math.min(canvas.width, canvas.height) * 0.08;
    const availableWidth = canvas.width - 2 * margin;
    const availableHeight = canvas.height - 2 * margin;
    scale = Math.min(availableWidth / pegColumns, availableHeight / (pegRows + 2));
    gameWidth = pegColumns * scale * widthFactor;
    gameHeight = (pegRows + 2) * scale;
    pegSpacing = scale;
    pegRadius = scale / 12;
    ballRadius = pegRadius * 1.5;
    slotHeight = scale * 1.5;
    gameLeft = (canvas.width - gameWidth) / 2;
    gameTop = (canvas.height - gameHeight) / 2;
}

// resizing event listener
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// function to draw the pegs
function drawPegs() {
    ctx.fillStyle = '#fff';
    for (let row = 0; row < pegRows; row++) {
        for (let col = 0; col <= row; col++) {
            const x = gameLeft + (pegColumns - row) * scale / 2 * widthFactor + col * scale * widthFactor;
            const y = gameTop + (row + 1) * scale;
            ctx.beginPath();
            ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }
}

// function to draw the walls
function drawWalls() {
    ctx.fillStyle = '#fff';
    const wallMargin = 45;
    const wallWidth = 10;
    ctx.fillRect(gameLeft + wallMargin, gameTop, wallWidth, gameHeight);
    ctx.fillRect(gameLeft + gameWidth - wallWidth - wallMargin, gameTop, wallWidth, gameHeight);
}

// function to draw the slots
function drawSlots() {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const slotY = gameTop + (pegRows + 1) * scale;
    const getWeight = (mult) => Math.pow(1 / mult, 0.3);
    const totalWeight = multipliers.reduce((sum, mult) => sum + getWeight(mult), 0);
    const scalingFactor = 0.9;
    let totalSlotWidth = 0;

    // First pass: Calculate total width of all slots
    for (let i = 0; i < multipliers.length; i++) {
        const weight = getWeight(multipliers[i]);
        const slotWidth = (weight / totalWeight) * gameWidth * scalingFactor;
        totalSlotWidth += slotWidth;
    }

    let currentX = gameLeft + (gameWidth - totalSlotWidth) / 2;

    // Second pass: Draw each slot
    for (let i = 0; i < multipliers.length; i++) {
        const weight = getWeight(multipliers[i]);
        const slotWidth = (weight / totalWeight) * gameWidth * scalingFactor;
        const fontSize = Math.min(scale / 3, slotWidth / 2);
        ctx.font = `${fontSize}px Arial`;
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(currentX, slotY, slotWidth, slotHeight);
        const textX = currentX + slotWidth / 2;
        const textY = slotY + slotHeight / 2 + fontSize / 3;
        ctx.fillText(`${multipliers[i]}x`, textX, textY);
        currentX += slotWidth;
    }
}

// function to draw the balls
function drawBalls() {
    ctx.fillStyle = '#fff';
    for (let ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}

// function to update the ball positions
function updateBalls() {
    for (let i = balls.length - 1; i >= 0; i--) {
        let ball = balls[i];
        ball.y += ball.vy;
        ball.vy += 0.2 * scale / 200;
        
        for (let row = 0; row < pegRows; row++) {
            for (let col = 0; col <= row; col++) {
                const pegX = gameLeft + (pegColumns - row) * scale / 2 * widthFactor + col * scale * widthFactor;
                const pegY = gameTop + (row + 1) * scale;
                const dx = ball.x - pegX;
                const dy = ball.y - pegY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < ballRadius + pegRadius) {
                    const angle = Math.atan2(dy, dx);
                    const newX = pegX + (ballRadius + pegRadius) * Math.cos(angle);
                    const newY = pegY + (ballRadius + pegRadius) * Math.sin(angle);

                    if (ball.y > newY) {
                        ball.y = newY - ballRadius;
                    } else {
                        ball.y = newY;
                    }

                    const normalX = Math.cos(angle);
                    const normalY = Math.sin(angle);
                    const dotProduct = ball.vx * normalX + ball.vy * normalY;
                    ball.vx -= dotProduct * normalX * 2;
                    ball.vy -= dotProduct * normalY * 2;
                    ball.vx *= 0.3;
                    ball.vy *= 0.3;

                    if (Math.abs(ball.vx) < 0.1) {
                        ball.vx = (Math.random() - 0.5) * scale / 22.5;
                    }
                }
            }
        }

        ball.x += ball.vx;

        const wallMargin = 45;
        const wallWidth = 10;

        if (ball.x < gameLeft + wallMargin + ballRadius || ball.x > gameLeft + gameWidth - wallWidth - wallMargin - ballRadius) {
            ball.vx *= -0.5;
            ball.x = Math.max(gameLeft + wallMargin + ballRadius, Math.min(gameLeft + gameWidth - wallWidth - wallMargin - ballRadius, ball.x));
        }

        const slotY = gameTop + (pegRows + 1) * scale;
        if (ball.y > slotY) {
            const getWeight = (mult) => Math.pow(1 / mult, 0.3);
            const totalWeight = multipliers.reduce((sum, mult) => sum + getWeight(mult), 0);
            const scalingFactor = 0.9;
            let currentX = gameLeft + (gameWidth - gameWidth * scalingFactor) / 2;
            let slotIndex = -1;

            for (let j = 0; j < multipliers.length; j++) {
                const weight = getWeight(multipliers[j]);
                const slotWidth = (weight / totalWeight) * gameWidth * scalingFactor;
                if (ball.x >= currentX && ball.x < currentX + slotWidth) {
                    slotIndex = j;
                    break;
                }
                currentX += slotWidth;
            }

            if (slotIndex >= 0 && slotIndex < multipliers.length) {
                pendingScore += multipliers[slotIndex] * ball.value;
                // Commented out sound playing:
                // if (multipliers[slotIndex] === 10) {
                //     createParticles(ball.x, ball.y);
                // }
            }
            balls.splice(i, 1);
        }
    }
}

// function to update the score
function updateScore() {
    scoreElement.textContent = `Score: ${Math.floor(score)} - Balls Left: ${maxAffordableBalls}`;
}

// function to handle dropping balls
dropButton.addEventListener('click', () => {
    const totalCost = ballValue * ballCount;
    if (ballCount > 0 && totalCost <= score) {
        score -= totalCost;
        updateScore();
        let currentBall = 0;
        const dropInterval = setInterval(() => {
            if (currentBall < ballCount) {
                balls.push({
                    x: gameLeft + gameWidth / 2,
                    y: gameTop,
                    vx: 0,
                    vy: 0,
                    value: ballValue
                });
                currentBall++;
            } else {
                clearInterval(dropInterval);
            }
        }, 100);
    }
});

// function to update frame-by-frame
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPegs();
    drawWalls();
    drawSlots();
    drawBalls();
    updateBalls();
    applyScreenShake();

    score += pendingScore;
    pendingScore = 0;

    updateScore();
    requestAnimationFrame(update);
}

// Initial update call to start the game loop
update();


// Create a Pixi Application
let app = new PIXI.Application({ 
    width: 800,         // default: 800
    height: 600,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
});

// Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

// Create a new Graphics object and draw a circle
let platform = new PIXI.Graphics();
platform.beginFill(0xFF0000); // Red color
platform.drawCircle(400, 300, 50); // Draw circle at (400,300) with radius 50
platform.endFill();

// Add the platform to the PixiJS application
app.stage.addChild(platform);

function createBall(color, x, y) {
    let ball = new PIXI.Graphics();
    ball.beginFill(color);
    ball.drawCircle(0, 0, 15); // Draw a circle with radius 15
    ball.endFill();
    ball.x = x;
    ball.y = y;

    return ball;
}

let balls = []; // Array to hold the balls

let shootBalls = []; // Variable to hold the currently shot ball
for (let i = 0; i < 10; i++) {
    let color = 0xff0000; // Example color
    let ball = createBall(color, 100 + i * 30, 100);
    balls.push(ball); // Add ball to the array
    app.stage.addChild(ball);
}

// Movement speed (pixels per frame)
let speed = 1;

// Add a ticker to move the balls
app.ticker.add((delta) => {
    // Move shoot balls
    shootBalls.forEach((ball, index) => {
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        // Check for collision with each ball in the formation
        for (let i = 0; i < balls.length; i++) {
            if (checkCollision(ball, balls[i])) {
                insertBallAtCollision(ball, i);
                shootBalls.splice(index, 1);
                break;
            }
        }
    });

    // Move formation balls
    balls.forEach(ball => {
        if (ball.targetX !== undefined) {
            // Interpolate towards the target position only if it's different enough
            if (Math.abs(ball.x - ball.targetX) > 1) {
                ball.x += (ball.targetX - ball.x) * 0.05; // Smooth interpolation
            }
        } else {
            // Continuous movement along the path
            ball.x += speed * delta;
        }
    });
});
function shootBall(event) {
    let mouseX = event.clientX - app.view.getBoundingClientRect().left;
    let mouseY = event.clientY - app.view.getBoundingClientRect().top;

    let ball = createBall(0x00ff00, 400, 300)

    shootBalls.push(ball); // Green ball from the platform
    app.stage.addChild(ball);

    let angle = Math.atan2(mouseY - 300, mouseX - 400);

    ball.vx = Math.cos(angle) * 5; // Velocity in X
    ball.vy = Math.sin(angle) * 5; // Velocity in Y

}

function updateBallPositions() {
    // Dynamically calculate the new targetX based on the current position of the first ball in the formation
    let startingX = balls.length > 0 ? balls[0].x : 100;

    for (let i = 0; i < balls.length; i++) {
        balls[i].targetX = startingX + i * 30; // Update target positions based on current formation
    }
}

// Add click event listener to the canvas
app.view.addEventListener('click', shootBall);

function checkCollision(ball1, ball2) {
    let dx = ball1.x - ball2.x;
    let dy = ball1.y - ball2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 30; // 30 is the sum of the radii of two balls (15 each)
}


function removeBalls(startIndex, endIndex) {
    for (let i = startIndex; i <= endIndex; i++) {
        app.stage.removeChild(balls[i]);
    }
    balls.splice(startIndex, endIndex - startIndex + 1);
}

function updateFormation() {

    for (let i = 0; i < balls.length; i++) {
        balls[i].targetX = 100 + i * 30; // Example: new target position
        balls[i].targetY = 100;
    }

}

function insertBallAtCollision(shotBall, closestIndex) {
    let insertIndex = closestIndex;

    // Determine whether to insert the ball before or after the closest ball
    if (shotBall.vx > 0 && shotBall.x > balls[closestIndex].x) {
        insertIndex++;
    }

    // Shift the positions of subsequent balls to make room for the new ball
    for (let i = balls.length - 1; i >= insertIndex; i--) {
        balls[i].x += 30; // Shift each subsequent ball to the right
    }

    // Calculate the x position for the shot ball
    if (insertIndex === 0) {
        shotBall.x = balls[0].x - 30; // Place it to the left of the first ball if it's the new first ball
    } else {
        shotBall.x = balls[insertIndex - 1].x + 30; // Place it next to the ball it's closest to
    }
    shotBall.y = balls[0].y; // Align y position with existing balls

    // Insert the shot ball into the formation
    balls.splice(insertIndex, 0, shotBall);
    updateBallPositions();
}
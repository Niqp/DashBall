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

function createBall(color, x, y, size = 10) {
    let ball = new PIXI.Graphics();
    ball.beginFill(color);
    ball.drawCircle(0, 0, size); // Draw a circle with radius 15
    ball.endFill();
    ball.x = x;
    ball.y = y;

    return ball;
}

const basePoint = new PIXI.Point(100, 100);

function createPointsWithDistanceAndAngle(basePoint, distance, angleInDegrees, numPoints) {
    const points = [];
  
    for (let i = 1; i < numPoints+1; i++) {
      // Convert degrees to radians
      const angleInRadians = (angleInDegrees * Math.PI) / 180;
  
      // Calculate the x and y components of the displacement vector
      const displacementX = distance * Math.cos(angleInRadians);
      const displacementY = distance * Math.sin(angleInRadians);
  
      // Calculate the coordinates of the new point
      const newX = basePoint.x + i * displacementX;
      const newY = basePoint.y + i * displacementY;
  
      // Create a new PIXI.Point and add it to the array
      const newPoint = new PIXI.Point(newX, newY);
      points.push(newPoint);
    }
  
    return points;
  }


const pathPoints = [basePoint]
pathPoints.push(...createPointsWithDistanceAndAngle(basePoint, 20, 90, 12))
pathPoints.push(...createPointsWithDistanceAndAngle(pathPoints[pathPoints.length-1], 20, 90, 10))
pathPoints.push(...createPointsWithDistanceAndAngle(pathPoints[pathPoints.length-1], 20, 10, 10))


// Function to linearly interpolate between two points
function lerp(point1, point2, t) {
    return new PIXI.Point(
        point1.x + (point2.x - point1.x) * t,
        point1.y + (point2.y - point1.y) * t
    );
}

const pathGraphics = new PIXI.Graphics();
pathGraphics.lineStyle(2, 0xFFFFFF, 1);
pathPoints.forEach((point, index) => {
    if (index === 0) pathGraphics.moveTo(point.x, point.y);
    else pathGraphics.lineTo(point.x, point.y);
});
app.stage.addChild(pathGraphics);

pathPoints.forEach(point => {
    let ball = createBall("blue", point.x, point.y, 5)
    app.stage.addChild(ball)
})


let balls = []; // Array to hold the balls
let shootBalls = []; // Variable to hold the currently shot ball

// Constants
const movementSpeed = 1; // Speed of movement in terms of points per tick

// Initialize balls tightly on the path
// Initialize balls on every interpolated path point
for (let i = 0; i < pathPoints.length; i++) {
    let ball = createBall(0xff0000, pathPoints[i].x, pathPoints[i].y);
    ball.currentPointIndex = i; // Store the current point index in the ball
    balls.push(ball);
    app.stage.addChild(ball);

    // Limit the number of balls to avoid overcrowding
    if (i >= 9) break;
}


let moveTimer = 0

const assignBallPositions = (balls, movementSpeed, delta) => {
    balls.forEach((ball) => {
        if (ball.currentPointIndex < pathPoints.length - 1) {
            const currentPoint = pathPoints[ball.currentPointIndex];
            const nextPoint = pathPoints[ball.currentPointIndex + 1];

            // Calculate direction vector
            const direction = {
                x: nextPoint.x - currentPoint.x,
                y: nextPoint.y - currentPoint.y
            };

            // Normalize the direction
            const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            const normalizedDirection = {
                x: direction.x / length,
                y: direction.y / length
            };

            // Update position
            ball.x += normalizedDirection.x * movementSpeed * delta;
            ball.y += normalizedDirection.y * movementSpeed * delta;

            // Check if ball has crossed halfway to next point
            const distanceToNextPoint = Math.sqrt(
                Math.pow(ball.x - nextPoint.x, 2) + Math.pow(ball.y - nextPoint.y, 2)
            );
            if (distanceToNextPoint < length / 2) {
                ball.currentPointIndex++;
            }
        }
    });
};



// Add a ticker to move the balls
app.ticker.add((delta) => {

    moveTimer += movementSpeed;
    // Move shoot balls
    shootBalls.forEach((ball, index) => {
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        // Check for collision with each ball in the formation
        for (let i = 0; i < balls.length; i++) {
            if (checkCollision(ball, balls[i])) {
                insertBallAtCollision(ball, i, index);
                break;
            }
        }
    });

    // Move formation balls

        assignBallPositions(balls, movementSpeed, delta)
});

function shootBall(event) {
    let mouseX = event.clientX - app.view.getBoundingClientRect().left;
    let mouseY = event.clientY - app.view.getBoundingClientRect().top;

    let ball = createBall(0x00ff00, 400, 300)
    ball.aballName = "green"

    shootBalls.push(ball); // Green ball from the platform
    app.stage.addChild(ball);

    let angle = Math.atan2(mouseY - 300, mouseX - 400);

    ball.vx = Math.cos(angle) * 5; // Velocity in X
    ball.vy = Math.sin(angle) * 5; // Velocity in Y

}


// Add click event listener to the canvas
app.view.addEventListener('click', shootBall);

function checkCollision(ball1, ball2) {
    let dx = ball1.x - ball2.x;
    let dy = ball1.y - ball2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 20; // 30 is the sum of the radii of two balls (15 each)
}


function removeBalls(startIndex, endIndex) {
    for (let i = startIndex; i <= endIndex; i++) {
        app.stage.removeChild(balls[i]);
    }
    balls.splice(startIndex, endIndex - startIndex + 1);
}


function insertBallAtCollision(shotBall, collidedIndex, shootBallIndex) {
    // Check if there's a point before and after the collided ball
    const collidedBallPointIndex = balls[collidedIndex].currentPointIndex
    const pointBefore = pathPoints[collidedBallPointIndex-1]
    const pointAfter = pathPoints[collidedBallPointIndex+1]

    // Calculate distances to the points before and after
    let distanceToBefore = pointBefore !== null ? Math.hypot(shotBall.x - pointBefore.x, shotBall.y - pointBefore.y) : Number.MAX_VALUE;
    let distanceToAfter = pointAfter !== null ? Math.hypot(shotBall.x - pointAfter.x, shotBall.y - pointAfter.y) : Number.MAX_VALUE;

    // Determine the closest point for insertion
    let insertIndex = distanceToBefore < distanceToAfter ? collidedIndex : collidedIndex+1;
    console.log(insertIndex)

    // Insert the shot ball
    shootBalls.splice(shootBallIndex, 1);
    balls.splice(insertIndex, 0, shotBall);
    console.log(balls.map((ball, index) => {
        return {[index]: ball.currentPointIndex}
    }))

    // Adjust the indices of the balls after the inserted one
    for (let i = insertIndex; i < balls.length; i++) {
        const prevPointIndex = balls[i-1].currentPointIndex
        balls[i].currentPointIndex = prevPointIndex+1;
    }
    console.log(balls.map((ball, index) => {
        return {[index]: ball.currentPointIndex}
    }))


    // Reassign ball positions
    // assignBallPositions(balls);
}
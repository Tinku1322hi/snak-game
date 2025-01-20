const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }]; // Initial snake position
let direction = { x: 0, y: 0 }; // Initial direction
let food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) }; // Food position
let score = 0;

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 200);
}

function update() {
    // Calculate the new head position
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wall Collision Detection
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        resetGame();
        return;
    }

    // Self Collision Detection
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            resetGame();
            return;
        }
    }

    // Add new head to the snake
    snake.unshift(head);

    // Check if snake eats the food
    if (head.x === food.x && head.y === food.y) {
        score++;
        food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    } else {
        // Remove the tail (snake doesn't grow)
        snake.pop();
    }
}

function draw() {
    // Clear the canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the snake
    ctx.fillStyle = "lime";
    snake.forEach(segment => ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize));

    // Draw the food
    ctx.fillStyle = "red";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    // Draw the score
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

function resetGame() {
    snake = [{ x: 10, y: 10 }]; // Reset snake to initial position
    direction = { x: 0, y: 0 }; // Reset direction
    score = 0; // Reset score
    food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) }; // Reset food position
}

// Handle keyboard input
window.addEventListener("keydown", e => {
    switch (e.key) {
        case "ArrowUp":
            if (direction.y === 0) direction = { x: 0, y: -1 }; // Prevent reversing direction
            break;
        case "ArrowDown":
            if (direction.y === 0) direction = { x: 0, y: 1 }; // Prevent reversing direction
            break;
        case "ArrowLeft":
            if (direction.x === 0) direction = { x: -1, y: 0 }; // Prevent reversing direction
            break;
        case "ArrowRight":
            if (direction.x === 0) direction = { x: 1, y: 0 }; // Prevent reversing direction
            break;
    }
});

// Start the game loop
gameLoop();
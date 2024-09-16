const gameContainer = document.getElementById("game-container");
const player = document.getElementById("player");
const scoreElement = document.getElementById("score-value");
const healthBar = document.getElementById("health");
const gameOverScreen = document.getElementById("game-over");
const finalScoreElement = document.getElementById("final-score");
const restartButton = document.getElementById("restart-button");

let score = 0;
let bulletCount = 1;
let enemiesDestroyed = 0;
let playerHealth = 100;
let gameActive = true;
let invulnerable = false;
let enemySpawnInterval;

const enemyTypes = [
  {
    name: "easy",
    image: "easy-enemy.png",
    health: 1,
    points: 10,
    shootInterval: 2000,
  },
  {
    name: "medium",
    image: "medium-enemy.png",
    health: 2,
    points: 20,
    shootInterval: 1500,
  },
  {
    name: "hard",
    image: "hard-enemy.png",
    health: 3,
    points: 30,
    shootInterval: 1000,
  },
];

const stages = [
  { enemyTypes: ["easy"], interval: 1500 },
  { enemyTypes: ["easy", "medium"], interval: 1300 },
  { enemyTypes: ["easy", "medium", "hard"], interval: 1000 },
];

let currentStage = 0;

function movePlayer(e) {
  if (!gameActive) return;
  const containerWidth = gameContainer.clientWidth;
  const playerWidth = player.clientWidth;
  let newX = e.clientX - playerWidth / 2;
  newX = Math.max(0, Math.min(newX, containerWidth - playerWidth));
  player.style.left = newX + "px";
}

function createEnemy() {
  if (!gameActive) return;
  const stage = stages[currentStage];
  const enemyType = enemyTypes.find(
    (type) =>
      type.name ===
      stage.enemyTypes[Math.floor(Math.random() * stage.enemyTypes.length)]
  );

  const enemy = document.createElement("div");
  enemy.classList.add("enemy");
  enemy.style.backgroundImage = `url(${enemyType.image})`;
  enemy.style.left = Math.random() * (gameContainer.clientWidth - 40) + "px";
  enemy.dataset.health = enemyType.health;
  enemy.dataset.points = enemyType.points;
  gameContainer.appendChild(enemy);

  const moveEnemy = setInterval(() => {
    if (!gameActive) {
      clearInterval(moveEnemy);
      enemy.remove();
      return;
    }
    const enemyRect = enemy.getBoundingClientRect();
    if (enemyRect.top > gameContainer.clientHeight) {
      clearInterval(moveEnemy);
      enemy.remove();
    } else {
      enemy.style.top = enemyRect.top + 2 + "px";
      checkPlayerEnemyCollision(enemy);
    }
  }, 20);

  // Enemy shooting
  const shootInterval = setInterval(() => {
    if (!gameActive) {
      clearInterval(shootInterval);
      return;
    }
    const enemyRect = enemy.getBoundingClientRect();
    createEnemyBullet(enemyRect.left + enemyRect.width / 2, enemyRect.bottom);
  }, enemyType.shootInterval);
}

function createBullet() {
  if (!gameActive) return;
  const playerRect = player.getBoundingClientRect();
  for (let i = 0; i < bulletCount; i++) {
    const bullet = document.createElement("div");
    bullet.classList.add("bullet");
    bullet.style.left =
      playerRect.left +
      playerRect.width / 2 -
      2.5 +
      (i - Math.floor(bulletCount / 2)) * 10 +
      "px";
    bullet.style.bottom = "70px";
    gameContainer.appendChild(bullet);

    const moveBullet = setInterval(() => {
      if (!gameActive) {
        clearInterval(moveBullet);
        bullet.remove();
        return;
      }
      const bulletRect = bullet.getBoundingClientRect();
      if (bulletRect.bottom < 0) {
        clearInterval(moveBullet);
        bullet.remove();
      } else {
        bullet.style.bottom = parseInt(bullet.style.bottom) + 5 + "px";
        checkCollision(bullet);
      }
    }, 20);
  }
}

function createEnemyBullet(x, y) {
  const bullet = document.createElement("div");
  bullet.classList.add("enemy-bullet");
  bullet.style.left = x + "px";
  bullet.style.top = y + "px";
  gameContainer.appendChild(bullet);

  const moveBullet = setInterval(() => {
    if (!gameActive) {
      clearInterval(moveBullet);
      bullet.remove();
      return;
    }
    const bulletRect = bullet.getBoundingClientRect();
    if (bulletRect.bottom > gameContainer.clientHeight) {
      clearInterval(moveBullet);
      bullet.remove();
    } else {
      bullet.style.top = bulletRect.top + 5 + "px";
      checkPlayerCollision(bullet);
    }
  }, 20);
}

function createPowerUp(x, y) {
  // ... (same as before) ...
}

function checkPowerUpCollision(powerUp) {
  // ... (same as before) ...
}

function checkCollision(bullet) {
  const bulletRect = bullet.getBoundingClientRect();
  const enemies = document.querySelectorAll(".enemy");

  enemies.forEach((enemy) => {
    const enemyRect = enemy.getBoundingClientRect();
    if (
      bulletRect.left < enemyRect.right &&
      bulletRect.right > enemyRect.left &&
      bulletRect.top < enemyRect.bottom &&
      bulletRect.bottom > enemyRect.top
    ) {
      bullet.remove();
      enemy.dataset.health--;
      if (enemy.dataset.health <= 0) {
        enemy.remove();
        score += parseInt(enemy.dataset.points);
        enemiesDestroyed++;
        scoreElement.textContent = score;

        if (enemiesDestroyed % 20 === 0) {
          createPowerUp(
            enemyRect.left + enemyRect.width / 2,
            enemyRect.top + enemyRect.height
          );
        }

        // Check for stage progression
        if (enemiesDestroyed % 50 === 0 && currentStage < stages.length - 1) {
          currentStage++;
          updateStage();
        }
      }
    }
  });
}

function checkPlayerEnemyCollision(enemy) {
  if (invulnerable) return;

  const enemyRect = enemy.getBoundingClientRect();
  const playerRect = player.getBoundingClientRect();

  if (
    enemyRect.left < playerRect.right &&
    enemyRect.right > playerRect.left &&
    enemyRect.top < playerRect.bottom &&
    enemyRect.bottom > playerRect.top
  ) {
    enemy.remove();
    takeDamage(20);
  }
}

function checkPlayerCollision(bullet) {
  if (invulnerable) return;

  const bulletRect = bullet.getBoundingClientRect();
  const playerRect = player.getBoundingClientRect();

  if (
    bulletRect.left < playerRect.right &&
    bulletRect.right > playerRect.left &&
    bulletRect.top < playerRect.bottom &&
    bulletRect.bottom > playerRect.top
  ) {
    bullet.remove();
    takeDamage(10);
  }
}

function takeDamage(amount) {
  playerHealth -= amount;
  updateHealthBar();
  flashPlayer();
  if (playerHealth <= 0) {
    gameOver();
  }
}

function flashPlayer() {
  invulnerable = true;
  let flashCount = 0;
  const flashInterval = setInterval(() => {
    player.style.opacity = player.style.opacity === "1" ? "0.5" : "1";
    flashCount++;
    if (flashCount >= 6) {
      clearInterval(flashInterval);
      player.style.opacity = "1";
      invulnerable = false;
    }
  }, 100);
}

function updateHealthBar() {
  healthBar.style.width = `${playerHealth}%`;
}

function gameOver() {
  gameActive = false;
  gameOverScreen.style.display = "block";
  finalScoreElement.textContent = score;
}

function updateStage() {
  // You can add visual indicators or messages here to show stage progression
  console.log(`Stage ${currentStage + 1} started!`);
  // Update enemy spawn interval
  clearInterval(enemySpawnInterval);
  enemySpawnInterval = setInterval(createEnemy, stages[currentStage].interval);
}

function startGame() {
  gameActive = true;
  score = 0;
  bulletCount = 1;
  enemiesDestroyed = 0;
  playerHealth = 100;
  currentStage = 0;
  invulnerable = false;
  scoreElement.textContent = "0";
  updateHealthBar();
  gameOverScreen.style.display = "none";
  player.style.opacity = "1";

  // Remove all enemies and bullets
  document
    .querySelectorAll(".enemy, .bullet, .enemy-bullet, .power-up")
    .forEach((el) => el.remove());

  // Start spawning enemies
  clearInterval(enemySpawnInterval);
  enemySpawnInterval = setInterval(createEnemy, stages[currentStage].interval);
}

function restartGame() {
  startGame();
}

gameContainer.addEventListener("mousemove", movePlayer);
gameContainer.addEventListener("click", createBullet);
restartButton.addEventListener("click", restartGame);

startGame();

// Tham số của game
const BALL_SPD = 0.5; // starting ball as a fraction of screen height per second
const BALL_SPD_MAX = 2; // max ball speed as a multiple of starting speed
const BALL_SPIN = 0.2; // ball deflection off the paddle (0 = no spin, 1 = high spin)
const BRICK_COLS = 14 // số cột
const BRICK_GAP = 0.3 // khoảng cách giữa các dòng
const BRICK_ROWS = 8; // số dòng ban đầu
const GAME_LIVES = 3; // số mạng ban đầu
const KEY_SCORE = "highscore"; // save key for local storage of high score
const MARGIN = 6; // khoảng trống phía trên viên gạch
const MAX_LEVEL = 10; // level tối đa (+2 hàng mỗi level)
const MIN_BOUCE_ANGLE = 30; // góc nảy nhỏ nhất theo phương ngang (độ)
const PADDLE_W = 0.1; // paddle width as a fraction of screen width
const PADDLE_SPD = 0.5; // fraction of screen width per second
const WALL = 0.02; // wall/ball/paddle size as a fraction of the shortest screen dimension

// Màu sắc
const COLOR_BACKGROUND = "black";
const COLOR_BALL = "violet";
const COLOR_PADDLE = "white";
const COLOR_TEXT = "white";
const COLOR_WALL = "grey";

// Nội dung
const TEXT_FONT = "Lucida Console";
const TEXT_GAME_OVER = "GAME OVER";
const TEXT_LEVELS = "Level";
const TEXT_LIVES = "Ball";
const TEXT_SCORE = "Score";
const TEXT_HIGH_SCORE = "BEST";
const TEXT_WIN = "!!! YOU WIN !!!";

// Khai báo biến
const Direction = {
    LEFT: 0,
    RIGHT: 1,
    STOP: 2
}

// Set up cho thẻ canvas
var canv = document.createElement('canvas');
document.body.appendChild(canv);
var ctx = canv.getContext('2d');

// Các biến trong game
var ball, paddle, bricks = [];
var gameOver, win;
var level, lives, score, scoreHigh;
var numBricks, textSize;

// Kích thước màn hình game
var height, width, wall;
setDimensions();

// Eventlistener
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// Set up vòng lặp của game
var timeDelta, timeLast;
requestAnimationFrame(loop);

function loop(timeNow) {
    if(!timeLast){
        timeLast = timeNow;
    }

    // Tính toán thời gian khác nhau
    timeDelta = (timeNow - timeLast) / 1000; // Chuyển về giây
    timeLast = timeNow;

    // Cập nhật
    if (!gameOver) {
        updatePaddle(timeDelta);
        updateBall(timeDelta);
        updateBricks(timeDelta);
    }

    // Vẽ thành phần
    drawBackground();
    drawWalls();
    drawPaddle();
    drawBricks();
    drawText();
    drawBall();

    // Gọi lại vòng lặp
    requestAnimationFrame(loop);
}

// Cập nhật vận tốc x và y của ball
function applyBallSpeed(angle) {
    ball.xv = ball.spd * Math.cos(angle);
    ball.yv = -ball.spd * Math.sin(angle);
}

function createBricks() {
    // kích thước của dòng
    let minY = wall;
    let maxY = ball.y - ball.h * 3.5; // ball.y - ball.h * 0.5 - ball.h * 3;
    let totalSpaceY = maxY - minY;
    let totalRows = MARGIN + BRICK_ROWS + MAX_LEVEL * 2;
    let rowH = totalSpaceY / totalRows;
    let gap = wall * BRICK_GAP;
    let h = rowH - gap;
    textSize = rowH * MARGIN * 0.5;

    // kích thước của cột
    let totalSpaceX = width - wall * 2;
    let colW = (totalSpaceX - gap) / BRICK_COLS;
    let w = colW - gap;

    // phân bố mảng bricks
    bricks = [];
    let cols = BRICK_COLS;
    let rows = BRICK_ROWS + level * 2;
    let color, left, top, rank, rankHigh, score, spdMult;
    numBricks = cols * rows;
    rankHigh = rows * 0.5 - 1;
    for ( let i = 0; i < rows; i++) {
        bricks[i] = [];
        rank = Math.floor(i * 0.5);
        score = (rankHigh - rank) * 2 + 1;
        spdMult = 1 + (rankHigh - rank) / rankHigh * (BALL_SPD_MAX - 1);
        color = getBrickColor(rank, rankHigh);
        top = wall + (MARGIN + i) * rowH;
        for (let j =0; j < cols; j++) {
            left  = wall + gap + j *colW;
            bricks[i][j] = new Brick(left, top, w, h, color, score, spdMult);
        }
    }
}

function drawBackground() {
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, canv.width, canv.height);
}

function drawBall() {
    ctx.fillStyle = COLOR_BALL;
    // ctx.fillRect(ball.x - ball.w * 0.5, ball.y - ball.h *0.5, ball.w, ball.h);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.w / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawBricks() {
    for (let row of bricks) {
        for (let brick of row) {
            if (brick == null) {
                continue;
            }
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.left, brick.top, brick.w, brick.h);
        }
    }
}

function drawPaddle() {
    ctx.fillStyle = COLOR_PADDLE;
    ctx.fillRect(paddle.x - paddle.w * 0.5, paddle.y - paddle.h *0.5, paddle.w, paddle.h);
}

function drawText() {
    ctx.fillStyle = COLOR_TEXT;

    // Kích thước và vị trí
    let labelSize = textSize * 0.5;
    let margin = wall * 2;
    let maxWidth = width - margin * 2;
    let maxWidth1 = maxWidth * 0.27;
    let maxWidth2 = maxWidth * 0.2;
    let maxWidth3 = maxWidth * 0.2;
    let maxWidth4 = maxWidth * 0.27;
    let x1 = margin;
    let x2 = width * 0.4;
    let x3 = width * 0.6;
    let x4 = width - margin;
    let yLabel = wall + labelSize;
    let yValue = yLabel + textSize * 0.9;

    // Các nhãn
    ctx.font = labelSize + "px " + TEXT_FONT;
    ctx.textAlign = "left";
    ctx.fillText(TEXT_SCORE, x1, yLabel, maxWidth1);
    ctx.textAlign = "center";
    ctx.fillText(TEXT_LIVES, x2, yLabel, maxWidth2);
    ctx.fillText(TEXT_LEVELS, x3, yLabel, maxWidth3);
    ctx.textAlign = "right";
    ctx.fillText(TEXT_HIGH_SCORE, x4, yLabel, maxWidth4);

    // Giá trị
    ctx.font = textSize + "px " + TEXT_FONT;
    ctx.textAlign = "left";
    ctx.fillText(score, x1, yValue, maxWidth1);
    ctx.textAlign = "center";
    ctx.fillText(lives + "/" + GAME_LIVES, x2, yValue, maxWidth2);
    ctx.fillText(level, x3, yValue, maxWidth3);
    ctx.textAlign = "right";
    ctx.fillText(scoreHigh, x4, yValue, maxWidth4);

    // game over
    if (gameOver) {
        let text = win ? TEXT_WIN : TEXT_GAME_OVER;
        ctx.font = textSize + "px " + TEXT_FONT;
        ctx.textAlign = "center";
        ctx.fillText(text, width * 0.5, paddle.y - textSize, maxWidth);
    }
}

function drawWalls() {
    let hwall = wall * 0.5;
    ctx.strokeStyle = COLOR_WALL;
    ctx.beginPath();
    // Trái dưới
    ctx.moveTo(hwall, height);
    // Trái trên
    ctx.lineTo(hwall, hwall);
    // Phải trên
    ctx.lineTo(width - hwall, hwall);
    // Phải dưới
    ctx.lineTo(width - hwall, height);
    ctx.stroke()
}

// red = 0, orange = 1/3, yellow = 2/3, green = 1
function getBrickColor(rank, highestRank) {
    let fraction = rank / highestRank;
    let r, g, b = 0;

    // red to orange to yellow (increase green)
    if (fraction <= 0.67) {
        r = 255;
        g = 255 * fraction / 0.67;
    }

    // yellow to green (reduce red)
    else {
        r = 255 * (1 - fraction) / 0.33;
        g = 255;
    }

    // return rgb color string
    return "rgb(" + r + ", " + g + ", " + b + ")";
}

function keyDown(ev) {
    switch (ev.keyCode) {
        case 32: // phím khoảng trắng (phóng ball một góc ngẫu nhiên)
            serve();
            if (gameOver) {
                newGame();
            }
            break;
        case 37: // mũi tên trái trên bàn phím (di chuyển paddle sang trái)
            movePaddle(Direction.LEFT);
            break;
        case 39: // mũi tên phải trên bàn phím (di chuyển paddle sang phải)
            movePaddle(Direction.RIGHT);
            break;
    }
}

function movePaddle(direction) {
    switch(direction) {
        case Direction.LEFT:
            paddle.xv = -paddle.spd;
            break;
        case Direction.RIGHT:
            paddle.xv = paddle.spd;
            break;
        case Direction.STOP:
            paddle.xv = 0;
            break;
    }
}

function keyUp(ev) {
    switch (ev.keyCode) {
        case 37: // mũi tên trái trên bàn phím (ngừng di chuyển)
        case 39: // mũi tên phải trên bàn phím (ngừng di chuyển)
            movePaddle(Direction.STOP);
            break;
    }
}

function newBall() {
    paddle = new Paddle();
    ball = new Ball();
}

function newGame() {
    gameOver = false;
    level = 0;
    lives = GAME_LIVES;
    score = 0;
    win = false;

    // lấy điểm cao nhất từ bộ nhớ cục bộ
    // https://www.w3schools.com/htmL/html5_webstorage.asp
    let scoreStr = localStorage.getItem(KEY_SCORE);
    if (scoreStr == null) {
        scoreHigh = 0;
    } else {
        scoreHigh = parseInt(scoreStr);
    }

    // Bắt đầu level mới
    newLevel();
}

function newLevel() {
    newBall();
    createBricks();
}

function outOfBounds() {
    // Ball rơi xuống thì sẽ restart lại game
    lives--;
    if (lives == 0) {
        gameOver = true;
    }
    newBall();

}

function serve() {
    // Ball đã được phóng khỏi paddle
    if (ball.yv != 0) {
        return;
    }

    // Góc ngẫu nhiên nằm trong khoảng [30,150] độ
    let minBounceAngel = MIN_BOUCE_ANGLE / 180 * Math.PI; // radians
    let range = Math.PI - minBounceAngel * 2;
    let angle = Math.random() * range + minBounceAngel;
    applyBallSpeed(angle);
}

function setDimensions() {
    height = window.innerHeight; // pixels
    width = window.innerWidth; // pixels
    wall = WALL * (height < width ? height : width);
    canv.width = width;
    canv.height = height;
    ctx.lineWidth = wall;
    ctx.textBaseline = "middle";
    newGame();
}

function spinBall() {
    let upwards = ball.yv < 0;
    let angle = Math.atan2(-ball.yv, ball.xv);
    angle += (Math.random() * Math.PI / 2 - Math.PI /4) * BALL_SPIN;

    // Giữ cho ball luôn trong khoảng 30-150 độ
    // Trường hợp có độ xoáy
    // minimum bounce angle
    let minBounceAngel = MIN_BOUCE_ANGLE / 180 * Math.PI; // radians
    if(upwards) {
        if (angle < minBounceAngel) {
            angle = minBounceAngel;
        } else if (angle > Math.PI - minBounceAngel) {
            angle = Math.PI - minBounceAngel;
        }
    } else {
        if (angle > -minBounceAngel) {
            angle = -minBounceAngel;
        } else if (angle < -Math.PI + minBounceAngel) {
            angle = -Math.PI + minBounceAngel;
        }
    }
    applyBallSpeed(angle);
}

function updateBall(delta) {
    ball.x += ball.xv * delta;
    ball.y += ball.yv * delta;

    // Ball chạm tường
    if (ball.x < wall + ball.w * 0.5) {
        ball.x = wall + ball.w * 0.5;
        ball.xv = -ball.xv;
        spinBall();
    } else if (ball.x > canv.width - wall - ball.w * 0.5) {
        ball.x = canv.width - wall - ball.w * 0.5;
        ball.xv = -ball.xv;
        spinBall();
    } else if (ball.y < wall + ball.h * 0.5) {
        ball.y = wall + ball.h * 0.5;
        ball.yv = -ball.yv;
        spinBall();
    }

    // Ball chạm thanh paddle
    if (ball.y > paddle.y - paddle.h * 0.5 - ball.h * 0.5
        && ball.y < paddle.y + paddle.h * 0.5
        && ball.x > paddle.x - paddle.w *0.5 - ball.w * 0.5
        && ball.x < paddle.x + paddle.w *0.5 + ball.w * 0.5
    ) {
        ball.y = paddle.y - paddle.h * 0.5 - ball.h * 0.5;
        ball.yv = -ball.yv;
        spinBall();
    }

    // Ball ra ngoài canvas
    if (ball.y > canv.height) {
        outOfBounds();
    }

    // Di chuyển ball bằng paddle
    if (ball.yv == 0) {
        ball.x = paddle.x;
    }
}

function updateBricks(delta) {
    // kiểm tra ball va chạm
    OUTER: for (let i = 0; i < bricks.length; i++) {
        for (let j = 0; j < BRICK_COLS; j++) {
            if (bricks[i][j] != null && bricks[i][j].intersect(ball)) {
                updateScore(bricks[i][j].score);
                ball.setSpeed(bricks[i][j].spdMult);

                // set ball to the edge of the brick
                if (ball.yv < 0) { // upwards
                    ball.y = bricks[i][j].bot + ball.h * 0.5;
                } else { // downwards
                    ball.y = bricks[i][j].top - ball.h * 0.5;
                }

                ball.yv = -ball.yv;
                bricks[i][j] = null;
                spinBall();
                numBricks--;
                break OUTER;
            }
        }
    }

    // level tiếp theo
    if (numBricks == 0) {
        if (level < MAX_LEVEL) {
            level++;
            newLevel();
        } else {
            gameOver = true;
            win = true;
        }
    }
}

function updatePaddle(delta) {
    paddle.x += paddle.xv * delta;

    // Dừng thanh paddle khi chạm tường
    if (paddle.x < wall + paddle.w * 0.5) {
        paddle.x = wall + paddle.w * 0.5;
    } else if (paddle.x > canv.width - wall - paddle.w * 0.5) {
        paddle.x = canv.width - wall - paddle.w * 0.5;
    }
}

function updateScore(brickScore) {
    score += brickScore;

    // Kiểm tra điểm cao nhất
    if (score > scoreHigh) {
        scoreHigh = score;
        localStorage.setItem(KEY_SCORE, scoreHigh);
    }
}

function Ball() {
    this.w = wall;
    this.h = wall;
    this.x = paddle.x;
    this.y = paddle.y - paddle.h / 2 - this.h / 2;
    this.spd = BALL_SPD * height;
    this.xv = 0;
    this.yv = 0;

    this.setSpeed = function(spdMult) {
        this.spd = Math.max(this.spd, BALL_SPD * height * spdMult);
    }
}

function Brick(left, top, w, h, color, score, spdMult) {
    this.w = w;
    this.h = h;
    this.bot = top + h;
    this.left = left;
    this.right = left + w;
    this.top = top;
    this.color = color;
    this.score = score;
    this.spdMult = spdMult;
    
    this.intersect = function(ball) {
        let bBot = ball.y + ball.h * 0.5;
        let bLeft = ball.x - ball.w * 0.5;
        let bRight = ball.x + ball.w * 0.5;
        let bTop = ball.y - ball.h * 0.5;
        return this.left < bRight
        && bLeft < this.right
        && this.bot > bTop
        && bBot > this.top;
    }
}

function Paddle() {
    this.w = PADDLE_W * width;
    this.h = wall;
    this.x = canv.width / 2;
    this.y = canv.height - this.h * 3;
    this.spd = PADDLE_SPD * width;
    this.xv = 0;
}
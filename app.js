// Tham số của game
const BALL_SPD = 0.5; // starting ball as a fraction of screen height per second
const BALL_SPIN = 0; // ball deflection off the paddle (0 = no spin, 1 = high spin)
const BRICK_COLS = 14 // số cột
const BRICK_GAP = 0.3 // khoảng cách giữa các dòng
const BRICK_ROWS = 8; // số dòng ban đầu
const MARGIN = 6; // khoảng trống phía trên viên gạch
const MAX_LEVEL = 10; // level tối đa (+2 hàng mỗi level)
const PADDLE_W = 0.1; // paddle width as a fraction of screen width
const PADDLE_SPD = 0.5; // fraction of screen width per second
const WALL = 0.02; // wall/ball/paddle size as a fraction of the shortest screen dimension

// Màu sắc
const COLOR_BACKGROUND = "black";
const COLOR_BALL = "violet";
const COLOR_PADDLE = "white";
const COLOR_wall = "grey";

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
var ball, paddle, bricks = [], level;

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
    updatePaddle(timeDelta);
    updateBall(timeDelta);
    updateBricks(timeDelta);

    // Vẽ thành phần
    drawBackground();
    drawWalls();
    drawPaddle();
    drawBricks();
    drawBall();

    // Gọi lại vòng lặp
    requestAnimationFrame(loop);
}

function applyBallSpeed(angle) {
    // Giữ cho ball luôn trong khoảng 30-150 độ
    // Trường hợp có độ xoáy
    if (angle < Math.PI / 6) {
        angle = Math.PI / 6;
    } else if (angle > Math.PI * 5 / 6) {
        angle = Math.PI * 5 / 6;
    }

    // Cập nhật vận tốc x và y của ball
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

    // kích thước của cột
    let totalSpaceX = width - wall * 2;
    let colW = (totalSpaceX - gap) / BRICK_COLS;
    let w = colW - gap;

    // phân bố mảng bricks
    bricks = [];
    let cols = BRICK_COLS;
    let rows = BRICK_ROWS + level * 2;
    let color, left, top, rank, rankHigh;
    rankHigh = rows * 0.5 - 1;
    for ( let i = 0; i < rows; i++) {
        bricks[i] = [];
        rank = Math.floor(i * 0.5);
        color = getBrickColor(rank, rankHigh);
        top = wall + (MARGIN + i) * rowH;
        for (let j =0; j < cols; j++) {
            left  = wall + gap + j *colW;
            bricks[i][j] = new Brick(left, top, w, h, color);
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

function drawWalls() {
    let hwall = wall * 0.5;
    ctx.strokeStyle = COLOR_wall;
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

function newGame() {
    paddle = new Paddle();
    ball = new Ball();
    level = 0;
    createBricks();
}

function outOfBounds() {
    // Ball rơi xuống thì sẽ restart lại game
    newGame();
}

function serve() {
    // Ball đã được phóng khỏi paddle
    if (ball.yv != 0) {
        return;
    }

    // Góc ngẫu nhiên nằm trong khoảng [45,135] độ
    let angle = Math.random() * Math.PI / 2 + Math.PI / 4;
    applyBallSpeed(angle);
}

function setDimensions() {
    height = window.innerHeight; // pixels
    width = window.innerWidth; // pixels
    wall = WALL * (height < width ? height : width);
    canv.width = width;
    canv.height = height;
    ctx.lineWidth = wall;
    newGame();
}

function updateBall(delta) {
    ball.x += ball.xv * delta;
    ball.y += ball.yv * delta;

    // Ball chạm tường
    if (ball.x < wall + ball.w * 0.5) {
        ball.x = wall + ball.w * 0.5;
        ball.xv = -ball.xv
    } else if (ball.x > canv.width - wall - ball.w * 0.5) {
        ball.x = canv.width - wall - ball.w * 0.5;
        ball.xv = -ball.xv;
    } else if (ball.y < wall + ball.h * 0.5) {
        ball.y = wall + ball.h * 0.5;
        ball.yv = -ball.yv;
    }

    // Ball chạm thanh paddle
    if (ball.y > paddle.y - paddle.h * 0.5 - ball.h * 0.5
        && ball.y < paddle.y + paddle.h * 0.5
        && ball.x > paddle.x - paddle.w *0.5 - ball.w * 0.5
        && ball.x < paddle.x + paddle.w *0.5 + ball.w * 0.5
    ) {
        ball.y = paddle.y - paddle.h * 0.5 - ball.h * 0.5;
        ball.yv = -ball.yv;

         // Modify the angle based of ball spin
         let angle = Math.atan2(-ball.yv, ball.xv);
         angle += (Math.random() * Math.PI / 2 - Math.PI /4) * BALL_SPIN;
         applyBallSpeed(angle);
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
                bricks[i][j] = null;
                ball.yv = -ball.yv;
                break OUTER;
            }
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

function Ball() {
    this.w = wall;
    this.h = wall;
    this.x = paddle.x;
    this.y = paddle.y - paddle.h / 2 - this.h / 2;
    this.spd = BALL_SPD * height;
    this.xv = 0;
    this.yv = 0;
}

function Brick(left, top, w, h, color) {
    this.w = w;
    this.h = h;
    this.bot = top + h;
    this.left = left;
    this.right = left + w;
    this.top = top;
    this.color = color;
    
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
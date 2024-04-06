// Tham số của game
const BALL_SPD = 0.5; // starting ball as a fraction of screen width per second
const BALL_SPIN = 0.2; // ball deflection off the paddle (0 = no spin, 1 = high spin)
const HEIGHT = 550; // pixels
const PADDLE_SPD = 0.7; // fraction of screen width per second

// Kích thước màn hình game
const WIDTH = HEIGHT * 0.9;
const WALL = WIDTH / 50;
const BALL_SIZE = WALL;
const PADDLE_H = WALL;
const PADDLE_W = PADDLE_H * 5;

// Màu sắc
const COLOR_BACKGROUND = "black";
const COLOR_BALL = "violet";
const COLOR_PADDLE = "white";
const COLOR_WALL = "grey";

// Khai báo biến
const Direction = {
    LEFT: 0,
    RIGHT: 1,
    STOP: 2
}

// Set up cho thẻ canvas
var canv = document.createElement('canvas');
canv.width = WIDTH;
canv.height = HEIGHT;
document.body.appendChild(canv);

// Set up the context
var ctx = canv.getContext('2d');
ctx.lineWidth = WALL;

// Các biến trong game
var ball, paddle;

// Chạy game
newGame();

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

    // Vẽ nền
    drawBackground();
    drawWalls();
    drawPaddle();
    drawBall();

    // Gọi lại vòng lặp
    requestAnimationFrame(loop);
}

function applyBallSpeed(angle) {
    // Giữ cho ball luôn trong khoảng 30-150 độ
    if (angle < Math.PI / 6) {
        angle = Math.PI / 6;
    } else if (angle > Math.PI * 5 / 6) {
        angle = Math.PI * 5 / 6;
    }

    // Cập nhật vận tốc x và y của ball
    ball.xv = ball.spd * Math.cos(angle);
    ball.yv = -ball.spd * Math.sin(angle);
}

function drawBackground() {
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, canv.width, canv.height);
}

function drawBall() {
    ctx.fillStyle = COLOR_BALL;
    ctx.fillRect(ball.x - ball.w * 0.5, ball.y - ball.h *0.5, ball.w, ball.h);
}

function drawPaddle() {
    ctx.fillStyle = COLOR_PADDLE;
    ctx.fillRect(paddle.x - paddle.w * 0.5, paddle.y - paddle.h *0.5, paddle.w, paddle.h);
}

function drawWalls() {
    let hwall = WALL * 0.5;
    ctx.strokeStyle = COLOR_WALL;
    ctx.beginPath();
    // Trái dưới
    ctx.moveTo(hwall, HEIGHT);
    // Trái trên
    ctx.lineTo(hwall, hwall);
    // Phải trên
    ctx.lineTo(WIDTH - hwall, hwall);
    // Phải dưới
    ctx.lineTo(WIDTH - hwall, HEIGHT);
    ctx.stroke()
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

function updateBall(delta) {
    ball.x += ball.xv * delta;
    ball.y += ball.yv * delta;

    // Ball chạm tường
    if (ball.x < WALL + ball.w * 0.5) {
        ball.x = WALL + ball.w * 0.5;
        ball.xv = -ball.xv
    } else if (ball.x > canv.width - WALL - ball.w * 0.5) {
        ball.x = canv.width - WALL - ball.w * 0.5;
        ball.xv = -ball.xv;
    } else if (ball.y < WALL + ball.h * 0.5) {
        ball.y = WALL + ball.h * 0.5;
        ball.yv = -ball.yv;

        // Modify the angle based of ball spin
        let angle = Math.atan2(-ball.yv, ball.xv);
        angle += (Math.random() * Math.PI / 2 - Math.PI /4) * BALL_SPIN;
        applyBallSpeed(angle);
    }

    // Ball chạm thanh paddle
    if (ball.y > paddle.y - paddle.h * 0.5 - ball.h * 0.5
        && ball.y < paddle.y
        && ball.x > paddle.x - paddle.w *0.5 - ball.w * 0.5
        && ball.x < paddle.x + paddle.w *0.5 + ball.w * 0.5
    ) {
        ball.y = paddle.y - paddle.h * 0.5 - ball.h * 0.5;
        ball.yv = -ball.yv;
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

function updatePaddle(delta) {
    paddle.x += paddle.xv * delta;

    // Dừng thanh paddle khi chạm tường
    if (paddle.x < WALL + paddle.w * 0.5) {
        paddle.x = WALL + paddle.w * 0.5;
    } else if (paddle.x > canv.width - WALL - paddle.w * 0.5) {
        paddle.x = canv.width - WALL - paddle.w * 0.5;
    }

}

function Ball() {
    this.w = BALL_SIZE;
    this.h = BALL_SIZE;
    this.x = paddle.x;
    this.y = paddle.y - paddle.h / 2 - this.h / 2;
    this.spd = BALL_SPD * WIDTH;
    this.xv = 0;
    this.yv = 0;
}

function Paddle() {
    this.w = PADDLE_W;
    this.h = PADDLE_H;
    this.x = canv.width / 2;
    this.y = canv.height - this.h * 3;
    this.spd = PADDLE_SPD * WIDTH;
    this.xv = 0;
}
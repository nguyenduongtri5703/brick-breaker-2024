// Tham số của game
const BALL_SPD = 0.5; // tốc độ ban đầu của quả bóng dựa theo kích thước màn hình mỗi giay
const BALL_SPD_MAX = 2; // tóc độ tối đa mà quả bóng có thể đạt được
const BALL_SPIN = 0.2; // bóng lệch hướng (0 = không có, 1 = chắc chắn lệch)
const BRICK_COLS = 14 // số cột
const BRICK_GAP = 0.3 // khoảng cách giữa các dòng
const BRICK_ROWS = 8; // số dòng ban đầu
const GAME_LIVES = 3; // số mạng ban đầu
const KEY_SCORE = "highscore"; // lưu trữ điểm số cao nhất vào biến cục bộ
const MARGIN = 6; // khoảng trống phía trên viên gạch
const MAX_LEVEL = 5; // level tối đa (+2 hàng mỗi level)
const MIN_BOUCE_ANGLE = 30; // góc nảy nhỏ nhất theo phương ngang (độ)
const PADDLE_W = 0.1; // chiều rộng của paddle dựa theo kích thước màn hình
const PADDLE_SIZE = 1.5; // kích thước paddle là bội số của wall
const PADDLE_SPD = 0.5; // tốc độ thanh paddle dựa theo kích thước màn hình
const PUP_BONUS = 50; // điểm thưởng khi nhặt buff hoặc nhặt lại buff
const PUP_CHANCE = 0.1; // tỉ lệ xuất hiện buff khi phá gạch
const PUP_SPD = 0.2; // tốc độ rơi của buff
const WALL = 0.02; // kích thước tường/quả bóng dựa theo kích thước màn hình

// Màu sắc
const COLOR_BACKGROUND = "black";
const COLOR_BALL = "white";
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
const TEXT_WELCOME = "WELCOME TO MY GAME";
const TEXT_SELECT_LEVEL = "<-- SELECT LEVEL";


// Khai báo biến
const Direction = {
    LEFT: 0,
    RIGHT: 1,
    STOP: 2
}

// Các loại buff
const PupType = {
    EXTENSION: { color: "dodgerblue", symbol: "=" },
    LIFE: { color: "hotpink", symbol: "+" },
    STICKY: { color: "forestgreen", symbol: "~" },
    SUPER: { color: "magenta", symbol: "s" }
}

// Set up buff cho các level
const levelPups = {
    0: [],
    1: [PupType.EXTENSION],
    2: [PupType.SUPER, PupType.LIFE],
    3: [PupType.EXTENSION, PupType.STICKY],
    4: [PupType.EXTENSION, PupType.LIFE, PupType.SUPER],
    5: [PupType.EXTENSION, PupType.SUPER, PupType.LIFE, PupType.STICKY]
}

// Set up cho thẻ canvas
var canv = document.createElement('canvas');
document.body.appendChild(canv);
var ctx = canv.getContext('2d');

// set up hiệu ứng âm thanh
var fxBrick = new Audio("brick.m4a");
var fxPaddle = new Audio("paddle.m4a");
var fxPowerup = new Audio("powerup.m4a");
var fxWall = new Audio("wall.m4a");

// Các biến trong game
var ball, paddle, bricks = [], pups = [];
var gameOver, pupExtension, pupSticky, pupSuper, win;
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
        updatePups(timeDelta);
    }

    // Vẽ thành phần
    drawBackground();
    drawWalls();
    if (!(level == null)){
        drawText();
        drawPups();
        drawPaddle();
        drawBricks();
        drawBall();
    } else {
        drawWelcomeText();
    }

    // Gọi lại vòng lặp
    requestAnimationFrame(loop);
}

// Cập nhật vận tốc x và y của ball
function applyBallSpeed(angle) {
    ball.xv = ball.spd * Math.cos(angle);
    ball.yv = -ball.spd * Math.sin(angle);
}

// Tạo ra các hàng gạch dựa trên level
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
    // rankHigh xác định vị trí của hàng gạch, 2 hàng đầu là 0, 2 hàng tiếp theo là 1,...
    // rankHigh dùng để biết ở vị trí đó gạch có màu gì, điểm số, tốc độ
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
    ctx.fillStyle = pupSuper ? PupType.SUPER.color : COLOR_BALL;
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
    ctx.fillStyle = pupSticky ? PupType.STICKY.color : COLOR_PADDLE;
    ctx.fillRect(paddle.x - paddle.w * 0.5, paddle.y - paddle.h *0.5, paddle.w, paddle.h);
}

function drawPups() {
    ctx.lineWidth = wall * 0.35;
    for (let pup of pups) {
        ctx.fillStyle = pup.type.color;
        ctx.strokeStyle = pup.type.color;
        ctx.strokeRect(pup.x - pup.w * 0.5, pup.y - pup.h *0.5, pup.w, pup.h);
        ctx.font = "bold " + pup.h + "px " + TEXT_FONT;
        ctx.textAlign = "center";
        ctx.fillText(pup.type.symbol, pup.x, pup.y);
    }
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

function drawWelcomeText() {
    let margin = wall * 2;
    let labelSize = textSize * 0.5;
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = labelSize + "px " + TEXT_FONT;
    let xWelcome = width * 0.3;
    let xSelect = width * 0.3;
    let yWelcome = height * 0.4;
    let ySelect = height * 0.6;
    ctx.fillText(TEXT_WELCOME, xWelcome, yWelcome, width - margin * 2);
    ctx.fillText(TEXT_SELECT_LEVEL, xSelect, ySelect, width - margin * 2);
}

function drawWalls() {
    let hwall = wall * 0.5;
    ctx.lineWidth = wall;
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

// Tạo màu cho các hàng gạch
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

// Sự kiện khi nhấn phím xuống
function keyDown(ev) {
    switch (ev.keyCode) {
        case 32: // phím khoảng trắng (phóng ball một góc ngẫu nhiên)
            serve();
            if (gameOver) {
                newGame();
            }
            pupSticky = false;
            break;
        case 37: // mũi tên trái trên bàn phím (di chuyển paddle sang trái)
            movePaddle(Direction.LEFT);
            break;
        case 39: // mũi tên phải trên bàn phím (di chuyển paddle sang phải)
            movePaddle(Direction.RIGHT);
            break;
    }
}

// Di chuyển paddle
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

// Sự kiện khi thả phím
function keyUp(ev) {
    switch (ev.keyCode) {
        case 37: // mũi tên trái trên bàn phím (ngừng di chuyển)
        case 39: // mũi tên phải trên bàn phím (ngừng di chuyển)
            movePaddle(Direction.STOP);
            break;
    }
}

// chọn level, gán level thành level đang được chọn
function selectedLevel(selectedLevel) {
    // Cập nhật level
    level = selectedLevel;

    // Tạo level mới
    newGame();

}

// Tạo ra quả bóng
function newBall() {
    pupExtension = false;
    pupSticky = false;
    pupSuper = false;
    paddle = new Paddle();
    ball = new Ball();
}

// Tạo màn hình trò chơi
function newGame() {
    gameOver = false;
    lives = GAME_LIVES;
    // level = 0;
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

// Tạo level
function newLevel() {
    pups = [];
    newBall();
    createBricks();
}

// Bóng rơi ra ngoài
function outOfBounds() {
    // Ball rơi xuống thì sẽ restart lại game
    lives--;
    if (lives == 0) {
        gameOver = true;
    }
    newBall();

}

// Phóng quả bóng
function serve() {
    // Ball đã được phóng khỏi paddle
    if (ball.yv != 0) {
        return;
    }

    // Góc ngẫu nhiên nằm trong khoảng [30,150] độ
    let minBounceAngel = MIN_BOUCE_ANGLE / 180 * Math.PI; // radians
    let range = Math.PI - minBounceAngel * 2;
    let angle = Math.random() * range + minBounceAngel;
    applyBallSpeed(pupSticky ? Math.PI / 2 : angle);
    fxPaddle.play();
}

// Kích thước màn hình
function setDimensions() {
    height = window.innerHeight; // pixels
    width = height * 1.4; // pixels
    wall = WALL * (height < width ? height : width);
    canv.width = width;
    canv.height = height;
    ctx.textBaseline = "middle";
    newGame();
}

// Tạo độ xoáy cho quả bóng
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

// Cập nhật quả bóng khi va chạm với các vật thể
function updateBall(delta) {
    ball.x += ball.xv * delta;
    ball.y += ball.yv * delta;

    // Ball chạm tường
    if (ball.x < wall + ball.w * 0.5) {
        ball.x = wall + ball.w * 0.5;
        ball.xv = -ball.xv;
        fxWall.play();
        spinBall();
    } else if (ball.x > canv.width - wall - ball.w * 0.5) {
        ball.x = canv.width - wall - ball.w * 0.5;
        ball.xv = -ball.xv;
        fxWall.play();
        spinBall();
    } else if (ball.y < wall + ball.h * 0.5) {
        ball.y = wall + ball.h * 0.5;
        ball.yv = -ball.yv;
        fxWall.play();
        spinBall();
    }

    // Ball chạm thanh paddle
    if (ball.y > paddle.y - paddle.h * 0.5 - ball.h * 0.5
        && ball.y < paddle.y + paddle.h * 0.5
        && ball.x > paddle.x - paddle.w *0.5 - ball.w * 0.5
        && ball.x < paddle.x + paddle.w *0.5 + ball.w * 0.5
    ) {
        ball.y = paddle.y - paddle.h * 0.5 - ball.h * 0.5;
        if (pupSticky) {
            ball.xv = 0;
            ball.yv = 0;
        }
        else if (pupSuper){
            pupSuper = false;
        } 
        else {
            ball.yv = -ball.yv;
            spinBall();
        }
        fxPaddle.play();
    }

    // Ball ra ngoài canvas
    if (ball.y > canv.height) {
        outOfBounds();
    }
}

// Cập nhật các hàng gạch
function updateBricks(delta) {
    // kiểm tra ball va chạm
    OUTER: for (let i = 0; i < bricks.length; i++) {
        for (let j = 0; j < BRICK_COLS; j++) {
            if (bricks[i][j] != null && bricks[i][j].intersect(ball)) {
                updateScore(bricks[i][j].score);
                ball.setSpeed(bricks[i][j].spdMult);

                // giữ quả bóng không bị đi xuyên qua viên gạch
                if (ball.yv < 0) { // đi lên
                    ball.y = bricks[i][j].bot + ball.h * 0.5;
                } else { // di xuống
                    ball.y = bricks[i][j].top - ball.h * 0.5;
                }

                // Tạo buff
                if (Math.random() < PUP_CHANCE) {
                    let currentPups = levelPups[level];
                    if (currentPups.length != 0) {
                        let pupType = currentPups[Math.floor(Math.random() * currentPups.length)];
                        let px = bricks[i][j].left + bricks[i][j].w / 2;
                        let py = bricks[i][j].top + bricks[i][j].h / 2;
                        let pSize = bricks[i][j].w / 2;
                        // let pKeys = Object.keys(PupType);
                        // let pKey = pKeys[Math.floor(Math.random() * pKeys.length)];
                        pups.push(new PowerUp(px, py, pSize, pupType));
                    } else {
                        return;
                    }
                }

                // Chạm viên gạch và phá hủy nếu không phải là super ball
                if (!pupSuper) {
                    ball.yv = -ball.yv;
                }
                bricks[i][j] = null;
                numBricks--;
                fxBrick.play();
                spinBall();
                break OUTER;
            }
        }
    }

    // level tiếp theo
    if (numBricks == 0) {
        // if (level < MAX_LEVEL) {
        //     level++;
        //     newLevel();
        // } else {
        //     gameOver = true;
        //     win = true;
        // }
        gameOver = true;
        win = true;
    }
}

// Cập nhật thanh paddle
function updatePaddle(delta) {
    // Di chuyển thanh paddle
    let lastPaddleX = paddle.x; // điểm cuối trước khi di chuyển
    paddle.x += paddle.xv * delta;

    // Dừng thanh paddle khi chạm tường
    if (paddle.x < wall + paddle.w * 0.5) {
        paddle.x = wall + paddle.w * 0.5;
    } else if (paddle.x > canv.width - wall - paddle.w * 0.5) {
        paddle.x = canv.width - wall - paddle.w * 0.5;
    }

    // Di chuyển ball bằng paddle
    if (ball.yv == 0) {
        ball.x += paddle.x - lastPaddleX;
    }

    // Thu thập buff
    for  (let i = pups.length - 1; i >= 0; i--) {
        if (
            pups[i].x + pups[i].w * 0.5 > paddle.x - paddle.w * 0.5
            && pups[i].x + pups[i].w * 0.5 < paddle.x + paddle.w * 0.5
            && pups[i].y + pups[i].h * 0.5 > paddle.y - paddle.h * 0.5
            && pups[i].y + pups[i].h * 0.5 < paddle.y + paddle.h * 0.5
        ) {
            switch(pups[i].type) {
                case PupType.EXTENSION:
                    // Gấp đôi chiều rộng của paddle
                    if (pupExtension) {
                        score += PUP_BONUS;
                    } else {
                        pupExtension = true;
                        paddle.w *= 2;
                    }
                    break;
                case PupType.LIFE:
                    // Thêm mạng;
                    lives++;
                    break;
                case PupType.STICKY:
                    // Sẽ được 1 lần bắt dính trái banh lại
                    if (pupSticky) {
                        score += PUP_BONUS;
                    } else {
                        pupSticky = true;
                    }
                    break;
                case PupType.SUPER:
                    // Bánh siêu cấp xuyên phá tất cả
                    if (pupSuper) {
                        score += PUP_BONUS;
                    } else {
                        pupSuper = true;
                    }
                    break;
            }
            pups.splice(i, 1);
            fxPowerup.play();
        }
    }
}

// Cập nhật các buff khi xuất hiện, được thu thập
function updatePups(delta) {
    for  (let i = pups.length - 1; i >= 0; i--) {
        pups[i].y += pups[i].yv * delta;

        // Xóa khỏi màn hình
        if (pups[i].y - pups[i].h * 0.5 > height) {
            pups.splice(i, 1);
        }
    }
}

// Cập nhật điểm số
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

    // set tốc độ quả bóng
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
    
    // kiểm tra có va chạm với viên gách hay không
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
    this.h = wall * PADDLE_SIZE;
    this.x = canv.width / 2;
    this.y = canv.height - wall * 3.5 + this.h /2;
    this.spd = PADDLE_SPD * width;
    this.xv = 0;
}

function PowerUp(x, y, size, type) {
    this.w = size;
    this.h = size;
    this.x = x;
    this.y = y;
    this.type = type;
    this.yv = PUP_SPD * height;
}

let infor = document.querySelector('.infor');
function showInfor() {
    infor.style.display = "block";
}

function hideInfor() {
    infor.style.display = "none";
}
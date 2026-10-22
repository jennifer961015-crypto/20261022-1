// ==========================================
// 美味食物名稱與圖示配對拖曳題測驗系統 (完美修正版)
// ==========================================

// 測驗資料：6 種不同的食物，使用內建 Emoji 圖示，絕對不會發生 404 載入錯誤
let quizData = [
  { id: 1, name: "漢堡",     icon: "🍔" },
  { id: 2, name: "披薩",     icon: "🍕" },
  { id: 3, name: "壽司",     icon: "🍣" },
  { id: 4, name: "義大利麵", icon: "🍝" },
  { id: 5, name: "薯條",     icon: "🍟" },
  { id: 6, name: "牛排",     icon: "🥩" }
];

// 系統狀態變數
let targetSlots = [];       // 上方固定的 6 個圖示目標放置區
let dragItems = [];         // 下方可以隨意拖曳的 6 個食物名稱文字選項（每次隨機打亂）
let draggedItem = null;     // 目前正在被滑鼠/觸控拖曳的項目
let submitButton;           // 交卷按鈕
let scoreResult = null;     // 測驗結果分數（百分比）
let confettiParticles = []; // 彩帶特效的粒子陣列

function setup() {
  // 建立全螢幕響應式畫布
  createCanvas(windowWidth, windowHeight);
  
  // 初始化遊戲版面與物件位置
  initGameLayout();

  // 建立交卷按鈕
  submitButton = createButton('交卷看成績');
  styleSubmitButton();
  submitButton.mousePressed(checkAnswers);
}

function draw() {
  background(245, 247, 250); // 設定柔和的背景色

  // 1. 繪製標題與說明文字
  drawHeader();

  // 2. 繪製上方固定的圖示目標區外框與 Emoji 圖示
  for (let slot of targetSlots) {
    slot.display();
  }

  // 3. 繪製下方可拖曳的文字選項
  for (let item of dragItems) {
    item.display();
  }

  // 4. 如果已經計算出成績，顯示成績面板
  if (scoreResult !== null) {
    drawScoreBoard();
    
    // 當成績高於 80% 時，持續更新與繪製彩帶特效
    if (scoreResult > 80) {
      updateAndDrawConfetti();
    }
  }
}

// ------------------------------------------
// 初始化版面與物件位置
// ------------------------------------------
function initGameLayout() {
  targetSlots = [];
  dragItems = [];
  scoreResult = null;
  confettiParticles = [];

  let cols = 3; // 每行顯示 3 個項目
  let totalItems = quizData.length;

  // 隨機打亂下方文字選項的順序，增加測驗趣味性
  let shuffledData = [...quizData].sort(() => Math.random() - 0.5);

  // 計算上方固定圖像區的寬高與間距
  let slotWidth = min(width * 0.25, 180);
  let slotHeight = 140;
  let startXTop = (width - (cols * slotWidth + (cols - 1) * 30)) / 2;
  let startYTop = 95;

  for (let i = 0; i < totalItems; i++) {
    let r = floor(i / cols);
    let c = i % cols;
    let x = startXTop + c * (slotWidth + 30);
    let y = startYTop + r * (slotHeight + 15);

    // 依序建立上方目標槽物件（放入正確的 quizData[i]，確保答案判定正確）
    targetSlots.push(new TargetSlot(x, y, slotWidth, slotHeight, quizData[i]));
  }

  // 計算下方可拖曳文字選項的起始位置（放在上方區域下方）
  let itemWidth = 130;
  let itemHeight = 45;
  let startYBottom = startYTop + 2 * (slotHeight + 15) + 20;
  let startXBottom = (width - (cols * itemWidth + (cols - 1) * 20)) / 2;

  for (let i = 0; i < totalItems; i++) {
    let r = floor(i / cols);
    let c = i % cols;
    let x = startXBottom + c * (itemWidth + 20);
    let y = startYBottom + r * (itemHeight + 12);

    // 建立隨機打亂順序的可拖曳項目物件
    dragItems.push(new DragItem(x, y, itemWidth, itemHeight, shuffledData[i]));
  }
}

// ------------------------------------------
// 繪製頂部標題說明
// ------------------------------------------
function drawHeader() {
  push();
  textAlign(CENTER, CENTER);
  fill(50, 50, 70);
  textSize(22);
  textStyle(BOLD);
  text("🍔 美味食物名稱配對大挑戰 🍕", width / 2, 28);
  
  textSize(14);
  fill(100, 100, 120);
  textStyle(NORMAL);
  text("請將下方的「食物名稱文字」拖曳到上方對應的「正確食物圖示」方框中", width / 2, 55);
  pop();
}

// ------------------------------------------
// 設定交卷按鈕樣式
// ------------------------------------------
function styleSubmitButton() {
  submitButton.position(width / 2 - 75, height - 50);
  submitButton.size(150, 40);
  submitButton.style('background-color', '#FF6B6B');
  submitButton.style('color', 'white');
  submitButton.style('font-size', '16px');
  submitButton.style('font-weight', 'bold');
  submitButton.style('border', 'none');
  submitButton.style('border-radius', '20px');
  submitButton.style('cursor', 'pointer');
  submitButton.style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)');
}

// ------------------------------------------
// 滑鼠點擊事件：選取下方可拖曳項目
// ------------------------------------------
function mousePressed() {
  for (let item of dragItems) {
    if (item.contains(mouseX, mouseY)) {
      draggedItem = item;
      item.isDragging = true;
      item.offsetX = mouseX - item.x;
      item.offsetY = mouseY - item.y;
      break;
    }
  }
}

// ------------------------------------------
// 滑鼠拖曳中事件：更新物件座標
// ------------------------------------------
function mouseDragged() {
  if (draggedItem) {
    draggedItem.x = mouseX - draggedItem.offsetX;
    draggedItem.y = mouseY - draggedItem.offsetY;
  }
}

// ------------------------------------------
// 滑鼠放開事件：結束拖曳並判定是否吸附到目標槽
// ------------------------------------------
function mouseReleased() {
  if (draggedItem) {
    draggedItem.isDragging = false;
    
    // 檢查是否放置在某個上方目標槽的範圍內
    for (let slot of targetSlots) {
      if (slot.contains(draggedItem.x + draggedItem.w/2, draggedItem.y + draggedItem.h/2)) {
        // 自動置中吸附到目標槽下方
        draggedItem.x = slot.x + (slot.w - draggedItem.w) / 2;
        draggedItem.y = slot.y + slot.h - 52;
        draggedItem.currentSlot = slot;
        break;
      }
    }
    draggedItem = null;
  }
}

// ------------------------------------------
// 檢查答案與計算成績
// ------------------------------------------
function checkAnswers() {
  let correctCount = 0;
  let totalCount = quizData.length;

  for (let slot of targetSlots) {
    let occupant = dragItems.find(item => item.currentSlot === slot);
    if (occupant && occupant.data.id === slot.data.id) {
      correctCount++;
    }
  }

  scoreResult = (correctCount / totalCount) * 100;

  // 如果成績大於 80%，啟動彩帶特效
  if (scoreResult > 80) {
    initConfetti();
  }
}

// ------------------------------------------
// 顯示成績結算面板
// ------------------------------------------
function drawScoreBoard() {
  push();
  rectMode(CENTER);
  fill(255, 255, 255, 245);
  stroke(200);
  strokeWeight(2);
  rect(width / 2, height / 2, 340, 180, 15);

  noStroke();
  textAlign(CENTER, CENTER);
  fill(50, 50, 70);
  textSize(20);
  textStyle(BOLD);
  text("測驗結算結果", width / 2, height / 2 - 45);

  textSize(34);
  fill(scoreResult > 80 ? '#2ECC71' : '#E74C3C');
  text(`${scoreResult.toFixed(0)}%`, width / 2, height / 2 - 5);

  textSize(15);
  fill(100, 100, 100);
  textStyle(NORMAL);
  if (scoreResult > 80) {
    text("🎉 太棒了！完美配對成功！", width / 2, height / 2 + 40);
  } else {
    text("💪 部分配對錯誤，再試一次吧！", width / 2, height / 2 + 40);
  }
  pop();
}

// ------------------------------------------
// 彩帶特效系統
// ------------------------------------------
function initConfetti() {
  confettiParticles = [];
  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: random(width),
      y: random(-height, 0),
      size: random(8, 14),
      color: color(random(255), random(255), random(255)),
      speedY: random(2, 5),
      speedX: random(-1.5, 1.5),
      angle: random(TWO_PI),
      spin: random(0.02, 0.08)
    });
  }
}

function updateAndDrawConfetti() {
  push();
  for (let p of confettiParticles) {
    p.y += p.speedY;
    p.x += p.speedX + sin(p.angle) * 1;
    p.angle += p.spin;

    if (p.y > height) {
      p.y = random(-40, 0);
      p.x = random(width);
    }

    fill(p.color);
    noStroke();
    push();
    translate(p.x, p.y);
    rotate(p.angle);
    rect(0, 0, p.size, p.size * 0.6, 2);
    pop();
  }
  pop();
}

// ------------------------------------------
// 視窗大小改變時自動調整響應式畫布
// ------------------------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 檢查按鈕是否存在，避免重置時報錯
  if (submitButton) {
    submitButton.position(width / 2 - 75, height - 50);
  }
}

// ==========================================
// 上方固定目標槽（TargetSlot）類別
// ==========================================
class TargetSlot {
  constructor(x, y, w, h, data) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.data = data; // 綁定正確的食物資料與圖示
  }

  // 繪製目標槽外框與中央的食物圖示
  display() {
    push();
    // 繪製外框背景
    fill(255, 255, 255);
    stroke(210, 215, 225);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 12);

    // 繪製食物代表圖示 (Emoji)
    textAlign(CENTER, CENTER);
    textSize(50);
    text(this.data.icon, this.x + this.w / 2, this.y + this.h / 2);
    pop();
  }

  // 檢查座標是否在此目標槽內
  contains(px, py) {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }
}

// ==========================================
// 下方可拖曳項目（DragItem）類別
// ==========================================
class DragItem {
  constructor(x, y, w, h, data) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.data = data; // 綁定對應的食物名稱文字
    this.isDragging = false;
    this.currentSlot = null;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  // 繪製可拖曳的文字方塊
  display() {
    push();
    if (this.isDragging) {
      fill(255, 230, 109);
      stroke(241, 196, 15);
      strokeWeight(3);
    } else {
      fill(255, 255, 255);
      stroke(189, 195, 199);
      strokeWeight(1.5);
    }

    rect(this.x, this.y, this.w, this.h, 8);

    // 繪製食物名稱文字
    fill(50, 50, 70);
    noStroke();
    textSize(16);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(this.data.name, this.x + this.w / 2, this.y + this.h / 2);
    pop();
  }

  // 檢查滑鼠是否點擊在該文字方塊內
  contains(px, py) {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }
}
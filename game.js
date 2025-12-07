// --- Game State Variables ---
let currentNumber = 1;
let selectedDivisors = new Set();
let correctDivisors = new Set();
// localStorageを使ってスコアを保存
let highestLevel = localStorage.getItem('highestLevel') ? parseInt(localStorage.getItem('highestLevel')) : 0;
let gameActive = false;

// ボタン表示とチェックの最大範囲を40に設定（UIの都合上）
const MAX_BUTTON_DISPLAY = 40; 

// --- DOM Elements ---
const $currentNumber = document.getElementById('currentNumber');
const $divisorButtonsContainer = document.getElementById('divisorButtons');
const $checkSelectionBtn = document.getElementById('checkSelectionBtn');
const $restartBtn = document.getElementById('restartBtn');
const $highestLevel = document.getElementById('highestLevel');

// --- Custom Message Box Elements ---
const $messageBox = document.getElementById('message-box');
const $messageText = document.getElementById('message-text');
const $messageDetail = document.getElementById('message-detail');
const $closeMessageBtn = document.getElementById('closeMessageBtn');
const $messageContent = document.getElementById('message-content');

// --- Core Game Functions ---

/**
 * カスタムメッセージボックスを表示する
 * @param {string} title タイトル
 * @param {string} detail 詳細メッセージ
 * @param {string} [color='blue-500'] メッセージボックスの色 (Tailwind class)
 */
function showMessage(title, detail, color = 'blue-500') {
    $messageText.textContent = title;
    $messageDetail.innerHTML = detail; // HTMLを受け取るように変更
    // Reset and apply color
    $messageContent.classList.remove('border-green-500', 'border-red-500', 'border-blue-500');
    $messageContent.classList.add(`border-t-4`, `border-${color}`);
    $messageBox.classList.remove('hidden');
    $messageBox.classList.add('flex');
}

/**
 * 1からMAX_BUTTON_DISPLAYの範囲で、与えられた数の約数を取得する (ただし、現在の数字以下)
 * @param {number} num ターゲットの数字
 * @returns {Set<number>} 約数のSet
 */
function getCorrectDivisors(num) {
    const divisors = new Set();
    // 約数チェックの最大値は、num自身か、設定された最大表示数の小さい方
    const checkLimit = Math.min(num, MAX_BUTTON_DISPLAY);
    for (let i = 1; i <= checkLimit; i++) {
        // iがnumの約数であるかチェック
        if (num % i === 0) {
            divisors.add(i);
        }
    }
    return divisors;
}

/**
 * ボタンを現在の数字に合わせて動的に生成し、イベントリスナーを設定する
 */
function renderButtons() {
    $divisorButtonsContainer.innerHTML = '';
    // ボタンの最大値は、現在の数字か、設定された最大表示数の小さい方
    const maxButtonValue = Math.min(currentNumber, MAX_BUTTON_DISPLAY);
    
    // UI上のテキストを更新
    // game.jsからはDOMのセレクタを使ってHTML要素を取得
    const h2 = document.querySelector('.mb-6.p-4.bg-gray-100 h2');
    if (h2) {
        h2.textContent = `約数をすべて選択 (1〜${maxButtonValue})`;
    }

    for (let i = 1; i <= maxButtonValue; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.id = `btn-${i}`;
        button.className = 'divisor-btn rounded-xl shadow-md unselected';
        button.dataset.value = i;
        
        // 既に選択されている場合はスタイルを適用
        if (selectedDivisors.has(i)) {
            button.classList.add('selected');
            button.classList.remove('unselected');
        }
        
        button.addEventListener('click', () => {
            if (!gameActive) return;
            toggleSelection(i, button);
        });
        $divisorButtonsContainer.appendChild(button);
    }
    
    // 現在の数字の表示を更新（レベルアップ時以外にもボタン描画時に更新）
    $currentNumber.textContent = currentNumber;
}

/**
 * ボタンの選択状態を切り替える
 * @param {number} value ボタンの数字
 * @param {HTMLElement} button ボタン要素
 */
function toggleSelection(value, button) {
    if (selectedDivisors.has(value)) {
        selectedDivisors.delete(value);
        button.classList.remove('selected');
        button.classList.add('unselected');
    } else {
        selectedDivisors.add(value);
        button.classList.add('selected');
        button.classList.remove('unselected');
    }
}

/**
 * 選択された約数と正解を比較し、ゲームを進行または終了させる
 */
function checkSelection() {
    if (!gameActive) return;

    // 1. 選択された約数のSetと正しい約数のSetが完全に一致するか確認
    const selectedArray = Array.from(selectedDivisors).sort((a, b) => a - b);
    const correctArray = Array.from(correctDivisors).sort((a, b) => a - b);

    const isCorrect = (
        selectedArray.length === correctArray.length &&
        selectedArray.every((value, index) => value === correctArray[index])
    );

    if (isCorrect) {
        levelUp();
    } else {
        gameOver();
    }
}

/**
 * 正解した場合、レベルを上げて次の数字へ
 */
function levelUp() {
    // Success animation
    $currentNumber.classList.add('text-green-600');
    $currentNumber.style.transform = 'scale(1.1)';
    // CSSの@keyframes pulse-successはindex.htmlで定義されているため、JavaScriptから参照可能
    $checkSelectionBtn.style.animation = 'pulse-success 0.3s 3'; 
    
    setTimeout(() => {
        // Reset animation styles
        $currentNumber.classList.remove('text-green-600');
        $currentNumber.style.transform = 'scale(1)';
        $checkSelectionBtn.style.animation = 'none';

        currentNumber++;
        
        // Update score
        if (currentNumber - 1 > highestLevel) {
            highestLevel = currentNumber - 1;
            localStorage.setItem('highestLevel', highestLevel);
            $highestLevel.textContent = highestLevel;
        }

        // Reset for next level
        selectedDivisors.clear();
        updateCorrectDivisors();
        renderButtons(); // ボタンを再描画して新しい範囲に対応
        
        // レベルアップした数字の約数表示
        showMessage('正解！', `${currentNumber - 1}の約数(${correctDivisors.size}個)をすべて見つけました！`, 'green-500');

    }, 300);
}

/**
 * 間違えた場合、ゲームを終了させる
 */
function gameOver() {
    gameActive = false;
    
    // エラー詳細メッセージを作成
    const missingDivisors = Array.from(correctDivisors).filter(d => !selectedDivisors.has(d));
    const extraneousSelections = Array.from(selectedDivisors).filter(d => !correctDivisors.has(d));

    let detailHtml = `<p class="text-gray-600 mb-4">レベル ${currentNumber - 1} でゲームオーバーです。</p>`;
    
    if (missingDivisors.length > 0) {
        detailHtml += `<p class="text-yellow-600 font-semibold mb-2">💡 見落とした約数:</p>`;
        detailHtml += `<p class="text-2xl font-bold text-yellow-800 mb-4">${missingDivisors.join(', ')}</p>`;
    }

    if (extraneousSelections.length > 0) {
        detailHtml += `<p class="text-red-600 font-semibold mb-2">❌ 間違えて選んだ数字:</p>`;
        detailHtml += `<p class="text-2xl font-bold text-red-800 mb-4">${extraneousSelections.join(', ')}</p>`;
    }
    
    if (missingDivisors.length === 0 && extraneousSelections.length === 0) {
        detailHtml += `<p class="text-red-600 font-semibold">選択数が合いませんでしたが、エラーが見つかりませんでした。再試行してください。</p>`;
    }

    // Highlight the correct divisors for learning on the game board
    const allButtons = document.querySelectorAll('.divisor-btn');
    allButtons.forEach(btn => {
        const value = parseInt(btn.dataset.value);
        btn.disabled = true;
        
        const isCorrectDivisor = correctDivisors.has(value);
        const isSelected = selectedDivisors.has(value);

        if (isCorrectDivisor && !isSelected) {
            // 約数なのに選択されていないもの (見落とし) -> 黄色
            btn.classList.add('bg-yellow-500', 'text-white');
            btn.style.boxShadow = '0 0 0 4px #fbbf24'; 
        } else if (!isCorrectDivisor && isSelected) {
            // 約数ではないのに選択されたもの (間違い) -> 赤
            btn.classList.add('bg-red-500', 'text-white');
            btn.style.boxShadow = '0 0 0 4px #dc2626'; 
        }
    });

    // メッセージボックスを表示
    showMessage('ゲームオーバー', detailHtml, 'red-500');

    // UI変更
    $checkSelectionBtn.classList.add('hidden');
    $restartBtn.classList.remove('hidden');
    $currentNumber.classList.add('text-red-600');
}

/**
 * 正しい約数情報を更新する
 */
function updateCorrectDivisors() {
    correctDivisors = getCorrectDivisors(currentNumber);
    console.log(`Current Number: ${currentNumber}, Correct Divisors (1-${Math.min(currentNumber, MAX_BUTTON_DISPLAY)}): ${Array.from(correctDivisors).join(', ')}`);
}

/**
 * ゲームをリスタートする
 */
function restartGame() {
    currentNumber = 1;
    selectedDivisors.clear();
    gameActive = true;
    
    $currentNumber.classList.remove('text-red-600');
    
    $checkSelectionBtn.classList.remove('hidden');
    $restartBtn.classList.add('hidden');

    updateCorrectDivisors();
    renderButtons(); // 常に再描画

    // タイトルを「公約数さがし」に変更
    showMessage('公約数さがし', 'レベル1からスタート！頑張ってください！');
}


// --- Event Listeners and Initialization ---

function initGame() {
    // 最高レベルをロードして表示
    $highestLevel.textContent = highestLevel;
    
    // 選択チェックボタン
    $checkSelectionBtn.addEventListener('click', checkSelection);
    
    // リスタートボタン
    $restartBtn.addEventListener('click', restartGame);

    // メッセージボックスを閉じる
    $closeMessageBtn.addEventListener('click', () => {
        $messageBox.classList.remove('flex');
        $messageBox.classList.add('hidden');
    });
    
    // 初回ゲーム開始
    restartGame();
    // タイトルを「公約数さがし」に変更
    showMessage('公約数さがし', '画面中央の数字の約数をすべて選択し、「次のレベルへ」を押してください！');
}

// ページ全体がロードされたらinitGameを呼び出す
window.onload = initGame;

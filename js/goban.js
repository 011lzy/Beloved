    // ========== 五子棋 ==========
    var gobanState = { board: [], currentPlayer: 1, history: [], canvas: null, ctx: null, gameOver: false, inviteChecked: false };
    var GOBAN_SIZE = 15;
    function openGobanApp() {
        document.getElementById('gobanAppPage').style.display = 'flex';
        gobanState.inviteChecked = false;
        gobanShowStart();
    }
    function gobanShowStart() {
        const container = document.getElementById('gobanAppContent');
        const myNick = appData.chatSettings.myNickname || '我';
        const otherNick = appData.chatSettings.otherNickname || '对方';
        let html = '<div class="goban-wrap" style="text-align:center;padding:40px 0;">';
        html += '<div style="font-size:18px;font-weight:600;margin-bottom:14px;">五子棋</div>';
        if (!gobanState.inviteChecked) {
            gobanState.inviteChecked = true;
            if (Math.random() < 0.05) {
                html += '<div style="font-size:14px;margin-bottom:14px;color:#1a1a1a;">' + otherNick + ' 邀请你下五子棋！</div>';
                html += '<div style="display:flex;gap:10px;justify-content:center;">';
                html += '<div onclick="gobanAcceptInvite()" style="padding:12px 24px;background:#1a1a1a;color:#fff;border-radius:10px;font-size:14px;cursor:pointer;">接受</div>';
                html += '<div onclick="gobanRejectInvite()" style="padding:12px 24px;background:#f0f0f0;border-radius:10px;font-size:14px;cursor:pointer;">拒绝</div>';
                html += '</div>';
                html += '</div>';
                container.innerHTML = html;
                return;
            }
        }
        html += '<div style="font-size:13px;color:#666;margin-bottom:14px;">黑棋：' + myNick + ' · 白棋：' + otherNick + '</div>';
        html += '<div onclick="gobanInviteOther()" style="padding:12px 24px;background:#1a1a1a;color:#fff;border-radius:10px;font-size:14px;cursor:pointer;display:inline-block;">邀请' + otherNick + '一起下棋</div>';
        html += '</div>';
        container.innerHTML = html;
    }
    function gobanInviteOther() {
        const container = document.getElementById('gobanAppContent');
        const otherNick = appData.chatSettings.otherNickname || '对方';
        let html = '<div class="goban-wrap" style="text-align:center;padding:40px 0;">';
        html += '<div style="font-size:14px;color:#666;margin-bottom:14px;">等待' + otherNick + '回复…</div>';
        html += '</div>';
        container.innerHTML = html;
        setTimeout(() => { gobanInit(); }, 2000 + Math.random() * 2000);
    }
    function gobanAcceptInvite() { gobanInit(); }
    function gobanRejectInvite() {
        const container = document.getElementById('gobanAppContent');
        let html = '<div class="goban-wrap" style="text-align:center;padding:40px 0;">';
        html += '<div style="font-size:14px;color:#999;margin-bottom:14px;">你拒绝了邀请</div>';
        html += '<div onclick="gobanShowStart()" style="padding:12px 24px;background:#1a1a1a;color:#fff;border-radius:10px;font-size:14px;cursor:pointer;display:inline-block;">返回</div>';
        html += '</div>';
        container.innerHTML = html;
    }
    function closeGobanApp() {
        document.getElementById('gobanAppPage').style.display = 'none';
    }
    function gobanInit() {
        gobanState.board = Array(GOBAN_SIZE).fill(null).map(() => Array(GOBAN_SIZE).fill(0));
        gobanState.currentPlayer = 1;
        gobanState.history = [];
        gobanState.gameOver = false;

        const container = document.getElementById('gobanAppContent');
        const myNick = appData.chatSettings.myNickname || '我';
        const otherNick = appData.chatSettings.otherNickname || '对方';
        let html = '<div class="goban-wrap">';
        html += '<div id="gobanStatus" style="font-size:14px;margin-bottom:8px;">黑棋（' + myNick + '）回合</div>';
        html += '<canvas id="gobanCanvas" width="300" height="300"></canvas>';
        html += '<div style="display:flex;gap:8px;margin-top:10px;">';
        html += '<div onclick="gobanUndo()" style="padding:8px 16px;background:#f0f0f0;border-radius:8px;cursor:pointer;font-size:13px;">悔棋</div>';
        html += '<div onclick="gobanRestart()" style="padding:8px 16px;background:#f0f0f0;border-radius:8px;cursor:pointer;font-size:13px;">重新开始</div>';
        html += '<div onclick="gobanShowStart()" style="padding:8px 16px;background:#f0f0f0;border-radius:8px;cursor:pointer;font-size:13px;">退出</div>';
        html += '</div>';
        html += '</div>';
        container.innerHTML = html;

        gobanState.canvas = document.getElementById('gobanCanvas');
        gobanState.ctx = gobanState.canvas.getContext('2d');
        gobanDraw();
        gobanState.canvas.onclick = gobanClick;
    }
    function gobanDraw() {
        const ctx = gobanState.ctx;
        const cs = gobanState.canvas.width;
        const cell = cs / (GOBAN_SIZE + 1);
        // Background
        ctx.fillStyle = '#e8c887';
        ctx.fillRect(0, 0, cs, cs);
        // Grid
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < GOBAN_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(cell, cell + i * cell);
            ctx.lineTo(cell + (GOBAN_SIZE - 1) * cell, cell + i * cell);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cell + i * cell, cell);
            ctx.lineTo(cell + i * cell, cell + (GOBAN_SIZE - 1) * cell);
            ctx.stroke();
        }
        // Stones
        for (let i = 0; i < GOBAN_SIZE; i++) {
            for (let j = 0; j < GOBAN_SIZE; j++) {
                if (gobanState.board[i][j] !== 0) {
                    const x = cell + j * cell;
                    const y = cell + i * cell;
                    const r = cell * 0.4;
                    const grad = ctx.createRadialGradient(x - r/3, y - r/3, r/4, x, y, r);
                    if (gobanState.board[i][j] === 1) {
                        grad.addColorStop(0, '#666');
                        grad.addColorStop(1, '#000');
                    } else {
                        grad.addColorStop(0, '#fff');
                        grad.addColorStop(1, '#ccc');
                    }
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    function gobanClick(e) {
        if (gobanState.gameOver) return;
        /* Bug16修复：AI思考期间禁用棋盘点击，防止乱下棋子 */
        if (gobanState.currentPlayer === 2) return;
        const rect = gobanState.canvas.getBoundingClientRect();
        const cs = gobanState.canvas.width;
        const cell = cs / (GOBAN_SIZE + 1);
        const scaleX = cs / rect.width;
        const scaleY = cs / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const col = Math.round((x - cell) / cell);
        const row = Math.round((y - cell) / cell);
        if (row < 0 || row >= GOBAN_SIZE || col < 0 || col >= GOBAN_SIZE) return;
        if (gobanState.board[row][col] !== 0) return;

        gobanPlace(row, col, gobanState.currentPlayer);
        gobanState.history.push({ row, col, player: gobanState.currentPlayer });

        if (gobanCheckWin(row, col, gobanState.currentPlayer)) {
            gobanState.gameOver = true;
            const myNick = appData.chatSettings.myNickname || '我';
            const otherNick = appData.chatSettings.otherNickname || '对方';
            const winner = gobanState.currentPlayer === 1 ? '黑棋（' + myNick + '）' : '白棋（' + otherNick + '）';
            document.getElementById('gobanStatus').textContent = winner + '获胜！';
            // Balance
            if (gobanState.currentPlayer === 1) {
                addBalanceRecord('mine', 100, '五子棋获胜');
            } else {
                addBalanceRecord('other', 100, '五子棋获胜');
            }
            return;
        }

        gobanState.currentPlayer = gobanState.currentPlayer === 1 ? 2 : 1;
        const myNick2 = appData.chatSettings.myNickname || '我';
        const otherNick2 = appData.chatSettings.otherNickname || '对方';
        document.getElementById('gobanStatus').textContent = (gobanState.currentPlayer === 1 ? '黑棋（' + myNick2 + '）' : '白棋（' + otherNick2 + '）思考中...');

        // If white (TA), auto-play after delay
        if (gobanState.currentPlayer === 2) {
            setTimeout(() => gobanAIPlay(), 10000 + Math.random() * 5000);
        }
    }
    function gobanPlace(row, col, player) {
        gobanState.board[row][col] = player;
        gobanDraw();
    }
    function gobanAIPlay() {
        if (gobanState.gameOver) return;
        // Simple AI: find a good spot near existing stones
        let bestScore = -1;
        let bestMove = null;
        for (let i = 0; i < GOBAN_SIZE; i++) {
            for (let j = 0; j < GOBAN_SIZE; j++) {
                if (gobanState.board[i][j] !== 0) continue;
                // Check if near existing stones
                let near = false;
                for (let di = -2; di <= 2; di++) {
                    for (let dj = -2; dj <= 2; dj++) {
                        const ni = i + di, nj = j + dj;
                        if (ni >= 0 && ni < GOBAN_SIZE && nj >= 0 && nj < GOBAN_SIZE && gobanState.board[ni][nj] !== 0) {
                            near = true;
                            break;
                        }
                    }
                    if (near) break;
                }
                if (!near && gobanState.history.length > 0) continue;
                // Score based on surrounding stones
                let score = Math.random() * 10;
                // Bonus for blocking/attacking
                const dirs = [[0,1],[1,0],[1,1],[1,-1]];
                for (const [dr, dc] of dirs) {
                    let cnt2 = 0, cnt1 = 0;
                    for (let k = 1; k <= 4; k++) {
                        const ni = i + dr*k, nj = j + dc*k;
                        if (ni < 0 || ni >= GOBAN_SIZE || nj < 0 || nj >= GOBAN_SIZE) break;
                        if (gobanState.board[ni][nj] === 2) cnt2++;
                        else if (gobanState.board[ni][nj] === 1) cnt1++;
                        else break;
                    }
                    for (let k = 1; k <= 4; k++) {
                        const ni = i - dr*k, nj = j - dc*k;
                        if (ni < 0 || ni >= GOBAN_SIZE || nj < 0 || nj >= GOBAN_SIZE) break;
                        if (gobanState.board[ni][nj] === 2) cnt2++;
                        else if (gobanState.board[ni][nj] === 1) cnt1++;
                        else break;
                    }
                    score += cnt2 * cnt2 * 5 + cnt1 * cnt1 * 4;
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row: i, col: j };
                }
            }
        }
        if (!bestMove) {
            bestMove = { row: 7, col: 7 };
        }
        gobanPlace(bestMove.row, bestMove.col, 2);
        gobanState.history.push({ row: bestMove.row, col: bestMove.col, player: 2 });
        if (gobanCheckWin(bestMove.row, bestMove.col, 2)) {
            gobanState.gameOver = true;
            const otherNick = appData.chatSettings.otherNickname || '对方';
            document.getElementById('gobanStatus').textContent = '白棋（' + otherNick + '）获胜！';
            addBalanceRecord('other', 100, '五子棋获胜');
            return;
        }
        gobanState.currentPlayer = 1;
        const myNick = appData.chatSettings.myNickname || '我';
        document.getElementById('gobanStatus').textContent = '黑棋（' + myNick + '）回合';
    }
    function gobanCheckWin(row, col, player) {
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        for (const [dr, dc] of dirs) {
            let count = 1;
            for (let k = 1; k <= 4; k++) {
                const ni = row + dr*k, nj = col + dc*k;
                if (ni < 0 || ni >= GOBAN_SIZE || nj < 0 || nj >= GOBAN_SIZE) break;
                if (gobanState.board[ni][nj] === player) count++;
                else break;
            }
            for (let k = 1; k <= 4; k++) {
                const ni = row - dr*k, nj = col - dc*k;
                if (ni < 0 || ni >= GOBAN_SIZE || nj < 0 || nj >= GOBAN_SIZE) break;
                if (gobanState.board[ni][nj] === player) count++;
                else break;
            }
            if (count >= 5) return true;
        }
        return false;
    }
    function gobanUndo() {
        if (gobanState.history.length === 0 || gobanState.gameOver) return;
        // Undo last two moves (player + AI)
        const undoCount = Math.min(2, gobanState.history.length);
        for (let i = 0; i < undoCount; i++) {
            const last = gobanState.history.pop();
            gobanState.board[last.row][last.col] = 0;
        }
        gobanState.currentPlayer = 1;
        gobanState.gameOver = false;
        document.getElementById('gobanStatus').textContent = '黑棋回合';
        gobanDraw();
    }
    function gobanRestart() {
        gobanInit();
    }



const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // Cho phép tất cả domain kết nối
        methods: ["GET", "POST"]
    }
});

// PHỤC VỤ FILE TĨNH
app.use(express.static(__dirname));

// Route mặc định
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/mobile', (req, res) => {
    res.sendFile(__dirname + '/mobile.html');
});

// LƯU TRỮ TRẠNG THÁI
let connectedPlayers = {
    F1: null,
    F2: null, 
    F3: null,
    F4: null
};

let activeQuestion = null;
let activeRound = null;
let roundTimer = null;

// SOCKET.IO HANDLERS
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    // Khi thí sinh đăng ký từ điện thoại
    socket.on('register_player', (data) => {
        const playerId = data.playerId || 'F1';
        
        console.log(`📱 Thí sinh đăng ký: ${playerId} (${socket.id})`);
        
        // Lưu thông tin thí sinh
        connectedPlayers[playerId] = {
            socketId: socket.id,
            name: data.playerName || `Thí sinh ${playerId.substring(1)}`,
            connectedAt: new Date().toISOString()
        };
        
        // Gửi phản hồi cho thí sinh
        socket.emit('registration_success', {
            playerId: playerId,
            message: 'Đăng ký thành công'
        });
        
        // GỬI TRẠNG THÁI CẬP NHẬT VỀ TẤT CẢ MÁY TÍNH MC
        io.emit('player_status', connectedPlayers);
        console.log('📢 Gửi trạng thái cập nhật:', connectedPlayers);
    });
    
    // Khi thí sinh gửi đáp án từ điện thoại
    socket.on('player_answer', (data) => {
        console.log('📥 Nhận đáp án từ thí sinh:', data);
        
        const playerId = data.playerId;
        
        // Gửi phản hồi cho thí sinh
        socket.emit('answer_received', {
            success: true,
            answer: data.answer,
            playerId: playerId
        });
        
        // GỬI ĐÁP ÁN VỀ MÁY TÍNH MC
        io.emit('player_answer', {
            playerId: playerId,
            playerName: data.playerName,
            answer: data.answer,
            round: data.round,
            timestamp: data.timestamp
        });
        
        console.log(`📤 Chuyển đáp án từ ${playerId} tới MC: ${data.answer}`);
    });
    
    // Khi MC gửi câu hỏi
    socket.on('question_info', (data) => {
        console.log('❓ MC gửi câu hỏi:', data);
        activeQuestion = data.question;
        activeRound = data.round;
        
        // Gửi câu hỏi đến TẤT CẢ thí sinh đang kết nối
        io.emit('question_info', {
            question: data.question,
            round: data.round,
            active: true,
            time: data.time || 0
        });
    });
    
    // Khi MC bắt đầu vòng
    socket.on('start_round', (data) => {
        console.log('🚀 MC bắt đầu vòng:', data);
        activeRound = data.round;
        
        // Gửi đến tất cả thí sinh
        io.emit('start_round', {
            round: data.round,
            duration: data.duration
        });
        
        // Tự động kết thúc sau thời gian
        if (roundTimer) clearTimeout(roundTimer);
        roundTimer = setTimeout(() => {
            io.emit('end_round', { round: activeRound });
            console.log('⏰ Tự động kết thúc vòng:', activeRound);
        }, data.duration * 1000);
    });
    
    // Khi MC kết thúc vòng
    socket.on('end_round', () => {
        console.log('⏹️ MC kết thúc vòng');
        io.emit('end_round', { round: activeRound });
    });
    
    // Khi client ngắt kết nối
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
        
        // Tìm và xóa thí sinh đã ngắt kết nối
        for (const playerId in connectedPlayers) {
            if (connectedPlayers[playerId] && connectedPlayers[playerId].socketId === socket.id) {
                console.log(`🗑️ Xóa thí sinh ${playerId} khỏi danh sách`);
                connectedPlayers[playerId] = null;
                
                // Gửi cập nhật về máy tính MC
                io.emit('player_status', connectedPlayers);
                break;
            }
        }
    });
    
    // Yêu cầu gửi lại trạng thái hiện tại
    socket.on('get_status', () => {
        socket.emit('player_status', connectedPlayers);
    });
});

// KHỞI ĐỘNG SERVER
const PORT = 3000;
http.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📱 Mobile URL: http://localhost:${PORT}/mobile.html?player=F1`);
    console.log('🔄 Đang chờ kết nối...');
});

// Hiển thị IP thực tế để test trên điện thoại
const os = require('os');
const networkInterfaces = os.networkInterfaces();

console.log('\n🌐 Địa chỉ IP có thể truy cập từ điện thoại:');
Object.keys(networkInterfaces).forEach(ifname => {
    networkInterfaces[ifname].forEach(iface => {
        if ('IPv4' !== iface.family || iface.internal !== false) return;
        console.log(`  → http://${iface.address}:${PORT}`);
    });
});
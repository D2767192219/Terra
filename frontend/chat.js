// 聊天功能相关变量
let conversationId = null;
let isTyping = false;

// 常量配置
const CONVERSATION_EXPIRY_DAYS = 7; // conversation_id过期天数
const STORAGE_KEY_CONVERSATION_ID = 'terra_conversation_id';
const STORAGE_KEY_CONVERSATION_TIME = 'terra_conversation_time';

// 检查conversation_id是否过期
function isConversationExpired() {
    const savedTime = localStorage.getItem(STORAGE_KEY_CONVERSATION_TIME);
    if (!savedTime) {
        return true; // 没有保存时间，视为过期
    }
    
    const savedTimestamp = parseInt(savedTime);
    const currentTimestamp = Date.now();
    const expiryTime = CONVERSATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7天的毫秒数
    
    return (currentTimestamp - savedTimestamp) > expiryTime;
}

// 保存conversation_id到本地存储
function saveConversationId(conversationId) {
    localStorage.setItem(STORAGE_KEY_CONVERSATION_ID, conversationId);
    localStorage.setItem(STORAGE_KEY_CONVERSATION_TIME, Date.now().toString());
    console.log('✅ conversation_id已保存到本地存储');
}

// 从本地存储获取conversation_id
function getSavedConversationId() {
    if (isConversationExpired()) {
        console.log('⏰ 本地conversation_id已过期，需要重新获取');
        clearSavedConversationId();
        return null;
    }
    
    const savedId = localStorage.getItem(STORAGE_KEY_CONVERSATION_ID);
    if (savedId) {
        console.log('✅ 从本地存储恢复conversation_id:', savedId.substring(0, 8) + '...');
        return savedId;
    }
    
    return null;
}

// 清除本地存储的conversation_id
function clearSavedConversationId() {
    localStorage.removeItem(STORAGE_KEY_CONVERSATION_ID);
    localStorage.removeItem(STORAGE_KEY_CONVERSATION_TIME);
    console.log('🗑️ 已清除本地存储的conversation_id');
}

// 获取conversation_id剩余有效时间（用于显示）
function getConversationTimeLeft() {
    const savedTime = localStorage.getItem(STORAGE_KEY_CONVERSATION_TIME);
    if (!savedTime) return null;
    
    const savedTimestamp = parseInt(savedTime);
    const currentTimestamp = Date.now();
    const expiryTime = CONVERSATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const timeLeft = expiryTime - (currentTimestamp - savedTimestamp);
    
    if (timeLeft <= 0) return null;
    
    const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
    return daysLeft;
}

// 初始化聊天功能
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    // 输入框事件监听
    chatInput.addEventListener('input', function() {
        const message = chatInput.value.trim();
        sendBtn.disabled = message === '' || isTyping;
    });
    
    // 回车发送消息
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 防止聊天框点击事件冒泡到地球
    document.getElementById('chat-panel').addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    console.log('聊天功能初始化完成');
    
    // 显示欢迎消息
    setTimeout(() => {
        // 不再重复添加问候语，因为index.html中已经有了
        // addMessage('嗨，我是球球Terra！🌏✨\n你好奇的地球探险向导来了！想知道地震为什么会发生？台风是怎么转起来的？还是想看看世界各地的奇特地貌？\n从地心的秘密到大气层的奥秘，从喜马拉雅山脉到马里亚纳海沟，我都能带你去探索！\n快告诉我，今天想去地球的哪个角落冒险呢？🗺️', 'bot');
    }, 1000);
});

// 切换聊天面板显示
async function toggleChat() {
    const chatPanel = document.getElementById('chat-panel');
    const chatToggle = document.getElementById('chat-toggle');
    
    if (chatPanel.classList.contains('hidden')) {
        chatPanel.classList.remove('hidden');
        chatToggle.classList.add('active');
        
        // 检查是否有有效的conversation_id（从本地存储或内存）
        const savedConversationId = getSavedConversationId();
        
        if (savedConversationId && !conversationId) {
            // 恢复本地存储的conversation_id
            conversationId = savedConversationId;
            const daysLeft = getConversationTimeLeft();
            addMessage(`✅ 对话已恢复 (剩余${daysLeft}天有效期)`, 'system');
            
            // 3秒后移除系统消息
            setTimeout(() => {
                removeSystemMessages();
            }, 3000);
        } else if (!conversationId) {
            // 没有有效的conversation_id，获取新的
            console.log('聊天框打开，需要获取新的conversation_id...');
            await initializeConversation();
        } else {
            // 已有conversation_id，显示状态
            const daysLeft = getConversationTimeLeft();
            if (daysLeft) {
                addMessage(`✅ 对话准备就绪 (剩余${daysLeft}天有效期)`, 'system');
                setTimeout(() => {
                    removeSystemMessages();
                }, 3000);
            }
        }
        
        // 聚焦到输入框
        setTimeout(() => {
            document.getElementById('chat-input').focus();
        }, 300);
    } else {
        chatPanel.classList.add('hidden');
        chatToggle.classList.remove('active');
    }
}

// 初始化对话（获取conversation_id）
async function initializeConversation() {
    try {
        // 显示初始化消息
        addMessage('🔄 正在初始化对话...', 'system');
        
        // 根据当前访问地址决定后端地址
        const backendHost = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
        const apiUrl = `http://${backendHost}:8000/api/chat/conversation`;
        
        console.log('调用创建对话接口:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });
        
        console.log('创建对话响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('创建对话失败:', errorText);
            throw new Error(`创建对话失败 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('创建对话响应:', data);
        
        if (data.success && data.data && data.data.conversation_id) {
            conversationId = data.data.conversation_id;
            console.log('✅ 对话初始化成功，ID:', conversationId);
            
            // 保存到本地存储
            saveConversationId(conversationId);
            
            // 移除初始化消息，显示成功消息
            removeSystemMessages();
            addMessage(`✅ 新对话已创建 (7天有效期)`, 'system');
            
            // 3秒后自动移除系统消息
            setTimeout(() => {
                removeSystemMessages();
            }, 3000);
            
        } else {
            throw new Error('创建对话失败：' + (data.error || '返回数据格式错误'));
        }
        
    } catch (error) {
        console.error('初始化对话失败:', error);
        removeSystemMessages();
        addMessage('❌ 对话初始化失败，请稍后重试。', 'system');
        
        // 5秒后移除错误消息
        setTimeout(() => {
            removeSystemMessages();
        }, 5000);
    }
}

// 发送消息 - 简化版本，conversation_id已在聊天框打开时获取
async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (message === '' || isTyping) return;
    
    // 检查是否有conversation_id
    if (!conversationId) {
        addMessage('❌ 对话未准备就绪，请关闭并重新打开聊天框。', 'bot');
        return;
    }
    
    // 添加用户消息到聊天界面
    addMessage(message, 'user');
    
    // 清空输入框并禁用发送按钮
    chatInput.value = '';
    document.getElementById('send-btn').disabled = true;
    
    // 开始打字状态
    setTypingStatus(true);
    
    try {
        // 根据当前访问地址决定后端地址
        const backendHost = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
        const apiUrl = `http://${backendHost}:8000/api/chat/message`;
        
        console.log('发送消息到对话:', conversationId);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                message: message,
                stream: false
            })
        });
        
        console.log('发送消息响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('发送消息失败:', errorText);
            throw new Error(`发送消息失败 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('发送消息响应:', data);
        
        if (data.success && data.data) {
            // 提取AI回复
            let aiResponse = data.data.answer || '抱歉，未能获取到回复内容。';
            
            setTimeout(() => {
                addMessage(aiResponse, 'bot');
                setTypingStatus(false);
            }, 1000);
        } else {
            throw new Error('发送消息失败：' + (data.error || '返回数据格式错误'));
        }
        
    } catch (error) {
        console.error('发送消息失败:', error);
        setTimeout(() => {
            let errorMessage = '❌ 发送消息失败，请稍后重试。';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = '❌ 无法连接到聊天服务器，请检查网络连接。';
            }
            
            addMessage(errorMessage, 'bot');
            setTypingStatus(false);
        }, 1000);
    }
}

// 移除系统消息的辅助函数
function removeSystemMessages() {
    const messagesContainer = document.getElementById('chat-messages');
    const systemMessages = messagesContainer.querySelectorAll('.system-message');
    systemMessages.forEach(msg => msg.remove());
}

// 添加消息到聊天界面
function addMessage(content, type) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    // 处理消息内容
    let processedContent = escapeHtml(content);
    let references = null;
    
    // 如果是机器人消息，处理参考链接和格式
    if (type === 'bot') {
        // 提取[LINK]标记中的链接
        const linkMatch = processedContent.match(/\[LINK\](.*?)\[\/LINK\]/);
        if (linkMatch) {
            // 从原文中删除[LINK]标记部分
            processedContent = processedContent.replace(/\[LINK\].*?\[\/LINK\]/g, '').trim();
            
            // 提取链接
            const link = linkMatch[1].trim();
            if (link) {
                references = [link];
            }
        } else {
            // 兼容旧版：提取参考链接部分
        const referenceMatch = processedContent.match(/参考链接[：:]\s*((?:https?:\/\/[^\s]+(?:\s+[^https\n][^\n]*)?[\n]*)+)/i);
        
        if (referenceMatch) {
            // 从原文中删除参考链接部分
            processedContent = processedContent.replace(referenceMatch[0], '');
            
            // 提取链接
            const referenceText = referenceMatch[1];
            const links = referenceText.match(/(https?:\/\/[^\s]+)/g) || [];
            
            if (links.length > 0) {
                references = links;
                }
            }
        }
        
        // 查找任何其他URL并转换为可点击链接
        processedContent = processedContent.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank">$1</a>'
        );
        
        // 转换换行符为HTML换行
        processedContent = processedContent.replace(/\n/g, '<br>');
    }
    
    if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${processedContent}</p>
            </div>
            <div class="message-avatar">👤</div>
        `;
    } else if (type === 'system') {
        messageDiv.innerHTML = `
            <div class="message-avatar">⚙️</div>
            <div class="message-content">
                <p style="color: #666; font-style: italic;">${processedContent}</p>
            </div>
        `;
    } else {
        let referencesHTML = '';
        if (references && references.length > 0) {
            referencesHTML = `
                <div class="reference-links">
                    <p class="reference-title">参考链接:</p>
                    <ul>
                        ${references.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="message-avatar">🌍</div>
            <div class="message-content">
                <p>${processedContent}</p>
                ${referencesHTML}
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    
    // 滚动到底部
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// 设置打字状态
function setTypingStatus(typing) {
    isTyping = typing;
    const statusDiv = document.getElementById('chat-status');
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');
    
    if (typing) {
        statusDiv.innerHTML = '<span class="typing-indicator">球球Terra正在思考中...</span>';
        statusDiv.style.display = 'block';
        sendBtn.disabled = true;
        chatInput.disabled = true;
    } else {
        statusDiv.style.display = 'none';
        chatInput.disabled = false;
        const message = chatInput.value.trim();
        sendBtn.disabled = message === '';
    }
}

// 处理推荐问题点击
function askRecommendedQuestion(question) {
    // 如果聊天面板是隐藏的，先打开它
    const chatPanel = document.getElementById('chat-panel');
    if (chatPanel.classList.contains('hidden')) {
        toggleChat();
        
        // 等待聊天框打开和初始化完成后再发送问题
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            chatInput.value = question;
            sendMessage();
        }, 1500);
    } else {
        // 聊天框已经打开，直接填入问题并发送
        const chatInput = document.getElementById('chat-input');
        chatInput.value = question;
        sendMessage();
    }
}

// HTML转义函数
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// 清除对话历史（保留conversation_id）
function clearChat() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '';
    console.log('聊天历史已清除，保留conversation_id');
    
    // 重新显示欢迎消息
    setTimeout(() => {
        const daysLeft = getConversationTimeLeft();
        addMessage('对话历史已清除。', 'bot');
        if (daysLeft) {
            addMessage(`当前对话还有${daysLeft}天有效期。`, 'system');
            setTimeout(() => {
                removeSystemMessages();
            }, 3000);
        }
    }, 500);
}

// 完全重置对话（清除conversation_id和本地存储）
async function resetConversation() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '';
    conversationId = null;
    clearSavedConversationId();
    console.log('对话已完全重置，conversation_id已清除');
    
    // 重新显示欢迎消息
    setTimeout(() => {
        addMessage('对话已完全重置。', 'bot');
    }, 500);
    
    // 重新初始化对话（获取新的conversation_id）
    setTimeout(async () => {
        await initializeConversation();
    }, 1000);
}

// 测试连接
async function testConnection() {
    try {
        const backendHost = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
        const response = await fetch(`http://${backendHost}:8000/api/chat/test`);
        const data = await response.json();
        
        if (data.success) {
            addMessage('连接测试成功！聊天服务正常工作。', 'bot');
        } else {
            addMessage('连接测试失败，请检查服务器状态。', 'bot');
        }
    } catch (error) {
        console.error('连接测试失败:', error);
        addMessage('无法连接到聊天服务器。', 'bot');
    }
}

// 检查后端配置
async function checkBackendConfig() {
    try {
        const backendHost = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
        const response = await fetch(`http://${backendHost}:8000/health`);
        
        if (response.ok) {
            addMessage('✅ 后端服务运行正常', 'bot');
            
            // 检查API配置
            const testResponse = await fetch(`http://${backendHost}:8000/api/chat/test`);
            const testData = await testResponse.json();
            
            if (testData.success) {
                addMessage('✅ API配置正常', 'bot');
            } else {
                addMessage('❌ API配置可能有问题', 'bot');
            }
        } else {
            addMessage('❌ 后端服务连接失败', 'bot');
        }
    } catch (error) {
        console.error('配置检查失败:', error);
        addMessage('❌ 无法检查后端配置，请确认后端服务已启动', 'bot');
    }
}

// 检查conversation_id状态的调试函数
function checkConversationStatus() {
    const savedId = localStorage.getItem(STORAGE_KEY_CONVERSATION_ID);
    const savedTime = localStorage.getItem(STORAGE_KEY_CONVERSATION_TIME);
    const isExpired = isConversationExpired();
    const daysLeft = getConversationTimeLeft();
    
    const status = {
        currentId: conversationId,
        savedId: savedId ? savedId.substring(0, 8) + '...' : null,
        savedTime: savedTime ? new Date(parseInt(savedTime)).toLocaleString() : null,
        isExpired: isExpired,
        daysLeft: daysLeft
    };
    
    console.log('🔍 Conversation状态:', status);
    addMessage(`对话状态检查：\n${isExpired ? '❌ 已过期' : `✅ 有效 (剩余${daysLeft}天)`}`, 'system');
    
    setTimeout(() => {
        removeSystemMessages();
    }, 5000);
}

// 全局函数声明
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.resetConversation = resetConversation;
window.checkConversationStatus = checkConversationStatus;
window.testConnection = testConnection;
window.checkBackendConfig = checkBackendConfig; 
window.addMessage = addMessage;
window.setTypingStatus = setTypingStatus;
window.askRecommendedQuestion = askRecommendedQuestion; 
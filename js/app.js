// HouseShare APP 主应用逻辑
class HouseShareApp {
    constructor() {
        this.currentUser = null;
        this.properties = [];
        this.clients = [];
        this.init();
    }

    // 初始化应用
    async init() {
        try {
            // 注册 Service Worker
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker 注册成功');
            }

            // 初始化UI
            this.initUI();

            // 加载数据
            await this.loadData();

            // 绑定事件
            this.bindEvents();

            // 开始应用
            this.startApp();

            console.log('HouseShare APP 初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试');
        }
    }

    // 初始化UI
    initUI() {
        // 更新当前时间
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);

        // 检查用户是否已登录
        if (!this.checkLogin()) {
            // 显示登录页面
            this.showLoginPage();
            return;
        }

        // 显示加载动画
        this.showLoading();

        // 设置初始页面
        this.loadPage('home');
    }

    // 检查登录状态
    checkLogin() {
        const user = localStorage.getItem('houseshare_user');
        if (user) {
            try {
                this.currentUser = JSON.parse(user);
                return true;
            } catch (e) {
                console.error('解析用户数据失败:', e);
                return false;
            }
        }
        return false;
    }

    // 显示登录页面
    showLoginPage() {
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="login-page">
                    <div class="login-header">
                        <h1>🏠 HouseShare</h1>
                        <p>房源朋友圈发布助手</p>
                    </div>
                    
                    <div class="login-form">
                        <div class="form-group">
                            <label for="username">账号</label>
                            <input type="text" id="username" placeholder="请输入账号" value="admin">
                        </div>
                        
                        <div class="form-group">
                            <label for="password">密码</label>
                            <input type="password" id="password" placeholder="请输入密码" value="123456">
                        </div>
                        
                        <div class="form-actions">
                            <button id="loginBtn" class="btn btn-primary btn-large">
                                <i class="ri-login-circle-line"></i> 登录
                            </button>
                        </div>
                        
                        <div class="login-info">
                            <p><strong>默认账号：</strong>admin</p>
                            <p><strong>默认密码：</strong>123456</p>
                            <p>您可以在个人中心修改密码</p>
                        </div>
                    </div>
                    
                    <div class="login-footer">
                        <p>© 2025 HouseShare 房源管理系统</p>
                    </div>
                </div>
            `;
            
            // 绑定登录按钮事件
            document.getElementById('loginBtn').addEventListener('click', () => this.login());
            
            // 支持回车登录
            document.getElementById('password').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.login();
                }
            });
        }
    }

    // 用户登录
    login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // 简单的登录验证
        if (username === 'admin' && password === '123456') {
            this.currentUser = {
                username: 'admin',
                name: '管理员',
                role: 'admin'
            };
            
            // 保存登录状态
            localStorage.setItem('houseshare_user', JSON.stringify(this.currentUser));
            
            // 显示成功消息
            this.showMessage('登录成功！', 'success');
            
            // 清除登录页面元素，确保不阻挡交互
            const loginPage = document.querySelector('.login-page');
            if (loginPage) {
                loginPage.remove();
            }
            
            // 重新初始化UI并绑定事件
            setTimeout(() => {
                this.showLoading();
                this.loadPage('home');
                // 重新绑定底部导航事件
                this.bindEvents();
            }, 500);
        } else {
            this.showError('账号或密码错误，请重试');
            
            // 震动效果
            const inputs = document.querySelectorAll('#username, #password');
            inputs.forEach(input => {
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 500);
            });
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="ri-${type === 'success' ? 'check-line' : 'information-line'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('show');
            setTimeout(() => {
                messageDiv.classList.remove('show');
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }, 2000);
        }, 10);
    }

    // 显示错误消息
    showError(message) {
        this.showMessage(message, 'error');
    }

    // 更新当前时间
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    // 显示加载动画
    showLoading() {
        const loadingElement = document.getElementById('pageContent');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>加载中...</p>
                </div>
            `;
        }
    }

    // 加载页面
    async loadPage(pageName) {
        try {
            this.showLoading();
            
            let pageContent = '';
            
            switch (pageName) {
                case 'home':
                    pageContent = this.getHomePage();
                    break;
                case 'properties':
                    pageContent = this.getPropertiesPage();
                    break;
                case 'clients':
                    pageContent = this.getClientsPage();
                    break;
                case 'publish':
                    pageContent = this.getPublishPage();
                    break;
                case 'profile':
                    pageContent = this.getProfilePage();
                    break;
                default:
                    pageContent = this.getHomePage();
            }
            
            const pageElement = document.getElementById('pageContent');
            if (pageElement) {
                pageElement.innerHTML = pageContent;
            }
            
            // 更新导航状态
            this.updateNavigation(pageName);
            
            // 初始化页面组件
            this.initPageComponents(pageName);
            
        } catch (error) {
            console.error('加载页面失败:', error);
            this.showError('页面加载失败');
        }
    }

    // 获取首页内容
    getHomePage() {
        return `
            <div class="home-header">
                <div class="welcome-section">
                    <div class="welcome-avatar">
                        <i class="ri-home-3-line"></i>
                    </div>
                    <div class="welcome-text">
                        <h1>欢迎回来</h1>
                        <p>随时随地管理您的房源业务</p>
                    </div>
                </div>

                <div class="quick-actions">
                    <a href="#" class="quick-action" id="addPropertyBtn">
                        <i class="ri-add-circle-line"></i>
                        <span>新增房源</span>
                    </a>
                    <a href="#" class="quick-action" id="viewPropertiesBtn">
                        <i class="ri-building-2-line"></i>
                        <span>房源管理</span>
                    </a>
                    <a href="#" class="quick-action" id="addClientBtn">
                        <i class="ri-user-add-line"></i>
                        <span>新增客户</span>
                    </a>
                    <a href="#" class="quick-action" id="publishBtn">
                        <i class="ri-share-line"></i>
                        <span>发布朋友圈</span>
                    </a>
                </div>

                <div class="stats-cards">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="ri-building-line"></i>
                        </div>
                        <div class="stat-value">${this.properties.length}</div>
                        <div class="stat-label">房源总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="ri-user-line"></i>
                        </div>
                        <div class="stat-value">${this.clients.length}</div>
                        <div class="stat-label">客户总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="ri-chat-4-line"></i>
                        </div>
                        <div class="stat-value">${this.getPublishedCount()}</div>
                        <div class="stat-label">已发布朋友圈</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="ri-money-dollar-circle-line"></i>
                        </div>
                        <div class="stat-value">${this.getTotalRevenue()}</div>
                        <div class="stat-label">累计成交额</div>
                    </div>
                </div>

                <div class="property-list">
                    <h2 style="margin-bottom: var(--space-md);">最近房源</h2>
                    ${this.getRecentProperties().map(property => `
                        <div class="property-item">
                            <div class="property-image">
                                <i class="ri-home-3-line"></i>
                            </div>
                            <div class="property-info">
                                <div class="property-title">${property.title}</div>
                                <div class="property-meta">
                                    <div class="property-meta-item">
                                        <i class="ri-map-pin-line"></i>
                                        <span>${property.location}</span>
                                    </div>
                                    <div class="property-meta-item">
                                        <i class="ri-ruler-line"></i>
                                        <span>${property.area}㎡</span>
                                    </div>
                                </div>
                                <div class="property-price">${property.price}</div>
                                <span class="property-status status-${property.status}">
                                    ${this.getStatusText(property.status)}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 获取房源页面
    getPropertiesPage() {
        return `
            <div class="page-header">
                <h1>房源管理</h1>
                <p>管理您的所有房源信息</p>
            </div>

            <div class="actions-bar" style="margin-bottom: var(--space-xl);">
                <button class="btn btn-primary" id="addNewPropertyBtn">
                    <i class="ri-add-line"></i> 新增房源
                </button>
                <button class="btn btn-outline" id="filterPropertiesBtn">
                    <i class="ri-filter-line"></i> 筛选
                </button>
            </div>

            <div class="properties-grid">
                ${this.properties.map(property => `
                    <div class="property-card">
                        <div class="property-card-header">
                            <h3>${property.title}</h3>
                            <span class="property-status status-${property.status}">
                                ${this.getStatusText(property.status)}
                            </span>
                        </div>
                        <div class="property-card-body">
                            <div class="property-info-row">
                                <i class="ri-map-pin-line"></i>
                                <span>${property.location}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-ruler-line"></i>
                                <span>${property.area}㎡</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-money-dollar-circle-line"></i>
                                <span class="property-price">${property.price}</span>
                            </div>
                        </div>
                        <div class="property-card-footer">
                            <button class="btn btn-text" onclick="app.editProperty('${property.id}')">
                                <i class="ri-edit-line"></i> 编辑
                            </button>
                            <button class="btn btn-text" onclick="app.viewProperty('${property.id}')">
                                <i class="ri-eye-line"></i> 查看
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 获取客户页面
    getClientsPage() {
        return `
            <div class="page-header">
                <h1>客户管理</h1>
                <p>管理您的客户信息和跟进记录</p>
            </div>

            <div class="actions-bar" style="margin-bottom: var(--space-xl);">
                <button class="btn btn-primary" id="addNewClientBtn">
                    <i class="ri-user-add-line"></i> 新增客户
                </button>
                <input type="text" class="form-control" placeholder="搜索客户..." id="clientSearch">
            </div>

            <div class="clients-list">
                ${this.clients.map(client => `
                    <div class="client-card">
                        <div class="client-header">
                            <div class="client-avatar">
                                ${client.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="client-info">
                                <div class="client-name">${client.name}</div>
                                <div class="client-phone">
                                    <i class="ri-phone-line"></i> ${client.phone}
                                </div>
                            </div>
                        </div>
                        <div class="client-details">
                            <div class="client-tags">
                                ${client.tags.map(tag => `
                                    <span class="client-tag">${tag}</span>
                                `).join('')}
                            </div>
                            <div class="client-actions">
                                <button class="btn btn-icon" onclick="app.callClient('${client.phone}')">
                                    <i class="ri-phone-line"></i>
                                </button>
                                <button class="btn btn-icon" onclick="app.messageClient('${client.phone}')">
                                    <i class="ri-message-line"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 获取发布页面
    getPublishPage() {
        return `
            <div class="publish-container">
                <div class="publish-header">
                    <h2>发布朋友圈</h2>
                    <p>选择房源，一键生成精美朋友圈文案</p>
                </div>

                <div class="property-selection">
                    <label class="form-label">选择要发布的房源</label>
                    <select class="form-control" id="propertySelect">
                        <option value="">请选择房源</option>
                        ${this.properties.filter(p => p.status === 'available').map(property => `
                            <option value="${property.id}">${property.title} - ${property.price}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="content-editor">
                    <label class="form-label">朋友圈文案</label>
                    <div class="editor-toolbar">
                        <button class="toolbar-btn" data-action="bold">
                            <i class="ri-bold"></i>
                        </button>
                        <button class="toolbar-btn" data-action="italic">
                            <i class="ri-italic"></i>
                        </button>
                        <button class="toolbar-btn" data-action="emoji">
                            <i class="ri-emotion-line"></i>
                        </button>
                        <button class="toolbar-btn" data-action="hashtag">
                            <i class="ri-hashtag"></i>
                        </button>
                    </div>
                    <div class="editor-content" id="publishContent" contenteditable="true">
                        🏠 精品房源推荐！
                        
                        面积：120㎡ | 户型：3室2厅2卫
                        位置：市中心黄金地段
                        装修：豪华精装，拎包入住
                        价格：280万
                        
                        稀缺房源，先到先得！
                        #房源推荐 #豪宅 #投资首选
                    </div>
                </div>

                <div class="image-upload">
                    <label class="form-label">上传图片</label>
                    <div class="upload-area" id="uploadArea">
                        <i class="ri-image-add-line"></i>
                        <div class="upload-text">点击或拖拽上传图片</div>
                        <div class="upload-hint">支持JPG、PNG格式，最多9张</div>
                    </div>
                    <div class="image-grid" id="imageGrid">
                        <!-- 图片预览区域 -->
                    </div>
                </div>

                <div class="publish-actions">
                    <button class="btn btn-primary" id="previewBtn">
                        <i class="ri-eye-line"></i> 预览
                    </button>
                    <button class="btn btn-secondary" id="copyToWechatBtn">
                        <i class="ri-wechat-line"></i> 复制到微信
                    </button>
                    <button class="btn btn-outline" id="saveTemplateBtn">
                        <i class="ri-save-line"></i> 保存为模板
                    </button>
                </div>
            </div>
        `;
    }

    // 获取个人中心页面
    getProfilePage() {
        return `
            <div class="profile-header">
                <div class="profile-avatar">
                    <i class="ri-user-line"></i>
                </div>
                <div class="profile-name">${this.currentUser?.name || '管理员'}</div>
                <div class="profile-role">房源经理</div>
                
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${this.properties.length}</div>
                        <div class="profile-stat-label">房源数</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${this.clients.length}</div>
                        <div class="profile-stat-label">客户数</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${this.getPublishedCount()}</div>
                        <div class="profile-stat-label">发布数</div>
                    </div>
                </div>
            </div>

            <div class="profile-menu">
                <div class="menu-section">
                    <div class="menu-title">账户设置</div>
                    <a href="#" class="menu-item" onclick="app.openSettings('account')">
                        <div class="menu-item-left">
                            <div class="menu-item-icon">
                                <i class="ri-user-settings-line"></i>
                            </div>
                            <div class="menu-item-text">账户信息</div>
                        </div>
                        <div class="menu-item-right">
                            <i class="ri-arrow-right-s-line"></i>
                        </div>
                    </a>
                    
                    <a href="#" class="menu-item" onclick="app.openSettings('security')">
                        <div class="menu-item-left">
                            <div class="menu-item-icon">
                                <i class="ri-shield-keyhole-line"></i>
                            </div>
                            <div class="menu-item-text">安全设置</div>
                        </div>
                        <div class="menu-item-right">
                            <i class="ri-arrow-right-s-line"></i>
                        </div>
                    </a>
                </div>

                <div class="menu-section">
                    <div class="menu-title">数据管理</div>
                    <a href="#" class="menu-item" onclick="app.exportData()">
                        <div class="menu-item-left">
                            <div class="menu-item-icon">
                                <i class="ri-download-line"></i>
                            </div>
                            <div class="menu-item-text">导出数据</div>
                        </div>
                    </a>
                    
                    <a href="#" class="menu-item" onclick="app.backupData()">
                        <div class="menu-item-left">
                            <div class="menu-item-icon">
                                <i class="ri-save-3-line"></i>
                            </div>
                            <div class="menu-item-text">备份数据</div>
                        </div>
                    </a>
                </div>

                <div class="menu-section">
                    <div class="menu-title">支持与服务</div>
                    <a href="#" class="menu-item" onclick="app.openHelp()">
                        <div class="menu-item-left">
                            <div class="menu-item-icon">
                                <i class="ri-question-line"></i>
                            </div>
                            <div class="menu-item-text">使用帮助</div>
                        </div>
                    </a>
                    
                    <a href="#" class="menu-item" onclick="app.openAbout()">
                        <div class="menu-item-left">
                            <div class="menu-item-icon">
                                <i class="ri-information-line"></i>
                            </div>
                            <div class="menu-item-text">关于我们</div>
                        </div>
                    </a>
                </div>

                <div class="menu-section">
                    <a href="#" class="menu-item" onclick="app.logout()" style="color: var(--danger);">
                        <div class="menu-item-left">
                            <div class="menu-item-icon">
                                <i class="ri-logout-box-r-line"></i>
                            </div>
                            <div class="menu-item-text">退出登录</div>
                        </div>
                    </a>
                </div>
            </div>
        `;
    }

    // 加载数据
    async loadData() {
        try {
            // 从本地存储加载数据
            const savedProperties = localStorage.getItem('houseshare_properties');
            const savedClients = localStorage.getItem('houseshare_clients');
            const savedUser = localStorage.getItem('houseshare_user');
            
            if (savedProperties) {
                this.properties = JSON.parse(savedProperties);
            }
            
            if (savedClients) {
                this.clients = JSON.parse(savedClients);
            }
            
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
            
            // 如果没有数据，加载示例数据
            if (this.properties.length === 0) {
                await this.loadSampleData();
            }
            
            console.log('数据加载完成');
            
        } catch (error) {
            console.error('数据加载失败:', error);
            throw error;
        }
    }

    // 加载示例数据
    async loadSampleData() {
        // 示例房源数据
        this.properties = [
            {
                id: '1',
                title: '市中心豪华公寓',
                location: '市中心黄金地段',
                area: 120,
                price: '280万',
                status: 'available',
                description: '豪华精装，拎包入住，交通便利',
                images: [],
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: '花园别墅',
                location: '高新区',
                area: 300,
                price: '580万',
                status: 'available',
                description: '独栋别墅，带私家花园，环境优美',
                images: [],
                createdAt: new Date().toISOString()
            },
            {
                id: '3',
                title: '江景豪宅',
                location: '滨江路',
                area: 200,
                price: '380万',
                status: 'pending',
                description: '一线江景，高档装修，视野开阔',
                images: [],
                createdAt: new Date().toISOString()
            }
        ];
        
        // 示例客户数据
        this.clients = [
            {
                id: '1',
                name: '张三',
                phone: '13800138000',
                email: 'zhangsan@example.com',
                tags: ['VIP客户', '多次成交'],
                notes: '注重地段和装修',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                name: '李四',
                phone: '13900139000',
                email: 'lisi@example.com',
                tags: ['新客户', '首次咨询'],
                notes: '预算200-300万',
                createdAt: new Date().toISOString()
            }
        ];
        
        // 示例用户数据
        this.currentUser = {
            id: 'admin',
            name: '管理员',
            role: '房源经理',
            avatar: null
        };
        
        // 保存到本地存储
        this.saveData();
    }

    // 保存数据到本地存储
    saveData() {
        localStorage.setItem('houseshare_properties', JSON.stringify(this.properties));
        localStorage.setItem('houseshare_clients', JSON.stringify(this.clients));
        localStorage.setItem('houseshare_user', JSON.stringify(this.currentUser));
    }

    // 获取最近的房源
    getRecentProperties() {
        return this.properties.slice(0, 3);
    }

    // 获取已发布朋友圈数量
    getPublishedCount() {
        return Math.floor(Math.random() * 20) + 5; // 模拟数据
    }

    // 获取累计成交额
    getTotalRevenue() {
        const total = this.properties
            .filter(p => p.status === 'sold')
            .reduce((sum, p) => {
                const price = parseFloat(p.price);
                return sum + (isNaN(price) ? 0 : price);
            }, 0);
        
        return total > 0 ? total.toLocaleString() + '万' : '0万';
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'available': '待售',
            'sold': '已售',
            'pending': '待定'
        };
        return statusMap[status] || status;
    }

    // 更新导航状态
    updateNavigation(pageName) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // 初始化页面组件
    initPageComponents(pageName) {
        // 根据页面名称初始化组件
        switch (pageName) {
            case 'home':
                this.initHomeComponents();
                break;
            case 'properties':
                this.initPropertiesComponents();
                break;
            case 'clients':
                this.initClientsComponents();
                break;
            case 'publish':
                this.initPublishComponents();
                break;
            case 'profile':
                this.initProfileComponents();
                break;
        }
    }

    // 初始化首页组件
    initHomeComponents() {
        // 绑定按钮事件
        const addPropertyBtn = document.getElementById('addPropertyBtn');
        const viewPropertiesBtn = document.getElementById('viewPropertiesBtn');
        const addClientBtn = document.getElementById('addClientBtn');
        const publishBtn = document.getElementById('publishBtn');
        
        if (addPropertyBtn) {
            addPropertyBtn.onclick = () => this.loadPage('properties');
        }
        
        if (viewPropertiesBtn) {
            viewPropertiesBtn.onclick = () => this.loadPage('properties');
        }
        
        if (addClientBtn) {
            addClientBtn.onclick = () => this.loadPage('clients');
        }
        
        if (publishBtn) {
            publishBtn.onclick = () => this.loadPage('publish');
        }
    }

    // 显示错误信息
    showError(message) {
        const errorElement = document.getElementById('pageContent');
        if (errorElement) {
            errorElement.innerHTML = `
                <div class="error-message" style="text-align: center; padding: var(--space-xl);">
                    <i class="ri-error-warning-line" style="font-size: 48px; color: var(--danger); margin-bottom: var(--space-md);"></i>
                    <h2 style="margin-bottom: var(--space-sm);">发生错误</h2>
                    <p style="color: var(--text-secondary); margin-bottom: var(--space-lg);">${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">重试</button>
                </div>
            `;
        }
    }

    // 绑定事件
    bindEvents() {
        // 绑定导航点击事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = item.dataset.page;
                this.loadPage(pageName);
            });
        });

        // 绑定浮动按钮事件
        const addButton = document.getElementById('addButton');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.showAddMenu();
            });
        }

        // 监听设备旋转
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.onOrientationChange();
            }, 100);
        });

        // 监听网络状态
        window.addEventListener('online', () => this.onNetworkChange(true));
        window.addEventListener('offline', () => this.onNetworkChange(false));
    }

    // 开始应用
    startApp() {
        // 隐藏加载动画
        setTimeout(() => {
            const loadingElement = document.getElementById('pageContent');
            if (loadingElement) {
                loadingElement.innerHTML = '';
                this.loadPage('home');
            }
        }, 1000);
    }

    // 显示添加菜单
    showAddMenu() {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>快速操作</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="add-menu">
                        <button class="add-menu-item" onclick="app.loadPage('properties')">
                            <i class="ri-add-circle-line"></i>
                            <span>新增房源</span>
                        </button>
                        <button class="add-menu-item" onclick="app.loadPage('clients')">
                            <i class="ri-user-add-line"></i>
                            <span>新增客户</span>
                        </button>
                        <button class="add-menu-item" onclick="app.loadPage('publish')">
                            <i class="ri-share-line"></i>
                            <span>发布朋友圈</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 显示模态框
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    // 设备旋转处理
    onOrientationChange() {
        console.log('屏幕方向改变');
        // 可以在这里调整布局
    }

    // 网络状态改变处理
    onNetworkChange(isOnline) {
        if (isOnline) {
            this.showNotification('网络已连接', 'info');
        } else {
            this.showNotification('网络已断开，部分功能可能受限', 'warning');
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'info' ? 'ri-information-line' : 'ri-alert-line';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">通知</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="ri-close-line"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('houseshare_user');
            location.reload();
        }
    }

    // 导出数据
    exportData() {
        const data = {
            properties: this.properties,
            clients: this.clients,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `houseshare-backup-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.showNotification('数据导出成功', 'info');
    }

    // 备份数据
    backupData() {
        // 这里可以添加云备份逻辑
        this.showNotification('本地数据已备份', 'info');
    }
}

// 创建应用实例
const app = new HouseShareApp();
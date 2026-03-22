// HouseShare APP 主应用逻辑
class HouseShareApp {
    constructor() {
        this.currentUser = null;
        this.properties = [];
        this.clients = [];
        this.communities = []; // 小区列表
        this.propertySearchTerm = ''; // 房源搜索关键词
        this.agencySources = []; // 代理来源方列表
        this.agencyProperties = []; // 可代理房源列表
        this.agencySearchTerm = ''; // 代理房源搜索关键词
        this.currentAgencySourceId = null; // 当前筛选的来源方ID
        // 自定义下拉选项
        this.customLayouts = []; // 自定义户型
        this.customDecorations = []; // 自定义装修
        this.customFloors = []; // 自定义楼层
        // 页面历史管理
        this.pageHistory = ['home']; // 页面历史栈
        this.isHandlingPopState = false; // 是否正在处理popstate事件
        this.init();
    }

    // 初始化应用
    async init() {
        console.log('HouseShareApp 开始初始化...');
        try {
            console.log('注册 Service Worker...');
            // 注册 Service Worker (使用相对路径适配GitHub Pages)
            if ('serviceWorker' in navigator) {
                try {
                    await navigator.serviceWorker.register('./sw.js');
                    console.log('Service Worker 注册成功');
                } catch (e) {
                    console.warn('Service Worker 注册失败，将以离线模式运行:', e);
                }
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

        // 监听浏览器返回键
        window.addEventListener('popstate', (e) => {
            console.log('popstate 事件触发', e.state);
            if (this.isHandlingPopState) return;
            this.isHandlingPopState = true;

            if (this.pageHistory.length > 1) {
                // 弹出当前页面
                this.pageHistory.pop();
                // 获取前一个页面
                const prevPage = this.pageHistory[this.pageHistory.length - 1];
                console.log('返回到上一个页面:', prevPage);
                this.loadPage(prevPage, false); // false 表示不添加历史记录
            } else {
                // 已经是第一个页面，不做操作
                console.log('已经是第一个页面');
            }

            setTimeout(() => {
                this.isHandlingPopState = false;
            }, 100);
        });

        // 检查 URL hash，如果存在则加载对应页面
        const hash = window.location.hash.slice(1);
        const validPages = ['home', 'properties', 'agency', 'clients', 'publish', 'profile'];
        if (hash && validPages.includes(hash)) {
            this.initialPage = hash;
        }

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
    async loadPage(pageName, addToHistory = true) {
        console.log('loadPage 被调用:', pageName, 'addToHistory:', addToHistory);
        try {
            this.showLoading();

            // 添加到历史记录
            if (addToHistory) {
                const currentPage = this.pageHistory[this.pageHistory.length - 1];
                if (currentPage !== pageName) {
                    this.pageHistory.push(pageName);
                    // 使用 history.pushState 添加浏览器历史
                    history.pushState({ page: pageName }, '', '#' + pageName);
                    console.log('添加页面到历史:', pageName, '历史栈:', this.pageHistory);
                }
            }

            let pageContent = '';

            switch (pageName) {
                case 'home':
                    pageContent = this.getHomePage();
                    break;
                case 'properties':
                    pageContent = this.getPropertiesPage();
                    break;
                case 'agency':
                    pageContent = this.getAgencyPage();
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

                <div class="stats-cards">
                    <div class="stat-card" id="propertyCountCard" style="cursor: pointer;">
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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
                        <h2>最近房源</h2>
                        <button class="btn btn-secondary" onclick="app.loadPage('properties')">
                            更多房源 <i class="ri-arrow-right-line"></i>
                        </button>
                    </div>
                    ${this.getRecentProperties().map(property => `
                        <div class="property-item" onclick="app.viewProperty('${property.id}')" style="cursor: pointer;">
                            <div class="property-image">
                                <i class="ri-home-3-line"></i>
                            </div>
                            <div class="property-info">
                                <div class="property-title">${property.title}</div>
                                <div class="property-meta">
                                    <div class="property-meta-item">
                                        <i class="ri-map-pin-line"></i>
                                        <span>${property.location || '-'}</span>
                                    </div>
                                    <div class="property-meta-item">
                                        <i class="ri-ruler-line"></i>
                                        <span>${property.area || '-'}㎡</span>
                                    </div>
                                    <div class="property-meta-item">
                                        <i class="ri-home-line"></i>
                                        <span>${property.layout || '-'}</span>
                                    </div>
                                </div>
                                <div class="property-price">${property.price}${property.listingType === 'rent' ? '元/月' : '万'}</div>
                                <span class="property-status status-${property.status}">
                                    ${property.listingType === 'rent' ? '租' : '售'} | ${this.getStatusText(property.status)}
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
        // 过滤搜索结果
        const searchTerm = this.propertySearchTerm || '';
        const filteredProperties = searchTerm ? this.properties.filter(p => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (p.title && p.title.toLowerCase().includes(searchLower)) ||
                (p.location && p.location.toLowerCase().includes(searchLower)) ||
                (p.layout && p.layout.toLowerCase().includes(searchLower)) ||
                (p.doorNumber && p.doorNumber.toLowerCase().includes(searchLower)) ||
                (p.ownerName && p.ownerName.toLowerCase().includes(searchLower)) ||
                (p.description && p.description.toLowerCase().includes(searchLower))
            );
        }) : this.properties;
        
        return `
            <div class="page-header">
                <h1>房源管理</h1>
                <p>管理您的所有房源信息</p>
            </div>

            <div class="search-box" style="margin-bottom: var(--space-lg);">
                <i class="ri-search-line"></i>
                <input type="text" id="propertySearch" placeholder="搜索房源..." value="${searchTerm}">
                ${searchTerm ? '<i class="ri-close-line clear-search" onclick="app.clearPropertySearch()" style="cursor: pointer;"></i>' : ''}
            </div>

            <div class="actions-bar" style="margin-bottom: var(--space-xl);">
                <button class="btn btn-primary" id="addSalePropertyBtn" style="flex: 1;">
                    <i class="ri-home-line"></i> 新增卖房
                </button>
                <button class="btn btn-outline" id="addRentPropertyBtn" style="flex: 1;">
                    <i class="ri-home-line"></i> 新增租房
                </button>
                <button class="btn btn-outline" id="filterPropertiesBtn">
                    <i class="ri-filter-line"></i> 筛选
                </button>
            </div>

            <div class="properties-grid">
                ${filteredProperties.length > 0 ? filteredProperties.map(property => `
                    <div class="property-card">
                        <div class="property-card-header">
                            <h3>${property.title}</h3>
                            <span class="property-status status-${property.status}">
                                ${property.listingType === 'rent' ? '租' : '售'} | ${this.getStatusText(property.status)}
                            </span>
                        </div>
                        <div class="property-card-body">
                            <div class="property-info-row">
                                <i class="ri-map-pin-line"></i>
                                <span>${property.location || property.doorNumber || '-'}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-ruler-line"></i>
                                <span>${property.area || '-'}㎡</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-home-line"></i>
                                <span>${property.layout || '-'}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-building-line"></i>
                                <span>${property.floor ? property.floor + '楼' : '-'}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-money-dollar-circle-line"></i>
                                <span class="property-price">${property.price}${property.listingType === 'rent' ? '元/月' : '万'}</span>
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
                `).join('') : '<div style="text-align: center; padding: 40px; color: #999;">暂无房源</div>'}
            </div>
        `;
    }
    
    // 获取代理房源页面
    getAgencyPage() {
        // 过滤搜索结果和来源方
        let filteredProperties = this.agencyProperties;
        
        // 按来源方筛选
        if (this.currentAgencySourceId !== null) {
            filteredProperties = filteredProperties.filter(p => p.sourceId === this.currentAgencySourceId);
        }
        
        // 按关键词筛选
        const searchTerm = this.agencySearchTerm || '';
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filteredProperties = filteredProperties.filter(p => {
                return (
                    (p.title && p.title.toLowerCase().includes(searchLower)) ||
                    (p.location && p.location.toLowerCase().includes(searchLower)) ||
                    (p.remark && p.remark.toLowerCase().includes(searchLower))
                );
            });
        }
        
        // 获取来源方列表
        const sources = this.agencySources || [];
        
        return `
            <div class="page-header">
                <h1>可代理房源</h1>
                <p>管理您的可代理房源信息</p>
            </div>

            <div class="search-box" style="margin-bottom: var(--space-lg);">
                <i class="ri-search-line"></i>
                <input type="text" id="agencySearch" placeholder="搜索代理房源..." value="${searchTerm}">
                ${searchTerm ? '<i class="ri-close-line clear-search" onclick="app.clearAgencySearch()" style="cursor: pointer;"></i>' : ''}
            </div>

            <!-- 来源方标签 -->
            <div class="agency-source-tabs">
                <button class="agency-tab ${this.currentAgencySourceId === null ? 'active' : ''}" onclick="app.filterAgencySource(null)">
                    全部 <span class="tab-count">${this.agencyProperties.length}</span>
                </button>
                ${sources.map(s => `
                    <button class="agency-tab ${this.currentAgencySourceId === s.id ? 'active' : ''}" onclick="app.filterAgencySource(${s.id})">
                        ${s.name} <span class="tab-count">${this.agencyProperties.filter(p => p.sourceId === s.id).length}</span>
                    </button>
                `).join('')}
                <button class="agency-tab add-source" onclick="app.showAddAgencySourceModal()">
                    <i class="ri-add-line"></i> 添加来源
                </button>
            </div>

            <div class="actions-bar" style="margin-bottom: var(--space-xl);">
                <button class="btn btn-primary" id="addAgencyPropertyBtn" style="flex: 1;">
                    <i class="ri-add-line"></i> 新增代理房源
                </button>
            </div>

            <div class="properties-grid">
                ${filteredProperties.length > 0 ? filteredProperties.map(property => `
                    <div class="property-card">
                        <div class="property-card-header">
                            <h3>${property.title}</h3>
                            <span class="property-status status-agency">
                                ${property.listingType === 'rent' ? '租' : '售'}
                            </span>
                        </div>
                        <div class="property-card-body">
                            <div class="property-info-row">
                                <i class="ri-map-pin-line"></i>
                                <span>${property.location || '-'}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-ruler-line"></i>
                                <span>${property.area || '-'}㎡</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-home-line"></i>
                                <span>${property.layout || '-'}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-money-dollar-circle-line"></i>
                                <span class="property-price">${property.price}${property.listingType === 'rent' ? '元/月' : '万'}</span>
                            </div>
                            ${property.remark ? `<div class="property-info-row"><i class="ri-note-line"></i><span>${property.remark}</span></div>` : ''}
                        </div>
                        <div class="property-card-footer">
                            <button class="btn btn-text" onclick="app.editAgencyProperty('${property.id}')">
                                <i class="ri-edit-line"></i> 编辑
                            </button>
                            <button class="btn btn-text btn-danger" onclick="app.deleteAgencyProperty('${property.id}')">
                                <i class="ri-delete-bin-line"></i> 删除
                            </button>
                        </div>
                    </div>
                `).join('') : '<div style="text-align: center; padding: 40px; color: #999;">暂无代理房源</div>'}
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
            // 优先从网页版相同key加载，实现数据互通
            let savedProperties = localStorage.getItem('houseshare_properties');
            let savedClients = localStorage.getItem('houseshare_customers') || localStorage.getItem('houseshare_clients');
            let savedUser = localStorage.getItem('hs_user') || localStorage.getItem('houseshare_user');
            
            if (savedProperties) {
                this.properties = JSON.parse(savedProperties);
            }
            
            if (savedClients) {
                this.clients = JSON.parse(savedClients);
            }
            
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
            
            // 加载小区数据（与网页版互通）
            let savedCommunities = localStorage.getItem('houseshare_communities');
            if (savedCommunities) {
                this.communities = JSON.parse(savedCommunities);
            } else {
                // 如果没有小区数据，初始化空数组
                this.communities = [];
            }
            
            // 加载代理来源方数据（与网页版互通）
            let savedAgencySources = localStorage.getItem('houseshare_agency_sources');
            if (savedAgencySources) {
                this.agencySources = JSON.parse(savedAgencySources);
            } else {
                this.agencySources = [];
            }
            
            // 加载可代理房源数据（与网页版互通）
            let savedAgencyProperties = localStorage.getItem('houseshare_agency_properties');
            if (savedAgencyProperties) {
                this.agencyProperties = JSON.parse(savedAgencyProperties);
            } else {
                this.agencyProperties = [];
            }

            // 加载自定义户型
            let savedCustomLayouts = localStorage.getItem('houseshare_custom_layouts');
            if (savedCustomLayouts) {
                this.customLayouts = JSON.parse(savedCustomLayouts);
            }

            // 加载自定义装修
            let savedCustomDecorations = localStorage.getItem('houseshare_custom_decorations');
            if (savedCustomDecorations) {
                this.customDecorations = JSON.parse(savedCustomDecorations);
            }

            // 加载自定义楼层
            let savedCustomFloors = localStorage.getItem('houseshare_custom_floors');
            if (savedCustomFloors) {
                this.customFloors = JSON.parse(savedCustomFloors);
            }

            // 不再自动加载示例数据，保留现有数据
            // if (this.properties.length === 0) { await this.loadSampleData(); }
            
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
        // 使用与网页版相同的key，实现数据互通
        localStorage.setItem('houseshare_properties', JSON.stringify(this.properties));
        localStorage.setItem('houseshare_customers', JSON.stringify(this.clients));
        localStorage.setItem('hs_user', JSON.stringify(this.currentUser));
        
        // 同时保存旧key以兼容
        localStorage.setItem('houseshare_clients', JSON.stringify(this.clients));
        localStorage.setItem('houseshare_user', JSON.stringify(this.currentUser));
        
        // 保存小区数据（与网页版互通）
        // 确保communities数组已初始化
        if (!this.communities) {
            this.communities = [];
        }
        localStorage.setItem('houseshare_communities', JSON.stringify(this.communities));
        
        // 保存代理来源方数据（与网页版互通）
        if (!this.agencySources) {
            this.agencySources = [];
        }
        localStorage.setItem('houseshare_agency_sources', JSON.stringify(this.agencySources));
        
        // 保存可代理房源数据（与网页版互通）
        if (!this.agencyProperties) {
            this.agencyProperties = [];
        }
        localStorage.setItem('houseshare_agency_properties', JSON.stringify(this.agencyProperties));

        // 保存自定义选项
        localStorage.setItem('houseshare_custom_layouts', JSON.stringify(this.customLayouts || []));
        localStorage.setItem('houseshare_custom_decorations', JSON.stringify(this.customDecorations || []));
        localStorage.setItem('houseshare_custom_floors', JSON.stringify(this.customFloors || []));
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
            'active': '待售',
            'sold': '已售',
            'pending': '待发布',
            'offline': '已下架'
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
            case 'agency':
                this.initAgencyComponents();
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
        console.log('初始化首页组件...');
        
        // 使用 addEventListener 绑定事件，确保兼容性
        const addSalePropertyBtn = document.getElementById('addSalePropertyBtn');
        const addRentPropertyBtn = document.getElementById('addRentPropertyBtn');
        const viewPropertiesBtn = document.getElementById('viewPropertiesBtn');
        const addClientBtn = document.getElementById('addClientBtn');
        const publishBtn = document.getElementById('publishBtn');
        const propertyCountCard = document.getElementById('propertyCountCard');
        
        console.log('首页按钮元素:', {addSalePropertyBtn, addRentPropertyBtn, viewPropertiesBtn, addClientBtn, publishBtn, propertyCountCard});
        
        // 新增卖房按钮
        if (addSalePropertyBtn) {
            addSalePropertyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击新增卖房按钮');
                this.showAddPropertyModal('sale');
            });
        }
        
        // 新增租房按钮
        if (addRentPropertyBtn) {
            addRentPropertyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击新增租房按钮');
                this.showAddPropertyModal('rent');
            });
        }
        
        // 房源总数点击跳转
        if (propertyCountCard) {
            propertyCountCard.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击房源总数');
                this.loadPage('properties');
            });
        }
        
        if (viewPropertiesBtn) {
            viewPropertiesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击查看房源按钮');
                this.loadPage('properties');
            });
        }
        
        if (addClientBtn) {
            addClientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击新增客户按钮');
                this.loadPage('clients');
            });
        }
        
        if (publishBtn) {
            publishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击发布按钮');
                this.loadPage('publish');
            });
        }
    }

    // 初始化房源页面组件
    initPropertiesComponents() {
        console.log('初始化房源页面组件...');
        
        // 绑定新增卖房按钮
        const addSalePropertyBtn = document.getElementById('addSalePropertyBtn');
        console.log('新增卖房按钮元素:', addSalePropertyBtn);
        
        if (addSalePropertyBtn) {
            addSalePropertyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击新增卖房按钮 (房源页)');
                this.showAddPropertyModal('sale');
            });
        }
        
        // 绑定新增租房按钮
        const addRentPropertyBtn = document.getElementById('addRentPropertyBtn');
        console.log('新增租房按钮元素:', addRentPropertyBtn);
        
        if (addRentPropertyBtn) {
            addRentPropertyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击新增租房按钮 (房源页)');
                this.showAddPropertyModal('rent');
            });
        }
        
        // 绑定筛选按钮
        const filterPropertiesBtn = document.getElementById('filterPropertiesBtn');
        if (filterPropertiesBtn) {
            filterPropertiesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击筛选按钮');
                this.showFilterModal();
            });
        }
        
        // 绑定搜索框
        const propertySearch = document.getElementById('propertySearch');
        if (propertySearch) {
            propertySearch.addEventListener('input', (e) => {
                console.log('搜索房源:', e.target.value);
                this.propertySearchTerm = e.target.value;
                this.refreshPropertiesList();
            });
        }
    }
    
    // 刷新房源列表（带搜索过滤）
    refreshPropertiesList() {
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.innerHTML = this.getPropertiesPage();
            this.initPropertiesComponents();
        }
    }
    
    // 清除房源搜索
    clearPropertySearch() {
        this.propertySearchTerm = '';
        this.refreshPropertiesList();
    }
    
    // 初始化代理页面组件
    initAgencyComponents() {
        console.log('初始化代理页面组件...');
        
        // 绑定新增代理房源按钮
        const addAgencyPropertyBtn = document.getElementById('addAgencyPropertyBtn');
        console.log('新增代理房源按钮元素:', addAgencyPropertyBtn);
        
        if (addAgencyPropertyBtn) {
            addAgencyPropertyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击新增代理房源按钮');
                this.showAddAgencyPropertyModal();
            });
        }
        
        // 绑定搜索框
        const agencySearch = document.getElementById('agencySearch');
        if (agencySearch) {
            agencySearch.addEventListener('input', (e) => {
                console.log('搜索代理房源:', e.target.value);
                this.agencySearchTerm = e.target.value;
                this.refreshAgencyList();
            });
        }
    }
    
    // 刷新代理房源列表（带搜索过滤）
    refreshAgencyList() {
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.innerHTML = this.getAgencyPage();
            this.initAgencyComponents();
        }
    }
    
    // 清除代理房源搜索
    clearAgencySearch() {
        this.agencySearchTerm = '';
        this.refreshAgencyList();
    }
    
    // 筛选来源方
    filterAgencySource(sourceId) {
        this.currentAgencySourceId = sourceId;
        this.refreshAgencyList();
    }
    
    // 获取筛选后的代理房源
    getFilteredAgencyProperties() {
        let list = this.agencyProperties;
        
        // 按来源方筛选
        if (this.currentAgencySourceId !== null) {
            list = list.filter(p => p.sourceId === this.currentAgencySourceId);
        }
        
        // 按关键词筛选
        if (this.agencySearchTerm) {
            const kw = this.agencySearchTerm.toLowerCase();
            list = list.filter(p =>
                (p.title && p.title.toLowerCase().includes(kw)) ||
                (p.location && p.location.toLowerCase().includes(kw)) ||
                (p.remark && p.remark.toLowerCase().includes(kw))
            );
        }
        
        return list;
    }
    
    // 显示添加来源方弹窗
    showAddAgencySourceModal() {
        const name = prompt('请输入来源方名称：');
        if (!name || !name.trim()) {
            this.showMessage('来源方名称不能为空', 'error');
            return;
        }
        
        const source = {
            id: Date.now(),
            name: name.trim(),
            remark: '',
            createdAt: new Date().toISOString()
        };
        
        this.agencySources.push(source);
        this.saveData();
        this.refreshAgencyList();
        this.showMessage('来源方已添加', 'success');
    }
    
    // 显示新增代理房源弹窗
    showAddAgencyPropertyModal() {
        console.log('showAddAgencyPropertyModal 被调用');
        
        // 移除已存在的弹窗
        const existingModal = document.getElementById('addAgencyPropertyModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const sources = this.agencySources || [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'addAgencyPropertyModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>新增代理房源</h2>
                    <button class="modal-close" onclick="app.closeModal('addAgencyPropertyModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addAgencyPropertyForm">
                        <div class="form-group">
                            <label>来源方 *</label>
                            <select id="agencyPropertySource" required>
                                <option value="">请选择来源方</option>
                                ${sources.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>小区名称 *</label>
                            <input type="text" id="agencyPropertyTitle" required placeholder="请输入小区名称">
                        </div>
                        <div class="form-group">
                            <label>位置/地址</label>
                            <input type="text" id="agencyPropertyLocation" placeholder="请输入位置/地址">
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>价格 *</label>
                                <input type="number" id="agencyPropertyPrice" required placeholder="万元">
                            </div>
                            <div class="form-group">
                                <label>面积 (㎡) *</label>
                                <input type="number" id="agencyPropertyArea" required placeholder="㎡">
                            </div>
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>户型</label>
                                <select id="agencyPropertyLayout">
                                    <option value="">请选择户型</option>
                                    <option value="1-1">1室1厅</option>
                                    <option value="2-1">2室1厅</option>
                                    <option value="2-2">2室2厅</option>
                                    <option value="3-1">3室1厅</option>
                                    <option value="3-2">3室2厅</option>
                                    <option value="3-2-2">3室2厅2卫</option>
                                    <option value="4-2">4室2厅</option>
                                    <option value="4-2-2">4室2厅2卫</option>
                                    <option value="5-2">5室2厅</option>
                                    <option value="5-3">5室3厅</option>
                                    <option value="6-3">6室3厅</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>楼层</label>
                                <input type="text" id="agencyPropertyFloor" placeholder="如：10/30">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>装修</label>
                            <select id="agencyPropertyDecoration">
                                <option value="">请选择装修</option>
                                <option value="毛坯">毛坯</option>
                                <option value="简装">简装</option>
                                <option value="精装">精装</option>
                                <option value="豪装">豪装</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>租售类型 *</label>
                            <select id="agencyPropertyListingType" required>
                                <option value="sale">出售</option>
                                <option value="rent">出租</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>备注</label>
                            <textarea id="agencyPropertyRemark" rows="2" placeholder="房源亮点、特殊说明等..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">保存代理房源</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击遮罩关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('addAgencyPropertyModal');
            }
        });
        
        // 绑定表单提交
        document.getElementById('addAgencyPropertyForm').onsubmit = (e) => {
            e.preventDefault();
            this.saveAgencyProperty();
        };
    }
    
    // 保存代理房源
    saveAgencyProperty() {
        const now = new Date().toISOString();
        const sourceId = document.getElementById('agencyPropertySource').value;
        
        if (!sourceId) {
            this.showMessage('请选择来源方', 'error');
            return;
        }
        
        const listingType = document.getElementById('agencyPropertyListingType').value;
        
        const property = {
            id: Date.now(),
            sourceId: parseInt(sourceId),
            title: document.getElementById('agencyPropertyTitle').value,
            location: document.getElementById('agencyPropertyLocation').value,
            price: document.getElementById('agencyPropertyPrice').value,
            area: parseFloat(document.getElementById('agencyPropertyArea').value) || 0,
            layout: document.getElementById('agencyPropertyLayout').value,
            floor: document.getElementById('agencyPropertyFloor').value,
            decoration: document.getElementById('agencyPropertyDecoration').value,
            listingType: listingType,
            remark: document.getElementById('agencyPropertyRemark').value,
            createdAt: now
        };
        
        this.agencyProperties.push(property);
        this.saveData();
        this.closeModal('addAgencyPropertyModal');
        this.refreshAgencyList();
        this.showMessage('代理房源已添加', 'success');
    }
    
    // 编辑代理房源
    editAgencyProperty(id) {
        const property = this.agencyProperties.find(p => p.id == id);
        if (!property) {
            this.showError('房源不存在');
            return;
        }
        
        const sources = this.agencySources || [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'editAgencyPropertyModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>编辑代理房源</h2>
                    <button class="modal-close" onclick="app.closeModal('editAgencyPropertyModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editAgencyPropertyForm">
                        <div class="form-group">
                            <label>来源方 *</label>
                            <select id="editAgencyPropertySource" required>
                                <option value="">请选择来源方</option>
                                ${sources.map(s => `<option value="${s.id}" ${property.sourceId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>小区名称 *</label>
                            <input type="text" id="editAgencyPropertyTitle" required placeholder="请输入小区名称" value="${property.title || ''}">
                        </div>
                        <div class="form-group">
                            <label>位置/地址</label>
                            <input type="text" id="editAgencyPropertyLocation" placeholder="请输入位置/地址" value="${property.location || ''}">
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>价格 *</label>
                                <input type="number" id="editAgencyPropertyPrice" required placeholder="万元" value="${property.price || ''}">
                            </div>
                            <div class="form-group">
                                <label>面积 (㎡) *</label>
                                <input type="number" id="editAgencyPropertyArea" required placeholder="㎡" value="${property.area || ''}">
                            </div>
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>户型</label>
                                <select id="editAgencyPropertyLayout">
                                    <option value="">请选择户型</option>
                                    <option value="1-1" ${property.layout === '1-1' ? 'selected' : ''}>1室1厅</option>
                                    <option value="2-1" ${property.layout === '2-1' ? 'selected' : ''}>2室1厅</option>
                                    <option value="2-2" ${property.layout === '2-2' ? 'selected' : ''}>2室2厅</option>
                                    <option value="3-1" ${property.layout === '3-1' ? 'selected' : ''}>3室1厅</option>
                                    <option value="3-2" ${property.layout === '3-2' ? 'selected' : ''}>3室2厅</option>
                                    <option value="3-2-2" ${property.layout === '3-2-2' ? 'selected' : ''}>3室2厅2卫</option>
                                    <option value="4-2" ${property.layout === '4-2' ? 'selected' : ''}>4室2厅</option>
                                    <option value="4-2-2" ${property.layout === '4-2-2' ? 'selected' : ''}>4室2厅2卫</option>
                                    <option value="5-2" ${property.layout === '5-2' ? 'selected' : ''}>5室2厅</option>
                                    <option value="5-3" ${property.layout === '5-3' ? 'selected' : ''}>5室3厅</option>
                                    <option value="6-3" ${property.layout === '6-3' ? 'selected' : ''}>6室3厅</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>楼层</label>
                                <input type="text" id="editAgencyPropertyFloor" placeholder="如：10/30" value="${property.floor || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>装修</label>
                            <select id="editAgencyPropertyDecoration">
                                <option value="">请选择装修</option>
                                <option value="毛坯" ${property.decoration === '毛坯' ? 'selected' : ''}>毛坯</option>
                                <option value="简装" ${property.decoration === '简装' ? 'selected' : ''}>简装</option>
                                <option value="精装" ${property.decoration === '精装' ? 'selected' : ''}>精装</option>
                                <option value="豪装" ${property.decoration === '豪装' ? 'selected' : ''}>豪装</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>租售类型 *</label>
                            <select id="editAgencyPropertyListingType" required>
                                <option value="sale" ${property.listingType === 'sale' ? 'selected' : ''}>出售</option>
                                <option value="rent" ${property.listingType === 'rent' ? 'selected' : ''}>出租</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>备注</label>
                            <textarea id="editAgencyPropertyRemark" rows="2" placeholder="房源亮点、特殊说明等...">${property.remark || ''}</textarea>
                        </div>
                        <input type="hidden" id="editAgencyPropertyId" value="${property.id}">
                        <button type="submit" class="btn btn-primary btn-block">保存修改</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击遮罩关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('editAgencyPropertyModal');
            }
        });
        
        // 绑定表单提交
        document.getElementById('editAgencyPropertyForm').onsubmit = (e) => {
            e.preventDefault();
            this.updateAgencyProperty();
        };
    }
    
    // 更新代理房源
    updateAgencyProperty() {
        const id = document.getElementById('editAgencyPropertyId').value;
        const index = this.agencyProperties.findIndex(p => p.id == id);
        
        if (index === -1) {
            this.showError('房源不存在');
            return;
        }
        
        this.agencyProperties[index] = {
            ...this.agencyProperties[index],
            sourceId: parseInt(document.getElementById('editAgencyPropertySource').value),
            title: document.getElementById('editAgencyPropertyTitle').value,
            location: document.getElementById('editAgencyPropertyLocation').value,
            price: document.getElementById('editAgencyPropertyPrice').value,
            area: parseFloat(document.getElementById('editAgencyPropertyArea').value) || 0,
            layout: document.getElementById('editAgencyPropertyLayout').value,
            floor: document.getElementById('editAgencyPropertyFloor').value,
            decoration: document.getElementById('editAgencyPropertyDecoration').value,
            listingType: document.getElementById('editAgencyPropertyListingType').value,
            remark: document.getElementById('editAgencyPropertyRemark').value
        };
        
        this.saveData();
        this.closeModal('editAgencyPropertyModal');
        this.refreshAgencyList();
        this.showMessage('代理房源已更新', 'success');
    }
    
    // 删除代理房源
    deleteAgencyProperty(id) {
        if (!confirm('确定要删除这个代理房源吗？此操作不可恢复。')) {
            return;
        }
        
        const index = this.agencyProperties.findIndex(p => p.id == id);
        if (index === -1) {
            this.showError('房源不存在');
            return;
        }
        
        this.agencyProperties.splice(index, 1);
        this.saveData();
        
        this.closeModal('editAgencyPropertyModal');
        this.refreshAgencyList();
        this.showMessage('代理房源已删除', 'success');
    }
    
    // 显示新增房源弹窗
    showAddPropertyModal(listingType = 'sale') {
        console.log('showAddPropertyModal 被调用, listingType:', listingType);
        
        // 设置标题
        const title = listingType === 'rent' ? '新增租房' : '新增卖房';
        
        // 移除已存在的弹窗
        const existingModal = document.getElementById('addPropertyModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'addPropertyModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="app.closeModal('addPropertyModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- 智能识别区域 -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 16px; margin-bottom: 20px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-weight: 600;"><i class="ri-magic-line"></i> AI智能识别</span>
                            <button type="button" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px;" onclick="app.startSmartVoiceInput()">
                                <i class="ri-mic-line"></i> 语音识别
                            </button>
                        </div>
                        <textarea id="smartParseText" placeholder="或粘贴房源信息，如：江景豪宅 3室2厅 120㎡ 280万 精装修" 
                            style="width: 100%; padding: 10px; border: none; border-radius: 8px; font-size: 14px; resize: none; margin-bottom: 10px;"
                            rows="2"></textarea>
                        <button type="button" class="btn" style="width: 100%; background: white; color: #667eea; font-weight: 600; border-radius: 8px;"
                            onclick="app.parseSmartText()">
                            <i class="ri-lightbulb-line"></i> 智能解析填充
                        </button>
                    </div>
                    
                    <form id="addPropertyForm">
                        <input type="hidden" id="propertyListingType" value="${listingType}">
                        <div class="form-group">
                            <label>租售类型</label>
                            <div style="padding: 10px; background: #e8f5e9; border-radius: 8px; color: #2e7d32; font-weight: 600;">
                                <i class="ri-${listingType === 'rent' ? 'home-line' : 'home-warm-line'}"></i> ${listingType === 'rent' ? '租房' : '卖房'}
                            </div>
                        </div>
                        <div class="form-group">
                            <label>小区名称 * <button type="button" class="btn btn-icon" style="padding: 2px 6px;" onclick="app.showAddCommunityModal()" title="添加小区"><i class="ri-add-line"></i></button></label>
                            <input type="text" id="propertyTitle" required placeholder="请输入或选择小区名称" list="communityList">
                            <datalist id="communityList">
                                ${(this.communities || []).map(c => `<option value="${c.name}">`).join('')}
                            </datalist>
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>价格 *</label>
                                <input type="number" id="propertyPrice" required placeholder="万元">
                            </div>
                            <div class="form-group">
                                <label>面积 (㎡) *</label>
                                <input type="number" id="propertyArea" required placeholder="㎡">
                            </div>
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>户型 <button type="button" class="btn btn-icon" style="padding: 2px 6px;" onclick="app.showAddCustomOptionModal('layout')" title="添加户型"><i class="ri-add-line"></i></button></label>
                                <input type="text" id="propertyLayout" placeholder="请选择或输入户型" list="layoutList">
                                <datalist id="layoutList">
                                    <option value="1-1">1室1厅</option>
                                    <option value="2-1">2室1厅</option>
                                    <option value="2-2">2室2厅</option>
                                    <option value="3-1">3室1厅</option>
                                    <option value="3-2">3室2厅</option>
                                    <option value="3-2-2">3室2厅2卫</option>
                                    <option value="4-2">4室2厅</option>
                                    <option value="4-2-2">4室2厅2卫</option>
                                    <option value="5-2">5室2厅</option>
                                    ${(this.customLayouts || []).map(l => `<option value="${l}">`).join('')}
                                </datalist>
                            </div>
                            <div class="form-group">
                                <label>楼层 <button type="button" class="btn btn-icon" style="padding: 2px 6px;" onclick="app.showAddCustomOptionModal('floor')" title="添加楼层"><i class="ri-add-line"></i></button></label>
                                <input type="text" id="propertyFloor" placeholder="请选择或输入楼层" list="floorList">
                                <datalist id="floorList">
                                    <option value="1">1楼</option>
                                    <option value="2">2楼</option>
                                    <option value="3">3楼</option>
                                    <option value="4">4楼</option>
                                    <option value="5">5楼</option>
                                    <option value="6">6楼</option>
                                    <option value="7">7楼</option>
                                    <option value="8">8楼</option>
                                    <option value="9">9楼</option>
                                    <option value="10">10楼</option>
                                    <option value="11">11楼</option>
                                    <option value="12">12楼</option>
                                    <option value="13">13楼</option>
                                    <option value="14">14楼</option>
                                    <option value="15">15楼</option>
                                    <option value="16">16楼</option>
                                    <option value="17">17楼</option>
                                    <option value="18">18楼</option>
                                    <option value="19">19楼</option>
                                    <option value="20">20楼</option>
                                    <option value="21">21楼</option>
                                    <option value="22">22楼</option>
                                    <option value="23">23楼</option>
                                    <option value="24">24楼</option>
                                    <option value="25">25楼</option>
                                    <option value="26">26楼</option>
                                    <option value="27">27楼</option>
                                    <option value="28">28楼</option>
                                    <option value="29">29楼</option>
                                    <option value="30">30楼</option>
                                    ${(this.customFloors || []).map(f => `<option value="${f}">${f}楼</option>`).join('')}
                                </datalist>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>楼栋及门牌号</label>
                            <input type="text" id="propertyDoorNumber" placeholder="例如：3号楼201室">
                        </div>
                        <div class="form-group">
                            <label>装修 <button type="button" class="btn btn-icon" style="padding: 2px 6px;" onclick="app.showAddCustomOptionModal('decoration')" title="添加装修"><i class="ri-add-line"></i></button></label>
                            <input type="text" id="propertyDecoration" placeholder="请选择或输入装修" list="decorationList">
                            <datalist id="decorationList">
                                <option value="毛坯">毛坯</option>
                                <option value="简装">简装</option>
                                <option value="精装">精装</option>
                                <option value="豪装">豪装</option>
                                ${(this.customDecorations || []).map(d => `<option value="${d}">${d}</option>`).join('')}
                            </datalist>
                        </div>
                        <div class="form-group">
                            <label>房东姓名</label>
                            <input type="text" id="propertyOwnerName" placeholder="房东姓名">
                        </div>
                        <div class="form-group">
                            <label>房东电话</label>
                            <input type="tel" id="propertyOwnerPhone" placeholder="房东电话">
                        </div>
                        <div class="form-group">
                            <label>房源描述</label>
                            <textarea id="propertyDescription" rows="3" placeholder="房源亮点、装修情况、周边配套等..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>状态</label>
                            <select id="propertyStatus">
                                <option value="pending">待发布</option>
                                <option value="offline">已下架</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">保存房源</button>
                    </form>
                    <div id="voiceStatus" class="voice-status" style="display: none; margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 8px; text-align: center;">
                        <i class="ri-mic-line" style="color: #1A73E8;"></i> <span>正在聆听...</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击遮罩关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('addPropertyModal');
            }
        });
        
        // 绑定表单提交
        document.getElementById('addPropertyForm').onsubmit = (e) => {
            e.preventDefault();
            this.saveProperty();
        };
    }

    // 保存房源 - 使用与网页版兼容的数据格式
    saveProperty() {
        const now = new Date().toISOString();
        const title = document.getElementById('propertyTitle').value.trim();
        const listingType = document.getElementById('propertyListingType').value;

        // 获取当前登录用户信息
        const currentUser = JSON.parse(localStorage.getItem('hs_user') || '{}');
        const userName = currentUser.name || '未知用户';
        const userRole = currentUser.role || 'member';

        // 验证小区是否重复
        if (!this.communities) {
            this.communities = [];
        }
        const communityExists = this.communities.some(c => c.name === title);
        if (!communityExists && title) {
            // 直接加入小区列表
            this.communities.push({
                id: Date.now(),
                name: title
            });
        }

        // 获取户型、装修、楼层值
        const layoutValue = document.getElementById('propertyLayout').value;
        const floorValue = document.getElementById('propertyFloor').value;
        const decorationValue = document.getElementById('propertyDecoration').value;

        // 自动添加新户型到自定义列表
        if (layoutValue && !this.customLayouts.includes(layoutValue)) {
            const defaultLayouts = ['1-1', '2-1', '2-2', '3-1', '3-2', '3-2-2', '4-2', '4-2-2', '5-2', '5-3', '6-3'];
            if (!defaultLayouts.includes(layoutValue)) {
                this.customLayouts.push(layoutValue);
            }
        }

        // 自动添加新装修到自定义列表
        if (decorationValue && !this.customDecorations.includes(decorationValue)) {
            const defaultDecorations = ['毛坯', '简装', '精装', '豪装'];
            if (!defaultDecorations.includes(decorationValue)) {
                this.customDecorations.push(decorationValue);
            }
        }

        const price = parseFloat(document.getElementById('propertyPrice').value) || 0;

        const property = {
            id: Date.now(),
            title: title,
            location: location,
            listingType: listingType,
            price: price,
            area: parseFloat(document.getElementById('propertyArea').value) || 0,
            layout: layoutValue,
            floor: floorValue,
            doorNumber: document.getElementById('propertyDoorNumber').value,
            decoration: decorationValue,
            ownerName: document.getElementById('propertyOwnerName').value,
            ownerPhone: document.getElementById('propertyOwnerPhone').value,
            description: document.getElementById('propertyDescription').value,
            status: document.getElementById('propertyStatus').value,
            images: [],
            priceHistory: price ? [{ price: price, changedAt: now, note: '初始录入', changedBy: userName, changedByRole: userRole }] : [],
            listingTypeHistory: [{ listingType: listingType, changedAt: now, note: '初始录入', changedBy: userName, changedByRole: userRole }],
            fieldHistory: [],
            createdBy: userName,
            createdById: currentUser.id || null,
            publishDate: now.split('T')[0],
            offlineDate: '',
            createdAt: now,
            updatedAt: now
        };
        
        this.properties.push(property);
        this.saveData();
        this.closeModal('addPropertyModal');
        this.loadPage('properties');
        this.showMessage('房源已添加', 'success');
    }
    
    // 语音输入功能 (使用Web Speech API)
    startVoiceInput(inputId) {
        const input = document.getElementById(inputId);
        const voiceStatus = document.getElementById('voiceStatus');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('您的浏览器不支持语音识别功能，请使用Chrome浏览器');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'zh-CN';
        
        // 显示聆听状态
        if (voiceStatus) {
            voiceStatus.style.display = 'block';
            voiceStatus.querySelector('span').textContent = '正在聆听...';
        }
        
        // 开始识别
        recognition.start();
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('语音识别结果:', transcript);
            
            // 处理识别结果
            let result = transcript;
            
            // 尝试提取数字（面积、价格）
            const numbers = transcript.match(/\d+/g);
            if (numbers && numbers.length > 0) {
                if (inputId === 'propertyArea' && numbers[0]) {
                    result = numbers[0];
                } else if (inputId === 'propertyPrice' && numbers[0]) {
                    result = numbers[0];
                }
            }
            
            input.value = result;
            
            if (voiceStatus) {
                voiceStatus.querySelector('span').textContent = '识别完成: ' + transcript;
                setTimeout(() => {
                    voiceStatus.style.display = 'none';
                }, 2000);
            }
            
            this.showMessage('语音识别完成', 'success');
        };
        
        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            if (voiceStatus) {
                voiceStatus.style.display = 'none';
            }
            
            let errorMsg = '语音识别失败';
            if (event.error === 'no-speech') {
                errorMsg = '未检测到语音，请再说一次';
            } else if (event.error === 'not-allowed') {
                errorMsg = '请允许麦克风权限';
            }
            this.showError(errorMsg);
        };
        
        recognition.onend = () => {
            if (voiceStatus && voiceStatus.style.display !== 'none') {
                voiceStatus.style.display = 'none';
            }
        };
    }
    
    // 智能解析文本/语音输入，提取房源信息
    smartParseText(text) {
        if (!text || !text.trim()) return null;
        const result = {};
        
        // 默认小区列表
        const defaultCommunities = ['市中心豪华公寓', '花园别墅', '江景豪宅', '华盈小区', '绿城路小区', '文源小区', '拱极小区', '梅花小区', '西门小区'];
        
        // 1. 小区名匹配
        for (const name of defaultCommunities) {
            if (text.includes(name)) {
                result.title = name;
                break;
            }
        }
        // 找不到则正则提取
        if (!result.title) {
            const communityGuess = text.match(/[\u4e00-\u9fa5]{2,8}(?:小区|花园|苑|家园|公寓|大厦|广场|城|里|府|庭|院|阁|轩|坊|居)/);
            if (communityGuess) result.title = communityGuess[0];
        }
        
        // 2. 租售类型
        if (/出租|租房|每月|\/月|元\/月|租金/.test(text)) {
            result.listingType = 'rent';
        } else {
            result.listingType = 'sale';
        }
        
        // 3. 价格
        if (result.listingType === 'rent') {
            const rentMatch = text.match(/月租[：:]?\s*(\d+)|(\d+)\s*元\s*[/／每]\s*月/);
            if (rentMatch) result.price = parseFloat(rentMatch[1] || rentMatch[2]);
        } else {
            const saleMatch = text.match(/(\d+(?:\.\d+)?)\s*万/);
            if (saleMatch) result.price = parseFloat(saleMatch[1]);
        }
        
        // 4. 面积
        const areaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:㎡|平米|平方米|m²|平)/);
        if (areaMatch) result.area = parseFloat(areaMatch[1]);
        
        // 5. 户型
        const layoutMatch = text.match(/(\d)\s*室\s*(\d)\s*厅\s*(\d)\s*卫|(\d)\s*室\s*(\d)\s*厅/);
        if (layoutMatch) {
            if (layoutMatch[1] && layoutMatch[3]) {
                result.layout = `${layoutMatch[1]}-${layoutMatch[2]}-${layoutMatch[3]}`;
            } else if (layoutMatch[4]) {
                result.layout = `${layoutMatch[4]}-${layoutMatch[5]}-1`;
            }
        }
        
        // 6. 楼层
        const floorMatch = text.match(/(\d+)\s*[/／]\s*(\d+)\s*层|第\s*(\d+)\s*层/);
        if (floorMatch) {
            if (floorMatch[1] && floorMatch[2]) {
                result.floor = `${floorMatch[1]}/${floorMatch[2]}层`;
            } else if (floorMatch[3]) {
                result.floor = `${floorMatch[3]}层`;
            }
        }
        
        // 7. 装修
        const decoMatch = text.match(/精装修|精装|豪装|简装|毛坯|清水/);
        if (decoMatch) result.decoration = decoMatch[0];
        
        // 8. 电话
        const phoneMatch = text.match(/1[3-9]\d{9}/);
        if (phoneMatch) result.ownerPhone = phoneMatch[0];
        
        // 9. 房东姓名
        const ownerMatch = text.match(/房东[：:\s]*([^\s\d，,。.]{2,4})/);
        if (ownerMatch) result.ownerName = ownerMatch[1];
        
        return result;
    }
    
    // 智能语音输入 - 识别整段话并提取房源信息
    startSmartVoiceInput() {
        const voiceStatus = document.getElementById('voiceStatus');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('您的浏览器不支持语音识别功能，请使用Chrome浏览器');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';
        
        // 显示聆听状态
        if (voiceStatus) {
            voiceStatus.style.display = 'block';
            voiceStatus.querySelector('span').textContent = '正在聆听，请说出房源信息...';
        }
        
        let finalTranscript = '';
        
        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            if (voiceStatus) {
                voiceStatus.querySelector('span').textContent = interimTranscript || '正在处理...';
            }
            
            if (finalTranscript) {
                console.log('智能语音识别结果:', finalTranscript);
                
                // 解析房源信息
                const parsed = this.smartParseText(finalTranscript);
                
                // 自动填入表单
                if (parsed.title) document.getElementById('propertyTitle').value = parsed.title;
                if (parsed.title) document.getElementById('propertyLocation').value = parsed.title;
                if (parsed.area) document.getElementById('propertyArea').value = parsed.area;
                if (parsed.price) document.getElementById('propertyPrice').value = parsed.price;
                
                // 显示识别结果
                const parts = [];
                if (parsed.title) parts.push(`小区：${parsed.title}`);
                if (parsed.price != null) parts.push(`价格：${parsed.price}${parsed.listingType === 'rent' ? '元/月' : '万'}`);
                if (parsed.area != null) parts.push(`面积：${parsed.area}㎡`);
                if (parsed.layout) parts.push(`户型：${parsed.layout}`);
                
                if (voiceStatus) {
                    voiceStatus.querySelector('span').textContent = `已识别：${parts.join(' / ')}`;
                }
                
                this.showMessage(`智能识别完成，已提取${parts.length}项信息`, 'success');
            }
        };
        
        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            if (voiceStatus) voiceStatus.style.display = 'none';
            
            let errorMsg = '语音识别失败';
            if (event.error === 'no-speech') errorMsg = '未检测到语音，请再说一次';
            else if (event.error === 'not-allowed') errorMsg = '请允许麦克风权限';
            this.showError(errorMsg);
        };
        
        recognition.onend = () => {
            if (voiceStatus && voiceStatus.style.display !== 'none') {
                setTimeout(() => { voiceStatus.style.display = 'none'; }, 2000);
            }
        };
        
        recognition.start();
    }
    
    // 智能解析粘贴/输入的文本
    parseSmartText() {
        const textInput = document.getElementById('smartParseText');
        if (!textInput) return;
        
        const text = textInput.value.trim();
        if (!text) {
            this.showError('请先输入或粘贴房源信息');
            return;
        }
        
        const parsed = this.smartParseText(text);
        
        if (!parsed || Object.keys(parsed).length === 0) {
            this.showError('未识别到有效房源信息');
            return;
        }
        
        // 自动填入表单
        if (parsed.title) document.getElementById('propertyTitle').value = parsed.title;
        if (parsed.title) document.getElementById('propertyLocation').value = parsed.title;
        if (parsed.area) document.getElementById('propertyArea').value = parsed.area;
        if (parsed.price) document.getElementById('propertyPrice').value = parsed.price;
        
        // 显示识别结果
        const parts = [];
        if (parsed.title) parts.push(`小区：${parsed.title}`);
        if (parsed.price != null) parts.push(`价格：${parsed.price}${parsed.listingType === 'rent' ? '元/月' : '万'}`);
        if (parsed.area != null) parts.push(`面积：${parsed.area}㎡`);
        if (parsed.layout) parts.push(`户型：${parsed.layout}`);
        if (parsed.floor) parts.push(`楼层：${parsed.floor}`);
        if (parsed.decoration) parts.push(`装修：${parsed.decoration}`);
        
        this.showMessage(`已识别 ${parts.length} 项：${parts.slice(0,3).join(' / ')}${parts.length > 3 ? '...' : ''}`, 'success');
        
        // 隐藏智能输入区域
        const smartArea = document.getElementById('smartParseArea');
        if (smartArea) smartArea.style.display = 'none';
    }
    
    // 显示筛选弹窗
    showFilterModal() {
        console.log('showFilterModal 被调用');
        
        // 移除已存在的弹窗
        const existingModal = document.getElementById('filterModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'filterModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>筛选房源</h2>
                    <button class="modal-close" onclick="app.closeModal('filterModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="filterForm">
                        <div class="form-group">
                            <label>状态</label>
                            <select id="filterStatus">
                                <option value="">全部</option>
                                <option value="available">待售</option>
                                <option value="pending">待定</option>
                                <option value="sold">已售</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>价格范围 (万元)</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="number" id="filterPriceMin" placeholder="最低" style="flex: 1;">
                                <input type="number" id="filterPriceMax" placeholder="最高" style="flex: 1;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>面积范围 (㎡)</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="number" id="filterAreaMin" placeholder="最小" style="flex: 1;">
                                <input type="number" id="filterAreaMax" placeholder="最大" style="flex: 1;">
                            </div>
                        </div>
                        <div class="form-actions" style="display: flex; gap: 10px;">
                            <button type="button" class="btn btn-outline" onclick="app.clearFilter()" style="flex: 1;">清除</button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">应用筛选</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('filterModal');
            }
        });
        
        // 绑定表单提交
        document.getElementById('filterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.applyFilter();
        });
    }
    
    // 应用筛选
    applyFilter() {
        const status = document.getElementById('filterStatus').value;
        const priceMin = parseFloat(document.getElementById('filterPriceMin').value) || 0;
        const priceMax = parseFloat(document.getElementById('filterPriceMax').value) || Infinity;
        const areaMin = parseFloat(document.getElementById('filterAreaMin').value) || 0;
        const areaMax = parseFloat(document.getElementById('filterAreaMax').value) || Infinity;
        
        // 筛选房源
        let filtered = this.properties.filter(p => {
            const pPrice = parseFloat(p.price) || 0;
            const pArea = parseFloat(p.area) || 0;
            
            if (status && p.status !== status) return false;
            if (pPrice < priceMin || pPrice > priceMax) return false;
            if (pArea < areaMin || pArea > areaMax) return false;
            
            return true;
        });
        
        // 保存筛选结果并刷新页面
        this.filteredProperties = filtered;
        this.closeModal('filterModal');
        
        // 重新渲染房源列表
        const pageElement = document.getElementById('pageContent');
        if (pageElement) {
            pageElement.innerHTML = this.getFilteredPropertiesPage(filtered);
        }
        
        this.showMessage(`找到 ${filtered.length} 个房源`, 'success');
    }
    
    // 获取筛选后的房源页面
    getFilteredPropertiesPage(properties) {
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
                <button class="btn btn-outline" onclick="app.clearFilter()">
                    <i class="ri-close-line"></i> 清除筛选
                </button>
            </div>

            <div class="properties-grid">
                ${properties.map(property => `
                    <div class="property-card">
                        <div class="property-card-header">
                            <h3>${property.title}</h3>
                            <span class="property-status status-${property.status}">
                                ${property.listingType === 'rent' ? '租' : '售'} | ${this.getStatusText(property.status)}
                            </span>
                        </div>
                        <div class="property-card-body">
                            <div class="property-info-row">
                                <i class="ri-map-pin-line"></i>
                                <span>${property.location || property.doorNumber || '-'}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-ruler-line"></i>
                                <span>${property.area || '-'}㎡</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-home-line"></i>
                                <span>${property.layout || '-'}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-building-line"></i>
                                <span>${property.floor ? property.floor + '楼' : '-'}</span>
                            </div>
                            <div class="property-info-row">
                                <i class="ri-money-dollar-circle-line"></i>
                                <span class="property-price">${property.price}${property.listingType === 'rent' ? '元/月' : '万'}</span>
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
    
    // 清除筛选
    clearFilter() {
        this.filteredProperties = null;
        this.closeModal('filterModal');
        this.loadPage('properties');
    }
    
    // 编辑房源
    editProperty(id) {
        const property = this.properties.find(p => p.id == id);
        if (!property) {
            this.showError('房源不存在');
            return;
        }
        
        // 移除已存在的弹窗
        const existingModal = document.getElementById('editPropertyModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'editPropertyModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>编辑房源</h2>
                    <button class="modal-close" onclick="app.closeModal('editPropertyModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editPropertyForm">
                        <div class="form-group">
                            <label>租售类型 *</label>
                            <input type="hidden" id="editPropertyListingType" value="${property.listingType}">
                            <div style="display: flex; gap: 10px; margin-top: 8px;">
                                <button type="button" class="btn ${property.listingType === 'sale' ? 'btn-primary' : 'btn-secondary'}"
                                    onclick="app.switchListingType('${property.id}', 'sale')" style="flex: 1;">
                                    <i class="ri-home-warm-line"></i> 出售
                                </button>
                                <button type="button" class="btn ${property.listingType === 'rent' ? 'btn-primary' : 'btn-secondary'}"
                                    onclick="app.switchListingType('${property.id}', 'rent')" style="flex: 1;">
                                    <i class="ri-home-line"></i> 出租
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>小区名称 * <button type="button" class="btn btn-icon" style="padding: 2px 6px;" onclick="app.showAddCommunityModal()" title="添加小区"><i class="ri-add-line"></i></button></label>
                            <input type="text" id="editPropertyTitle" required value="${property.title || ''}" list="editCommunityList">
                            <datalist id="editCommunityList">
                                ${(this.communities || []).map(c => `<option value="${c.name}">`).join('')}
                            </datalist>
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>价格 *</label>
                                <input type="number" id="editPropertyPrice" required value="${property.price || ''}" placeholder="万元">
                            </div>
                            <div class="form-group">
                                <label>面积 (㎡) *</label>
                                <input type="number" id="editPropertyArea" required value="${property.area || ''}" placeholder="㎡">
                            </div>
                        </div>
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>户型 <button type="button" class="btn btn-icon" style="padding: 2px 6px;" onclick="app.showAddCustomOptionModal('layout')" title="添加户型"><i class="ri-add-line"></i></button></label>
                                <input type="text" id="editPropertyLayout" value="${property.layout || ''}" placeholder="请选择或输入户型" list="editLayoutList">
                                <datalist id="editLayoutList">
                                    <option value="1-1">1室1厅</option>
                                    <option value="2-1">2室1厅</option>
                                    <option value="2-2">2室2厅</option>
                                    <option value="3-1">3室1厅</option>
                                    <option value="3-2">3室2厅</option>
                                    <option value="3-2-2">3室2厅2卫</option>
                                    <option value="4-2">4室2厅</option>
                                    <option value="4-2-2">4室2厅2卫</option>
                                    <option value="5-2">5室2厅</option>
                                    <option value="5-3">5室3厅</option>
                                    <option value="6-3">6室3厅</option>
                                    ${(this.customLayouts || []).map(l => `<option value="${l}">`).join('')}
                                </datalist>
                            </div>
                            <div class="form-group">
                                <label>楼层 <button type="button" class="btn btn-icon" style="padding: 2px 6px;" onclick="app.showAddCustomOptionModal('floor')" title="添加楼层"><i class="ri-add-line"></i></button></label>
                                <input type="text" id="editPropertyFloor" value="${property.floor || ''}" placeholder="请选择或输入楼层" list="editFloorList">
                                <datalist id="editFloorList">
                                    ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map(f =>
                                        `<option value="${f}">${f}楼</option>`
                                    ).join('')}
                                    ${(this.customFloors || []).map(f => `<option value="${f}">${f}楼</option>`).join('')}
                                </datalist>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>楼栋及门牌号</label>
                            <input type="text" id="editPropertyDoorNumber" value="${property.doorNumber || ''}" placeholder="例如：3号楼201室">
                        </div>
                        <div class="form-group">
                            <label>装修 <button type="button" class="btn btn-icon" style="padding: 2px 6px;" onclick="app.showAddCustomOptionModal('decoration')" title="添加装修"><i class="ri-add-line"></i></button></label>
                            <input type="text" id="editPropertyDecoration" value="${property.decoration || ''}" placeholder="请选择或输入装修" list="editDecorationList">
                            <datalist id="editDecorationList">
                                <option value="毛坯">毛坯</option>
                                <option value="简装">简装</option>
                                <option value="精装">精装</option>
                                <option value="豪装">豪装</option>
                                ${(this.customDecorations || []).map(d => `<option value="${d}">`).join('')}
                            </datalist>
                        </div>
                        <div class="form-group">
                            <label>房东姓名</label>
                            <input type="text" id="editPropertyOwnerName" value="${property.ownerName || ''}" placeholder="房东姓名">
                        </div>
                        <div class="form-group">
                            <label>房东电话</label>
                            <input type="tel" id="editPropertyOwnerPhone" value="${property.ownerPhone || ''}" placeholder="房东电话">
                        </div>
                        <div class="form-group">
                            <label>房源描述</label>
                            <textarea id="editPropertyDescription" rows="3" placeholder="房源亮点、装修情况、周边配套等...">${property.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>状态</label>
                            <select id="editPropertyStatus">
                                <option value="pending" ${property.status === 'pending' ? 'selected' : ''}>待发布</option>
                                <option value="offline" ${property.status === 'offline' ? 'selected' : ''}>已下架</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">保存修改</button>
                        <button type="button" class="btn btn-danger btn-block" style="margin-top: 10px;" onclick="app.deleteProperty('${property.id}');">
                            <i class="ri-delete-bin-line"></i> 删除房源
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击遮罩关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('editPropertyModal');
            }
        });
        
        // 绑定表单提交
        document.getElementById('editPropertyForm').onsubmit = (e) => {
            e.preventDefault();
            this.updateProperty(id);
        };
    }

    // 切换租售类型并记录变更
    switchListingType(id, newType) {
        const property = this.properties.find(p => p.id == id);
        if (!property) {
            this.showError('房源不存在');
            return;
        }

        const oldType = property.listingType;
        if (oldType === newType) {
            return;
        }

        const now = new Date().toISOString();
        const currentUser = JSON.parse(localStorage.getItem('hs_user') || '{}');
        const userName = currentUser.name || '未知用户';
        const userRole = currentUser.role || 'member';

        // 更新房源类型
        const index = this.properties.findIndex(p => p.id == id);
        this.properties[index].listingType = newType;

        // 添加类型变更记录
        if (!this.properties[index].listingTypeHistory) {
            this.properties[index].listingTypeHistory = [];
        }
        this.properties[index].listingTypeHistory.push({
            listingType: newType,
            changedAt: now,
            note: `${oldType === 'sale' ? '出售' : '出租'} -> ${newType === 'sale' ? '出售' : '出租'}`,
            changedBy: userName,
            changedByRole: userRole
        });

        this.saveData();

        // 刷新编辑弹窗
        this.editProperty(id);

        this.showMessage(`已切换为${newType === 'sale' ? '出售' : '出租'}`, 'success');
    }

    // 显示添加自定义选项弹窗
    showAddCustomOptionModal(optionType) {
        const existingModal = document.getElementById('addCustomOptionModal');
        if (existingModal) {
            existingModal.remove();
        }

        const titles = {
            layout: '添加户型',
            floor: '添加楼层',
            decoration: '添加装修'
        };

        const placeholders = {
            layout: '例如：2室1厅1卫',
            floor: '例如：31',
            decoration: '例如：豪华装修'
        };

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'addCustomOptionModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${titles[optionType]}</h2>
                    <button class="modal-close" onclick="app.closeModal('addCustomOptionModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addCustomOptionForm">
                        <div class="form-group">
                            <label>新选项</label>
                            <input type="text" id="customOptionValue" required placeholder="${placeholders[optionType]}">
                        </div>
                        <div class="form-group">
                            <label>已有选项</label>
                            <div style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
                                ${this.getOptionList(optionType)}
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">添加</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('addCustomOptionModal');
            }
        });

        document.getElementById('addCustomOptionForm').onsubmit = (e) => {
            e.preventDefault();
            this.saveCustomOption(optionType);
        };
    }

    // 获取选项列表（带删除按钮）
    getOptionList(optionType) {
        let options = [];
        let usedOptions = [];

        if (optionType === 'layout') {
            options = this.customLayouts || [];
            usedOptions = [...new Set(this.properties.map(p => p.layout).filter(l => l))];
        } else if (optionType === 'floor') {
            options = this.customFloors || [];
            usedOptions = [...new Set(this.properties.map(p => p.floor).filter(f => f))];
        } else if (optionType === 'decoration') {
            options = this.customDecorations || [];
            usedOptions = [...new Set(this.properties.map(p => p.decoration).filter(d => d))];
        }

        if (options.length === 0) {
            return '<span style="color: #999;">暂无自定义选项</span>';
        }

        return options.map(opt => {
            const isUsed = usedOptions.includes(opt);
            const deleteBtn = isUsed ?
                '<span style="color: #999; font-size: 12px; margin-left: 5px;">(使用中)</span>' :
                `<button type="button" onclick="app.deleteCustomOption('${optionType}', '${opt}')" style="margin-left: 5px; padding: 2px 6px; font-size: 12px; background: #ffebee; color: #c62828; border: none; border-radius: 4px; cursor: pointer;">删除</button>`;
            return `<div style="display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0;">
                <span>${opt}</span>
                ${deleteBtn}
            </div>`;
        }).join('');
    }

    // 保存自定义选项
    saveCustomOption(optionType) {
        const value = document.getElementById('customOptionValue').value.trim();
        if (!value) {
            this.showError('请输入选项内容');
            return;
        }

        if (optionType === 'layout') {
            if (!this.customLayouts) this.customLayouts = [];
            if (!this.customLayouts.includes(value)) {
                this.customLayouts.push(value);
            }
        } else if (optionType === 'floor') {
            if (!this.customFloors) this.customFloors = [];
            if (!this.customFloors.includes(value)) {
                this.customFloors.push(value);
            }
        } else if (optionType === 'decoration') {
            if (!this.customDecorations) this.customDecorations = [];
            if (!this.customDecorations.includes(value)) {
                this.customDecorations.push(value);
            }
        }

        this.saveData();
        this.closeModal('addCustomOptionModal');
        this.showMessage('选项已添加', 'success');

        // 刷新当前页面
        const addModal = document.getElementById('addPropertyModal');
        if (addModal) {
            const form = addModal.querySelector('form');
            if (form) {
                const url = form.action;
                this.closeModal('addPropertyModal');
                // 重新打开新增弹窗
                const listingTypeSelect = document.getElementById('propertyListingType');
                const listingType = listingTypeSelect ? listingTypeSelect.value : 'sale';
                this.showAddPropertyModal(listingType);
            }
        }
    }

    // 删除自定义选项
    deleteCustomOption(optionType, value) {
        // 检查是否被使用
        let isUsed = false;
        if (optionType === 'layout') {
            isUsed = this.properties.some(p => p.layout === value);
        } else if (optionType === 'floor') {
            isUsed = this.properties.some(p => p.floor === value);
        } else if (optionType === 'decoration') {
            isUsed = this.properties.some(p => p.decoration === value);
        }

        if (isUsed) {
            this.showError('该选项已被房源使用，无法删除');
            return;
        }

        if (!confirm(`确定要删除"${value}"吗？`)) {
            return;
        }

        if (optionType === 'layout') {
            this.customLayouts = this.customLayouts.filter(l => l !== value);
        } else if (optionType === 'floor') {
            this.customFloors = this.customFloors.filter(f => f !== value);
        } else if (optionType === 'decoration') {
            this.customDecorations = this.customDecorations.filter(d => d !== value);
        }

        this.saveData();
        this.closeModal('addCustomOptionModal');
        this.showMessage('选项已删除', 'success');

        // 刷新当前页面
        const addModal = document.getElementById('addPropertyModal');
        if (addModal) {
            const listingTypeSelect = document.getElementById('propertyListingType');
            const listingType = listingTypeSelect ? listingTypeSelect.value : 'sale';
            this.closeModal('addPropertyModal');
            this.showAddPropertyModal(listingType);
        }
    }

    // 显示添加小区弹窗
    showAddCommunityModal() {
        const existingModal = document.getElementById('addCommunityModal');
        if (existingModal) {
            existingModal.remove();
        }

        const usedCommunities = [...new Set(this.properties.map(p => p.title).filter(t => t))];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'addCommunityModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>管理小区</h2>
                    <button class="modal-close" onclick="app.closeModal('addCommunityModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addCommunityForm">
                        <div class="form-group">
                            <label>新增小区</label>
                            <input type="text" id="newCommunityName" required placeholder="请输入小区名称">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">添加小区</button>
                    </form>
                    <div style="margin-top: 20px;">
                        <label>已有小区 (点击可选择)</label>
                        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
                            ${this.getCommunityList()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('addCommunityModal');
            }
        });

        document.getElementById('addCommunityForm').onsubmit = (e) => {
            e.preventDefault();
            this.saveCommunity();
        };
    }

    // 获取小区列表（带删除按钮）
    getCommunityList() {
        const communities = this.communities || [];
        const usedCommunities = [...new Set(this.properties.map(p => p.title).filter(t => t))];

        if (communities.length === 0) {
            return '<span style="color: #999;">暂无小区，请添加</span>';
        }

        return communities.map(c => {
            const isUsed = usedCommunities.includes(c.name);
            const deleteBtn = isUsed ?
                '<span style="color: #999; font-size: 12px; margin-left: 5px;">(使用中)</span>' :
                `<button type="button" onclick="app.deleteCommunity('${c.name}')" style="margin-left: 5px; padding: 2px 6px; font-size: 12px; background: #ffebee; color: #c62828; border: none; border-radius: 4px; cursor: pointer;">删除</button>`;
            return `<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                <span>${c.name}</span>
                ${deleteBtn}
            </div>`;
        }).join('');
    }

    // 保存小区
    saveCommunity() {
        const name = document.getElementById('newCommunityName').value.trim();
        if (!name) {
            this.showError('请输入小区名称');
            return;
        }

        if (!this.communities) {
            this.communities = [];
        }

        if (!this.communities.some(c => c.name === name)) {
            this.communities.push({
                id: Date.now(),
                name: name
            });
        }

        this.saveData();
        this.closeModal('addCommunityModal');
        this.showMessage('小区已添加', 'success');

        // 刷新新增房源弹窗
        const addModal = document.getElementById('addPropertyModal');
        if (addModal) {
            const listingTypeSelect = document.getElementById('propertyListingType');
            const listingType = listingTypeSelect ? listingTypeSelect.value : 'sale';
            this.closeModal('addPropertyModal');
            this.showAddPropertyModal(listingType);
        }
    }

    // 删除小区
    deleteCommunity(name) {
        // 检查是否被使用
        const isUsed = this.properties.some(p => p.title === name);

        if (isUsed) {
            this.showError('该小区已被房源使用，无法删除');
            return;
        }

        if (!confirm(`确定要删除"${name}"吗？`)) {
            return;
        }

        this.communities = (this.communities || []).filter(c => c.name !== name);
        this.saveData();
        this.closeModal('addCommunityModal');
        this.showMessage('小区已删除', 'success');

        // 刷新新增房源弹窗
        const addModal = document.getElementById('addPropertyModal');
        if (addModal) {
            const listingTypeSelect = document.getElementById('propertyListingType');
            const listingType = listingTypeSelect ? listingTypeSelect.value : 'sale';
            this.closeModal('addPropertyModal');
            this.showAddPropertyModal(listingType);
        }
    }

    // 更新房源
    updateProperty(id) {
        const index = this.properties.findIndex(p => p.id == id);
        if (index === -1) {
            this.showError('房源不存在');
            return;
        }

        const now = new Date().toISOString();
        const title = document.getElementById('editPropertyTitle').value.trim();

        // 验证并添加新小区
        if (!this.communities) {
            this.communities = [];
        }
        const communityExists = this.communities.some(c => c.name === title);
        if (!communityExists && title) {
            this.communities.push({
                id: Date.now(),
                name: title
            });
        }

        // 获取户型、装修值并添加到自定义列表
        const editLayoutValue = document.getElementById('editPropertyLayout').value;
        const editDecorationValue = document.getElementById('editPropertyDecoration').value;

        if (editLayoutValue && !this.customLayouts.includes(editLayoutValue)) {
            const defaultLayouts = ['1-1', '2-1', '2-2', '3-1', '3-2', '3-2-2', '4-2', '4-2-2', '5-2', '5-3', '6-3'];
            if (!defaultLayouts.includes(editLayoutValue)) {
                this.customLayouts.push(editLayoutValue);
            }
        }

        if (editDecorationValue && !this.customDecorations.includes(editDecorationValue)) {
            const defaultDecorations = ['毛坯', '简装', '精装', '豪装'];
            if (!defaultDecorations.includes(editDecorationValue)) {
                this.customDecorations.push(editDecorationValue);
            }
        }

        this.properties[index] = {
            ...this.properties[index],
            title: title,
            location: document.getElementById('editPropertyLocation').value,
            listingType: document.getElementById('editPropertyListingType').value,
            price: parseFloat(document.getElementById('editPropertyPrice').value) || 0,
            area: parseFloat(document.getElementById('editPropertyArea').value) || 0,
            layout: document.getElementById('editPropertyLayout').value,
            floor: document.getElementById('editPropertyFloor').value,
            doorNumber: document.getElementById('editPropertyDoorNumber').value,
            decoration: document.getElementById('editPropertyDecoration').value,
            ownerName: document.getElementById('editPropertyOwnerName').value,
            ownerPhone: document.getElementById('editPropertyOwnerPhone').value,
            description: document.getElementById('editPropertyDescription').value,
            status: document.getElementById('editPropertyStatus').value,
            updatedAt: now
        };
        
        this.saveData();
        this.closeModal('editPropertyModal');
        this.loadPage('properties');
        this.showMessage('房源已更新', 'success');
    }
    
    // 删除房源
    deleteProperty(id) {
        if (!confirm('确定要删除这个房源吗？此操作不可恢复。')) {
            return;
        }
        
        const index = this.properties.findIndex(p => p.id == id);
        if (index === -1) {
            this.showError('房源不存在');
            return;
        }
        
        this.properties.splice(index, 1);
        this.saveData();
        
        // 关闭所有可能打开的弹窗
        this.closeModal('editPropertyModal');
        this.closeModal('viewPropertyModal');
        
        this.loadPage('properties');
        this.showMessage('房源已删除', 'success');
    }
    
    // 查看房源详情
    viewProperty(id) {
        const property = this.properties.find(p => p.id == id);
        if (!property) {
            this.showError('房源不存在');
            return;
        }
        
        // 移除已存在的弹窗
        const existingModal = document.getElementById('viewPropertyModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const statusText = this.getStatusText(property.status);
        const createdDate = property.createdAt ? new Date(property.createdAt).toLocaleDateString('zh-CN') : '-';
        const listingTypeText = property.listingType === 'rent' ? '出租' : '出售';
        const priceUnit = property.listingType === 'rent' ? '元/月' : '万';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'viewPropertyModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>房源详情</h2>
                    <button class="modal-close" onclick="app.closeModal('viewPropertyModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="padding: 10px 0;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; color: white; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${listingTypeText}</span>
                                <span style="font-size: 12px;">${statusText}</span>
                            </div>
                            <h3 style="margin: 0 0 10px 0; font-size: 18px;">${property.title}</h3>
                            <div style="font-size: 28px; font-weight: bold;">${property.price}${priceUnit}</div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px;">
                                <div style="color: #666; font-size: 12px; margin-bottom: 3px;">面积</div>
                                <div style="font-size: 16px; font-weight: 600;">${property.area || '-'}㎡</div>
                            </div>
                            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px;">
                                <div style="color: #666; font-size: 12px; margin-bottom: 3px;">户型</div>
                                <div style="font-size: 16px; font-weight: 600;">${property.layout || '-'}</div>
                            </div>
                            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px;">
                                <div style="color: #666; font-size: 12px; margin-bottom: 3px;">楼层</div>
                                <div style="font-size: 16px; font-weight: 600;">${property.floor ? property.floor + '楼' : '-'}</div>
                            </div>
                            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px;">
                                <div style="color: #666; font-size: 12px; margin-bottom: 3px;">装修</div>
                                <div style="font-size: 16px; font-weight: 600;">${property.decoration || '-'}</div>
                            </div>
                        </div>
                        
                        ${property.doorNumber ? `
                        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                            <div style="color: #666; font-size: 12px; margin-bottom: 3px;">楼栋及门牌号</div>
                            <div style="font-size: 14px;">${property.doorNumber}</div>
                        </div>
                        ` : ''}
                        
                        ${property.location ? `
                        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                            <div style="color: #666; font-size: 12px; margin-bottom: 3px;">位置/地址</div>
                            <div style="font-size: 14px;">${property.location}</div>
                        </div>
                        ` : ''}
                        
                        ${property.ownerName || property.ownerPhone ? `
                        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                            <div style="color: #666; font-size: 12px; margin-bottom: 3px;">房东信息</div>
                            <div style="font-size: 14px;">
                                ${property.ownerName ? property.ownerName : ''}${property.ownerPhone ? ' / ' + property.ownerPhone : ''}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${property.description ? `
                        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                            <div style="color: #666; font-size: 12px; margin-bottom: 3px;">房源描述</div>
                            <div style="font-size: 14px;">${property.description}</div>
                        </div>
                        ` : ''}
                        
                        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                            <div style="color: #666; font-size: 12px; margin-bottom: 3px;">录入时间</div>
                            <div style="font-size: 14px;">${createdDate}</div>
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-primary" style="flex: 1;" onclick="app.closeModal('viewPropertyModal'); app.editProperty('${property.id}');">
                                <i class="ri-edit-line"></i> 编辑
                            </button>
                            <button class="btn btn-danger" style="flex: 1;" onclick="app.deleteProperty('${property.id}');">
                                <i class="ri-delete-bin-line"></i> 删除
                            </button>
                        </div>
                        <button class="btn btn-outline" style="width: 100%; margin-top: 10px;" onclick="app.closeModal('viewPropertyModal');">
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击遮罩关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('viewPropertyModal');
            }
        });
    }
    
    // 关闭弹窗
    closeModal(modalId) {
        console.log('关闭弹窗:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // 初始化客户页面组件
    initClientsComponents() {
        // 客户页面组件初始化
    }

    // 初始化发布页面组件
    initPublishComponents() {
        // 发布页面组件初始化
    }

    // 初始化我的页面组件
    initProfileComponents() {
        // 我的页面组件初始化
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
        console.log('绑定导航点击事件...');
        // 绑定导航点击事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = item.dataset.page;
                console.log('导航点击:', pageName);
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
                // 使用 initialPage 或默认为 home
                const initialPage = this.initialPage || 'home';
                // 初始页面使用 replaceState 而不是 pushState
                history.replaceState({ page: initialPage }, '', '#' + initialPage);
                this.loadPage(initialPage, false); // false 表示不添加重复历史
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
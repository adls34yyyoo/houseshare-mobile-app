// HouseShare手机APP - UI组件库
class UIComponents {
    constructor() {
        this.components = {};
    }

    // 初始化所有UI组件
    init() {
        console.log('UI组件初始化...');
        this.initToast();
        this.initLoading();
        this.initModal();
        this.initTabs();
        this.initCards();
        this.initForms();
        this.initButtons();
        this.initIcons();
    }

    // 初始化Toast消息组件
    initToast() {
        console.log('初始化Toast组件...');
    }

    // 初始化加载动画
    initLoading() {
        console.log('初始化加载动画...');
    }

    // 初始化模态框
    initModal() {
        console.log('初始化模态框...');
    }

    // 初始化标签页
    initTabs() {
        console.log('初始化标签页...');
    }

    // 初始化卡片组件
    initCards() {
        console.log('初始化卡片组件...');
    }

    // 初始化表单组件
    initForms() {
        console.log('初始化表单组件...');
    }

    // 初始化按钮组件
    initButtons() {
        console.log('初始化按钮组件...');
    }

    // 初始化图标组件
    initIcons() {
        console.log('初始化图标组件...');
    }

    // 显示Toast消息
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon ri-${this.getIconForType(type)}"></i>
                <span class="toast-message">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => toast.classList.add('show'), 10);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // 根据消息类型获取图标
    getIconForType(type) {
        const icons = {
            success: 'check-line',
            error: 'close-line',
            warning: 'alert-line',
            info: 'information-line'
        };
        return icons[type] || 'information-line';
    }

    // 显示加载动画
    showLoading(message = '加载中...') {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <div class="loading-message">${message}</div>
            </div>
        `;

        document.body.appendChild(loading);
        return loading;
    }

    // 隐藏加载动画
    hideLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.parentNode.removeChild(loadingElement);
        }
    }

    // 创建确认对话框
    showConfirm(options) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${options.title || '确认操作'}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${options.message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-btn">${options.cancelText || '取消'}</button>
                        <button class="btn btn-primary confirm-btn">${options.confirmText || '确定'}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // 绑定事件
            const closeBtn = modal.querySelector('.modal-close');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const confirmBtn = modal.querySelector('.confirm-btn');
            const overlay = modal.querySelector('.modal-overlay');

            const closeModal = (result) => {
                modal.classList.add('closing');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
                resolve(result);
            };

            closeBtn.addEventListener('click', () => closeModal(false));
            cancelBtn.addEventListener('click', () => closeModal(false));
            confirmBtn.addEventListener('click', () => closeModal(true));
            overlay.addEventListener('click', () => closeModal(false));

            // 显示动画
            setTimeout(() => modal.classList.add('show'), 10);
        });
    }

    // 创建卡片组件
    createCard(options) {
        const card = document.createElement('div');
        card.className = 'card';
        
        if (options.className) {
            card.classList.add(options.className);
        }

        let content = '';
        
        // 卡片头部
        if (options.header) {
            content += `
                <div class="card-header">
                    ${options.header.icon ? `<i class="ri-${options.header.icon}"></i>` : ''}
                    <h3 class="card-title">${options.header.title}</h3>
                    ${options.header.subtitle ? `<p class="card-subtitle">${options.header.subtitle}</p>` : ''}
                </div>
            `;
        }

        // 卡片内容
        if (options.content) {
            content += `<div class="card-content">${options.content}</div>`;
        }

        // 卡片底部
        if (options.footer) {
            content += `<div class="card-footer">${options.footer}</div>`;
        }

        card.innerHTML = content;
        return card;
    }

    // 创建表单字段
    createFormField(options) {
        const field = document.createElement('div');
        field.className = 'form-field';
        
        if (options.className) {
            field.classList.add(options.className);
        }

        let labelHtml = '';
        if (options.label) {
            labelHtml = `<label for="${options.id}" class="form-label">${options.label}</label>`;
        }

        let inputHtml = '';
        if (options.type === 'select') {
            inputHtml = `
                <select id="${options.id}" class="form-select" ${options.required ? 'required' : ''}>
                    ${options.options ? options.options.map(opt => 
                        `<option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.label}</option>`
                    ).join('') : ''}
                </select>
            `;
        } else if (options.type === 'textarea') {
            inputHtml = `
                <textarea id="${options.id}" class="form-textarea" 
                    placeholder="${options.placeholder || ''}" 
                    ${options.required ? 'required' : ''}
                    rows="${options.rows || 3}">${options.value || ''}</textarea>
            `;
        } else {
            inputHtml = `
                <input type="${options.type || 'text'}" 
                    id="${options.id}" 
                    class="form-input" 
                    placeholder="${options.placeholder || ''}" 
                    value="${options.value || ''}" 
                    ${options.required ? 'required' : ''}>
            `;
        }

        field.innerHTML = `
            ${labelHtml}
            <div class="form-input-wrapper">
                ${inputHtml}
                ${options.icon ? `<i class="form-icon ri-${options.icon}"></i>` : ''}
            </div>
            ${options.helpText ? `<div class="form-help">${options.helpText}</div>` : ''}
        `;

        return field;
    }

    // 创建按钮
    createButton(options) {
        const button = document.createElement('button');
        button.type = options.type || 'button';
        button.className = `btn ${options.variant ? 'btn-' + options.variant : 'btn-primary'}`;
        
        if (options.className) {
            button.classList.add(options.className);
        }

        if (options.size) {
            button.classList.add(`btn-${options.size}`);
        }

        if (options.disabled) {
            button.disabled = true;
        }

        let content = '';
        if (options.icon) {
            content += `<i class="ri-${options.icon}"></i>`;
        }
        if (options.text) {
            content += `<span>${options.text}</span>`;
        }

        button.innerHTML = content;

        if (options.onClick) {
            button.addEventListener('click', options.onClick);
        }

        return button;
    }

    // 创建图标
    createIcon(name, size = 'md', className = '') {
        const icon = document.createElement('i');
        icon.className = `ri-${name} icon-${size} ${className}`;
        return icon;
    }

    // 创建标签页
    createTabs(options) {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        
        // 标签头
        const tabsHeader = document.createElement('div');
        tabsHeader.className = 'tabs-header';
        
        options.tabs.forEach((tab, index) => {
            const tabButton = document.createElement('button');
            tabButton.className = `tab-button ${index === 0 ? 'active' : ''}`;
            tabButton.dataset.tab = tab.id;
            
            if (tab.icon) {
                tabButton.innerHTML = `<i class="ri-${tab.icon}"></i> ${tab.label}`;
            } else {
                tabButton.textContent = tab.label;
            }
            
            tabButton.addEventListener('click', () => {
                // 切换激活状态
                tabsHeader.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                tabButton.classList.add('active');
                
                // 切换内容
                tabsContent.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const contentElement = tabsContent.querySelector(`[data-tab="${tab.id}"]`);
                if (contentElement) {
                    contentElement.classList.add('active');
                }
                
                // 触发回调
                if (options.onTabChange) {
                    options.onTabChange(tab.id);
                }
            });
            
            tabsHeader.appendChild(tabButton);
        });
        
        // 标签内容
        const tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        
        options.tabs.forEach((tab, index) => {
            const content = document.createElement('div');
            content.className = `tab-content ${index === 0 ? 'active' : ''}`;
            content.dataset.tab = tab.id;
            content.innerHTML = tab.content || '';
            tabsContent.appendChild(content);
        });
        
        tabsContainer.appendChild(tabsHeader);
        tabsContainer.appendChild(tabsContent);
        
        return tabsContainer;
    }
}

// 导出UI组件库
window.UI = new UIComponents();
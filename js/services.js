// HouseShare APP 服务模块
class HouseShareServices {
    constructor() {
        this.apiBaseUrl = '/api';
        this.isOnline = navigator.onLine;
        this.init();
    }

    // 初始化服务
    init() {
        // 监听网络状态
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // 获取房源列表
    async getProperties(filter = {}) {
        try {
            // 如果离线，从本地存储获取
            if (!this.isOnline) {
                const properties = localStorage.getItem('houseshare_properties');
                return properties ? JSON.parse(properties) : [];
            }
            
            // 模拟API请求
            const response = await this.mockApiRequest('/properties', filter);
            return response.data;
            
        } catch (error) {
            console.error('获取房源失败:', error);
            // 离线时返回本地数据
            const properties = localStorage.getItem('houseshare_properties');
            return properties ? JSON.parse(properties) : [];
        }
    }

    // 添加房源
    async addProperty(propertyData) {
        try {
            // 生成ID
            propertyData.id = Date.now().toString();
            propertyData.createdAt = new Date().toISOString();
            
            // 如果离线，保存到本地
            if (!this.isOnline) {
                const properties = JSON.parse(localStorage.getItem('houseshare_properties') || '[]');
                properties.push(propertyData);
                localStorage.setItem('houseshare_properties', JSON.stringify(properties));
                
                // 添加到待同步队列
                this.addToSyncQueue('addProperty', propertyData);
                
                return { success: true, data: propertyData };
            }
            
            // 模拟API请求
            const response = await this.mockApiRequest('/properties/add', propertyData);
            return response;
            
        } catch (error) {
            console.error('添加房源失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新房源
    async updateProperty(id, propertyData) {
        try {
            // 如果离线，更新本地数据
            if (!this.isOnline) {
                const properties = JSON.parse(localStorage.getItem('houseshare_properties') || '[]');
                const index = properties.findIndex(p => p.id === id);
                
                if (index !== -1) {
                    properties[index] = { ...properties[index], ...propertyData };
                    localStorage.setItem('houseshare_properties', JSON.stringify(properties));
                    
                    // 添加到待同步队列
                    this.addToSyncQueue('updateProperty', { id, data: propertyData });
                    
                    return { success: true };
                }
                
                return { success: false, error: '房源不存在' };
            }
            
            // 模拟API请求
            const response = await this.mockApiRequest('/properties/update', { id, data: propertyData });
            return response;
            
        } catch (error) {
            console.error('更新房源失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 删除房源
    async deleteProperty(id) {
        try {
            // 如果离线，删除本地数据
            if (!this.isOnline) {
                const properties = JSON.parse(localStorage.getItem('houseshare_properties') || '[]');
                const filteredProperties = properties.filter(p => p.id !== id);
                localStorage.setItem('houseshare_properties', JSON.stringify(filteredProperties));
                
                // 添加到待同步队列
                this.addToSyncQueue('deleteProperty', { id });
                
                return { success: true };
            }
            
            // 模拟API请求
            const response = await this.mockApiRequest('/properties/delete', { id });
            return response;
            
        } catch (error) {
            console.error('删除房源失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取客户列表
    async getClients(filter = {}) {
        try {
            // 如果离线，从本地存储获取
            if (!this.isOnline) {
                const clients = localStorage.getItem('houseshare_clients');
                return clients ? JSON.parse(clients) : [];
            }
            
            // 模拟API请求
            const response = await this.mockApiRequest('/clients', filter);
            return response.data;
            
        } catch (error) {
            console.error('获取客户失败:', error);
            // 离线时返回本地数据
            const clients = localStorage.getItem('houseshare_clients');
            return clients ? JSON.parse(clients) : [];
        }
    }

    // 添加客户
    async addClient(clientData) {
        try {
            // 生成ID
            clientData.id = Date.now().toString();
            clientData.createdAt = new Date().toISOString();
            
            // 如果离线，保存到本地
            if (!this.isOnline) {
                const clients = JSON.parse(localStorage.getItem('houseshare_clients') || '[]');
                clients.push(clientData);
                localStorage.setItem('houseshare_clients', JSON.stringify(clients));
                
                // 添加到待同步队列
                this.addToSyncQueue('addClient', clientData);
                
                return { success: true, data: clientData };
            }
            
            // 模拟API请求
            const response = await this.mockApiRequest('/clients/add', clientData);
            return response;
            
        } catch (error) {
            console.error('添加客户失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新客户
    async updateClient(id, clientData) {
        try {
            // 如果离线，更新本地数据
            if (!this.isOnline) {
                const clients = JSON.parse(localStorage.getItem('houseshare_clients') || '[]');
                const index = clients.findIndex(c => c.id === id);
                
                if (index !== -1) {
                    clients[index] = { ...clients[index], ...clientData };
                    localStorage.setItem('houseshare_clients', JSON.stringify(clients));
                    
                    // 添加到待同步队列
                    this.addToSyncQueue('updateClient', { id, data: clientData });
                    
                    return { success: true };
                }
                
                return { success: false, error: '客户不存在' };
            }
            
            // 模拟API请求
            const response = await this.mockApiRequest('/clients/update', { id, data: clientData });
            return response;
            
        } catch (error) {
            console.error('更新客户失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 删除客户
    async deleteClient(id) {
        try {
            // 如果离线，删除本地数据
            if (!this.isOnline) {
                const clients = JSON.parse(localStorage.getItem('houseshare_clients') || '[]');
                const filteredClients = clients.filter(c => c.id !== id);
                localStorage.setItem('houseshare_clients', JSON.stringify(filteredClients));
                
                // 添加到待同步队列
                this.addToSyncQueue('deleteClient', { id });
                
                return { success: true };
            }
            
            // 模拟API请求
            const response = await this.mockApiRequest('/clients/delete', { id });
            return response;
            
        } catch (error) {
            console.error('删除客户失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 生成朋友圈文案
    async generateContent(propertyId, template = 'default') {
        try {
            // 获取房源信息
            const properties = JSON.parse(localStorage.getItem('houseshare_properties') || '[]');
            const property = properties.find(p => p.id === propertyId);
            
            if (!property) {
                return { success: false, error: '房源不存在' };
            }
            
            // 根据模板生成文案
            let content = '';
            
            switch (template) {
                case 'default':
                    content = `🏠 精品房源推荐！\n\n`;
                    content += `📍 ${property.location}\n`;
                    content += `📐 ${property.area}㎡\n`;
                    content += `💰 ${property.price}\n\n`;
                    content += `${property.description}\n\n`;
                    content += `稀缺房源，先到先得！\n`;
                    content += `#房源推荐 #豪宅 #投资首选`;
                    break;
                    
                case 'luxury':
                    content = `🌟 豪华房源，不容错过！\n\n`;
                    content += `🏰 ${property.title}\n`;
                    content += `📍 ${property.location}\n`;
                    content += `📐 ${property.area}㎡\n`;
                    content += `💰 ${property.price}\n\n`;
                    content += `${property.description}\n\n`;
                    content += `高端品质，奢华享受！\n`;
                    content += `#豪华房源 #高端住宅 #品质生活`;
                    break;
                    
                case 'investment':
                    content = `📈 投资首选，回报率高！\n\n`;
                    content += `🏠 ${property.title}\n`;
                    content += `📍 ${property.location}\n`;
                    content += `📐 ${property.area}㎡\n`;
                    content += `💰 ${property.price}\n\n`;
                    content += `${property.description}\n\n`;
                    content += `投资潜力巨大，回报稳定！\n`;
                    content += `#投资房源 #回报率高 #潜力巨大`;
                    break;
                    
                default:
                    content = `🏠 ${property.title}\n\n`;
                    content += `📍 ${property.location}\n`;
                    content += `📐 ${property.area}㎡\n`;
                    content += `💰 ${property.price}\n\n`;
                    content += `${property.description}`;
            }
            
            return { success: true, content };
            
        } catch (error) {
            console.error('生成文案失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 保存文案模板
    async saveTemplate(templateName, content) {
        try {
            const templates = JSON.parse(localStorage.getItem('houseshare_templates') || '[]');
            templates.push({
                name: templateName,
                content: content,
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem('houseshare_templates', JSON.stringify(templates));
            
            return { success: true };
            
        } catch (error) {
            console.error('保存模板失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取文案模板
    async getTemplates() {
        try {
            const templates = localStorage.getItem('houseshare_templates');
            return templates ? JSON.parse(templates) : [];
            
        } catch (error) {
            console.error('获取模板失败:', error);
            return [];
        }
    }

    // 上传图片
    async uploadImage(file) {
        try {
            // 模拟上传过程
            const reader = new FileReader();
            
            return new Promise((resolve, reject) => {
                reader.onload = () => {
                    const imageData = {
                        id: Date.now().toString(),
                        url: reader.result,
                        name: file.name,
                        size: file.size,
                        uploadedAt: new Date().toISOString()
                    };
                    
                    resolve({ success: true, data: imageData });
                };
                
                reader.onerror = () => {
                    reject({ success: false, error: '图片读取失败' });
                };
                
                reader.readAsDataURL(file);
            });
            
        } catch (error) {
            console.error('上传图片失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 模拟API请求
    async mockApiRequest(endpoint, data = null) {
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 根据端点返回模拟数据
        switch (endpoint) {
            case '/properties':
                return {
                    success: true,
                    data: JSON.parse(localStorage.getItem('houseshare_properties') || '[]')
                };
                
            case '/properties/add':
                const properties = JSON.parse(localStorage.getItem('houseshare_properties') || '[]');
                data.id = Date.now().toString();
                data.createdAt = new Date().toISOString();
                properties.push(data);
                localStorage.setItem('houseshare_properties', JSON.stringify(properties));
                return { success: true, data };
                
            case '/properties/update':
                const propertiesUpdate = JSON.parse(localStorage.getItem('houseshare_properties') || '[]');
                const index = propertiesUpdate.findIndex(p => p.id === data.id);
                if (index !== -1) {
                    propertiesUpdate[index] = { ...propertiesUpdate[index], ...data.data };
                    localStorage.setItem('houseshare_properties', JSON.stringify(propertiesUpdate));
                    return { success: true };
                }
                return { success: false, error: '房源不存在' };
                
            case '/properties/delete':
                const propertiesDelete = JSON.parse(localStorage.getItem('houseshare_properties') || '[]');
                const filtered = propertiesDelete.filter(p => p.id !== data.id);
                localStorage.setItem('houseshare_properties', JSON.stringify(filtered));
                return { success: true };
                
            case '/clients':
                return {
                    success: true,
                    data: JSON.parse(localStorage.getItem('houseshare_clients') || '[]')
                };
                
            case '/clients/add':
                const clients = JSON.parse(localStorage.getItem('houseshare_clients') || '[]');
                data.id = Date.now().toString();
                data.createdAt = new Date().toISOString();
                clients.push(data);
                localStorage.setItem('houseshare_clients', JSON.stringify(clients));
                return { success: true, data };
                
            case '/clients/update':
                const clientsUpdate = JSON.parse(localStorage.getItem('houseshare_clients') || '[]');
                const clientIndex = clientsUpdate.findIndex(c => c.id === data.id);
                if (clientIndex !== -1) {
                    clientsUpdate[clientIndex] = { ...clientsUpdate[clientIndex], ...data.data };
                    localStorage.setItem('houseshare_clients', JSON.stringify(clientsUpdate));
                    return { success: true };
                }
                return { success: false, error: '客户不存在' };
                
            case '/clients/delete':
                const clientsDelete = JSON.parse(localStorage.getItem('houseshare_clients') || '[]');
                const filteredClients = clientsDelete.filter(c => c.id !== data.id);
                localStorage.setItem('houseshare_clients', JSON.stringify(filteredClients));
                return { success: true };
                
            default:
                return { success: true, data: [] };
        }
    }

    // 添加到待同步队列
    addToSyncQueue(action, data) {
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        queue.push({
            action,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('sync_queue', JSON.stringify(queue));
        
        // 触发后台同步
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SYNC_DATA'
            });
        }
    }

    // 同步待处理数据
    async syncPendingData() {
        if (!this.isOnline) return;
        
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        
        if (queue.length === 0) return;
        
        try {
            // 模拟同步到服务器
            await this.mockApiRequest('/sync', { queue });
            
            // 清除队列
            localStorage.removeItem('sync_queue');
            
            console.log('数据同步完成');
            
        } catch (error) {
            console.error('数据同步失败:', error);
        }
    }

    // 导出数据
    exportData(format = 'json') {
        const data = {
            properties: JSON.parse(localStorage.getItem('houseshare_properties') || '[]'),
            clients: JSON.parse(localStorage.getItem('houseshare_clients') || '[]'),
            templates: JSON.parse(localStorage.getItem('houseshare_templates') || '[]'),
            exportedAt: new Date().toISOString()
        };
        
        let content;
        let filename;
        
        switch (format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                filename = `houseshare-data-${new Date().getTime()}.json`;
                break;
                
            case 'csv':
                // 转换为CSV格式
                content = this.convertToCSV(data);
                filename = `houseshare-data-${new Date().getTime()}.csv`;
                break;
                
            case 'excel':
                // 转换为Excel格式
                content = this.convertToExcel(data);
                filename = `houseshare-data-${new Date().getTime()}.xlsx`;
                break;
                
            default:
                content = JSON.stringify(data, null, 2);
                filename = `houseshare-data-${new Date().getTime()}.json`;
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        return { success: true };
    }

    // 转换为CSV
    convertToCSV(data) {
        let csv = '';
        
        // 房源数据
        csv += '房源数据\n';
        csv += 'ID,标题,位置,面积,价格,状态,描述\n';
        data.properties.forEach(property => {
            csv += `${property.id},${property.title},${property.location},${property.area},${property.price},${property.status},${property.description}\n`;
        });
        
        csv += '\n\n客户数据\n';
        csv += 'ID,姓名,电话,邮箱,标签,备注\n';
        data.clients.forEach(client => {
            csv += `${client.id},${client.name},${client.phone},${client.email},${client.tags.join(';')},${client.notes}\n`;
        });
        
        return csv;
    }

    // 转换为Excel（简化版）
    convertToExcel(data) {
        // 这里使用简单的CSV格式，实际可以使用xlsx库
        return this.convertToCSV(data);
    }

    // 备份数据
    async backupData() {
        try {
            const data = {
                properties: JSON.parse(localStorage.getItem('houseshare_properties') || '[]'),
                clients: JSON.parse(localStorage.getItem('houseshare_clients') || '[]'),
                templates: JSON.parse(localStorage.getItem('houseshare_templates') || '[]'),
                backupAt: new Date().toISOString()
            };
            
            // 保存备份到本地
            localStorage.setItem('houseshare_backup', JSON.stringify(data));
            
            return { success: true };
            
        } catch (error) {
            console.error('备份失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 恢复备份
    async restoreBackup() {
        try {
            const backup = localStorage.getItem('houseshare_backup');
            
            if (!backup) {
                return { success: false, error: '没有备份数据' };
            }
            
            const data = JSON.parse(backup);
            
            localStorage.setItem('houseshare_properties', JSON.stringify(data.properties));
            localStorage.setItem('houseshare_clients', JSON.stringify(data.clients));
            localStorage.setItem('houseshare_templates', JSON.stringify(data.templates));
            
            return { success: true };
            
        } catch (error) {
            console.error('恢复备份失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 创建服务实例
const services = new HouseShareServices();
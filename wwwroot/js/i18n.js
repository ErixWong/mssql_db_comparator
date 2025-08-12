// 国际化资源文件
const i18nResources = {
    en: {
        // 页面标题和导航
        title: "MSSQL Database Comparison Tool",
        navBrand: "MSSQL Database Comparison Tool",
        
        // 数据库连接配置
        connectionConfig: "Database Connection Configuration",
        collapseConfig: "Collapse Configuration",
        expandConfig: "Expand Configuration",
        databaseA: "Database A",
        databaseB: "Database B",
        
        // 连接信息
        connectionInfo: "Connection Information",
        hostDatabase: "Host / Database",
        serverAddress: "Server Address",
        databaseName: "Database Name",
        portTimeout: "Port / Timeout",
        port: "Port",
        timeout: "Timeout (seconds)",
        
        // 认证信息
        authInfo: "Authentication Information",
        usernamePassword: "Username / Password",
        username: "Username",
        password: "Password",
        
        // 高级选项
        advancedOptions: "Advanced Options",
        instanceName: "Instance Name",
        sqlServerInstance: "SQL Server Instance Name (Optional)",
        encryptConnection: "Encrypt Connection",
        collapse: "Collapse",
        expand: "Expand",
        
        // 按钮
        testConnection: "Test Connection",
        compareDatabases: "Compare Databases",
        
        // 比较范围
        comparisonScope: "Comparison Scope",
        selectAll: "Select All / Deselect All",
        tableStructure: "Table Structure",
        keysAndIndexes: "Keys and Indexes",
        otherObjects: "Other Objects",
        tables: "Tables",
        fields: "Fields",
        primaryKeys: "Primary Keys",
        foreignKeys: "Foreign Keys",
        indexes: "Indexes",
        constraints: "Constraints",
        triggers: "Triggers",
        storedProcedures: "Stored Procedures",
        databaseEncoding: "Database Encoding",
        
        // 比较结果
        comparisonResult: "Comparison Results",
        databaseInfo: "Database Information",
        tableComparison: "Table Comparison",
        onlyInA: "Only in Database A",
        onlyInB: "Only in Database B",
        inBoth: "Exists in Both Databases",
        hasDifferences: "Has Differences",
        columns: "Columns",
        columnDetailsA: "Database A Details:",
        columnDetailsB: "Database B Details:",
        
        // 消息提示
        connectionTestSuccess: "Connection test successful",
        connectionTestFailed: "Connection test failed",
        comparisonComplete: "Database comparison complete",
        comparisonFailed: "Database comparison failed",
        incompleteConfig: "Incomplete database configuration",
        missingFields: "Missing fields",
        dbAMissingFields: "Database A is missing fields",
        dbBMissingFields: "Database B is missing fields",
        dbAConnectionFailed: "Database A connection test failed",
        dbBConnectionFailed: "Database B connection test failed",
        bothConnectionsSuccess: "Both database connections tested successfully",
        
        // 错误消息
        errorConfigNotExists: "Database configuration incomplete: Configuration object does not exist",
        
        // 语言切换
        language: "Language",
        chinese: "中文",
        english: "English"
    },
    
    zh: {
        // 页面标题和导航
        title: "MSSQL 数据库比较工具",
        navBrand: "MSSQL 数据库比较工具",
        
        // 数据库连接配置
        connectionConfig: "数据库连接配置",
        collapseConfig: "收起配置",
        expandConfig: "展开配置",
        databaseA: "数据库 A",
        databaseB: "数据库 B",
        
        // 连接信息
        connectionInfo: "连接信息",
        hostDatabase: "主机 / 数据库",
        serverAddress: "服务器地址",
        databaseName: "数据库名称",
        portTimeout: "端口 / 超时",
        port: "端口",
        timeout: "超时(秒)",
        
        // 认证信息
        authInfo: "认证信息",
        usernamePassword: "用户名 / 密码",
        username: "用户名",
        password: "密码",
        
        // 高级选项
        advancedOptions: "高级选项",
        instanceName: "实例名称",
        sqlServerInstance: "SQL Server实例名称(可选)",
        encryptConnection: "加密连接",
        collapse: "收起",
        expand: "展开",
        
        // 按钮
        testConnection: "测试连接",
        compareDatabases: "比较数据库",
        
        // 比较范围
        comparisonScope: "比较范围",
        selectAll: "全选/取消全选",
        tableStructure: "表结构",
        keysAndIndexes: "键和索引",
        otherObjects: "其他对象",
        tables: "表",
        fields: "字段",
        primaryKeys: "主键",
        foreignKeys: "外键",
        indexes: "索引",
        constraints: "约束",
        triggers: "触发器",
        storedProcedures: "存储过程",
        databaseEncoding: "数据库语言编码",
        
        // 比较结果
        comparisonResult: "比较结果",
        databaseInfo: "数据库信息",
        tableComparison: "表比较",
        onlyInA: "只在数据库A中",
        onlyInB: "只在数据库B中",
        inBoth: "两个数据库中都存在",
        hasDifferences: "有差异",
        columns: "列",
        columnDetailsA: "数据库A详细信息:",
        columnDetailsB: "数据库B详细信息:",
        
        // 消息提示
        connectionTestSuccess: "连接测试成功",
        connectionTestFailed: "连接测试失败",
        comparisonComplete: "数据库比较完成",
        comparisonFailed: "数据库比较失败",
        incompleteConfig: "数据库配置不完整",
        missingFields: "缺少字段",
        dbAMissingFields: "数据库A缺少字段",
        dbBMissingFields: "数据库B缺少字段",
        dbAConnectionFailed: "数据库A连接测试失败",
        dbBConnectionFailed: "数据库B连接测试失败",
        bothConnectionsSuccess: "两个数据库连接测试成功",
        
        // 错误消息
        errorConfigNotExists: "数据库配置不完整：配置对象不存在",
        
        // 语言切换
        language: "语言",
        chinese: "中文",
        english: "English"
    }
};

// 国际化功能
class I18n {
    constructor() {
        this.currentLanguage = 'en'; // 默认设置为英语
        this.resources = i18nResources;
    }
    
    // 设置当前语言
    setLanguage(lang) {
        if (this.resources[lang]) {
            this.currentLanguage = lang;
            // 保存语言设置到localStorage
            localStorage.setItem('preferredLanguage', lang);
            // 触发语言变化事件
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
        }
    }
    
    // 获取当前语言
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // 获取翻译文本
    t(key) {
        const keys = key.split('.');
        let value = this.resources[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // 如果当前语言找不到翻译，尝试使用英语作为备选
                if (this.currentLanguage !== 'en') {
                    value = this.resources['en'];
                    for (const backupKey of keys) {
                        if (value && typeof value === 'object' && backupKey in value) {
                            value = value[backupKey];
                        } else {
                            return key; // 如果英语也找不到，返回key
                        }
                    }
                    return value;
                }
                return key; // 如果找不到翻译，返回key
            }
        }
        
        return value;
    }
    
    // 初始化语言设置
    init() {
        // 从localStorage获取保存的语言设置，如果没有则使用默认语言
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && this.resources[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
    }
}

// 创建全局i18n实例
const i18n = new I18n();

// 初始化
i18n.init();

// 创建Vue响应式语言状态
const languageState = Vue.reactive({
    currentLanguage: i18n.getCurrentLanguage(),
    t(key) {
        return i18n.t(key);
    }
});

// 初始化语言状态
languageState.currentLanguage = i18n.getCurrentLanguage();

// 监听语言变化事件
window.addEventListener('languageChanged', (event) => {
    languageState.currentLanguage = event.detail.lang;
    
    // 更新Vue响应式语言状态中的翻译方法
    languageState.t = (key) => {
        return i18n.t(key);
    };
});

// 导出i18n实例和语言状态
window.i18n = i18n;
window.languageState = languageState;
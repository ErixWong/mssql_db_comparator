// 使用全局Vue对象，而不是ESM导入
const { createApp } = Vue;

// 数据库连接表单组件
const DatabaseConnectionForm = {
    props: ['side'],
    emits: ['connection-change'],
    data() {
        return {
            host: '',
            username: '',
            password: '',
            database: '',
            port: 1433,
            instanceName: '',
            encrypt: false,
            timeout: 60, // 默认超时时间设置为60秒
            testResult: null,
            isTesting: false
        };
    },
    mounted() {
        // 组件挂载时触发一次连接配置更新
        this.$nextTick(() => {
            this.$emit('connection-change', {
                side: this.side,
                config: this.connectionConfig,
                isValid: this.isValid
            });
        });
    },
    computed: {
        connectionConfig() {
            return {
                host: this.host,
                username: this.username,
                password: this.password,
                database: this.database,
                port: parseInt(this.port),
                instanceName: this.instanceName,
                encrypt: this.encrypt,
                timeout: parseInt(this.timeout)
            };
        },
        isValid() {
            return this.host && this.username && this.password && this.database;
        }
    },
    watch: {
        connectionConfig: {
            deep: true,
            handler() {
                this.$emit('connection-change', {
                    side: this.side,
                    config: this.connectionConfig,
                    isValid: this.isValid
                });
            }
        }
    },
    methods: {
        async testConnection() {
            this.isTesting = true;
            this.testResult = null; // 清空之前的测试结果
            
            try {
                console.log('测试连接:', this.connectionConfig);
                const response = await fetch('/api/test-connection', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.connectionConfig)
                });
                
                const result = await response.json();
                console.log('测试结果:', result);
                this.testResult = result;
                
                if (result.success) {
                    this.showSuccess('连接测试成功');
                } else {
                    this.showError(`连接测试失败: ${result.message}`);
                }
            } catch (error) {
                console.error('连接测试错误:', error);
                this.showError(`连接测试失败: ${error.message}`);
                this.testResult = { success: false, message: error.message };
            } finally {
                this.isTesting = false;
            }
        },
        showError(message) {
            if (this.$root && this.$root.showError) {
                this.$root.showError(message);
            } else {
                console.error(message);
                alert('错误: ' + message);
            }
        },
        showSuccess(message) {
            if (this.$root && this.$root.showSuccess) {
                this.$root.showSuccess(message);
            } else {
                console.log(message);
                alert('成功: ' + message);
            }
        }
    },
    template: `
        <div class="connection-form">
            <div class="row mb-3">
                <label class="col-sm-4 col-form-label">主机</label>
                <div class="col-sm-8">
                    <input type="text" class="form-control" v-model="host" placeholder="服务器地址">
                </div>
            </div>
            <div class="row mb-3">
                <label class="col-sm-4 col-form-label">用户名 / 密码</label>
                <div class="col-sm-8">
                    <div class="row g-2">
                        <div class="col-6">
                            <input type="text" class="form-control" v-model="username" placeholder="用户名">
                        </div>
                        <div class="col-6">
                            <input type="password" class="form-control" v-model="password" placeholder="密码">
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mb-3">
                <label class="col-sm-4 col-form-label">数据库名称</label>
                <div class="col-sm-8">
                    <input type="text" class="form-control" v-model="database" placeholder="数据库名称">
                </div>
            </div>
            <div class="row mb-3">
                <label class="col-sm-4 col-form-label">端口号 / 超时</label>
                <div class="col-sm-8">
                    <div class="row g-2">
                        <div class="col-6">
                            <input type="number" class="form-control" v-model="port" placeholder="1433">
                        </div>
                        <div class="col-6">
                            <input type="number" class="form-control" v-model="timeout" placeholder="60(秒)" min="30">
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mb-3">
                <label class="col-sm-4 col-form-label">实例名称</label>
                <div class="col-sm-8">
                    <input type="text" class="form-control" v-model="instanceName" placeholder="SQL Server实例名称(可选)">
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-sm-8 offset-sm-4">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" v-model="encrypt" :id="'encryptCheck' + side">
                        <label class="form-check-label" :for="'encryptCheck' + side">加密连接</label>
                    </div>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-sm-8 offset-sm-4">
                    <button class="btn btn-outline-primary" @click="testConnection" :disabled="isTesting || !isValid">
                        <span v-if="isTesting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        测试连接
                    </button>
                </div>
            </div>
            <div v-if="testResult" class="row">
                <div class="col-12">
                    <div class="alert" :class="testResult.success ? 'alert-success' : 'alert-danger'">
                        {{ testResult.message }}
                    </div>
                </div>
            </div>
        </div>
    `
};

// 比较范围选择器组件
const ComparisonScopeSelector = {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    data() {
        return {
            scope: {
                all: true,
                tables: true,
                fields: true,
                primaryKeys: true,
                foreignKeys: true,
                indexes: true,
                constraints: true,
                triggers: true,
                storedProcedures: true,
                databaseEncoding: true
            },
            // 分组全选状态
            groupStates: {
                tableStructure: true,    // 表结构组: tables, fields
                keysAndIndexes: true,    // 键和索引组: primaryKeys, foreignKeys, indexes, constraints
                otherObjects: true       // 其他对象组: triggers, storedProcedures, databaseEncoding
            }
        };
    },
    mounted() {
        // 组件挂载时触发一次范围配置更新
        this.$nextTick(() => {
            this.updateScopeFromModel();
            this.$emit('update:modelValue', this.scope);
        });
    },
    watch: {
        scope: {
            deep: true,
            handler(newScope) {
                this.$emit('update:modelValue', newScope);
                this.updateGroupStates();
            }
        },
        modelValue: {
            deep: true,
            handler(newVal) {
                if (newVal) {
                    this.updateScopeFromModel();
                }
            }
        }
    },
    methods: {
        updateScopeFromModel() {
            if (this.modelValue) {
                this.scope = { ...this.modelValue };
                this.updateGroupStates();
            }
        },
        
        // 更新分组全选状态
        updateGroupStates() {
            // 表结构组: tables, fields
            this.groupStates.tableStructure = this.scope.tables && this.scope.fields;
            
            // 键和索引组: primaryKeys, foreignKeys, indexes, constraints
            this.groupStates.keysAndIndexes = this.scope.primaryKeys && this.scope.foreignKeys &&
                                             this.scope.indexes && this.scope.constraints;
            
            // 其他对象组: triggers, storedProcedures, databaseEncoding
            this.groupStates.otherObjects = this.scope.triggers && this.scope.storedProcedures &&
                                           this.scope.databaseEncoding;
            
            // 更新总体全选状态
            this.checkAllState();
        },
        
        // 总体全选/取消全选
        toggleAll() {
            const newState = !this.scope.all;
            this.scope.all = newState;
            Object.keys(this.scope).forEach(key => {
                if (key !== 'all') {
                    this.scope[key] = newState;
                }
            });
            this.updateGroupStates();
        },
        
        // 分组全选/取消全选
        toggleGroup(groupName) {
            const newState = !this.groupStates[groupName];
            this.groupStates[groupName] = newState;
            
            switch(groupName) {
                case 'tableStructure':
                    this.scope.tables = newState;
                    this.scope.fields = newState;
                    break;
                case 'keysAndIndexes':
                    this.scope.primaryKeys = newState;
                    this.scope.foreignKeys = newState;
                    this.scope.indexes = newState;
                    this.scope.constraints = newState;
                    break;
                case 'otherObjects':
                    this.scope.triggers = newState;
                    this.scope.storedProcedures = newState;
                    this.scope.databaseEncoding = newState;
                    break;
            }
            
            this.checkAllState();
        },
        
        // 切换单个选项
        toggleItem(item) {
            this.scope[item] = !this.scope[item];
            this.updateGroupStates();
        },
        
        // 检查总体全选状态
        checkAllState() {
            const allSelected = Object.keys(this.scope)
                .filter(key => key !== 'all')
                .every(key => this.scope[key]);
            
            this.scope.all = allSelected;
        }
    },
    template: `
        <div class="scope-selector">
            <div class="scope-group">
                <div class="scope-group-header">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" :checked="scope.all" @change="toggleAll" id="selectAll-scope">
                        <label class="form-check-label" for="selectAll-scope">全选/取消全选</label>
                    </div>
                </div>
                
                <div class="scope-group">
                    <div class="scope-group-header d-flex justify-content-between align-items-center">
                        <span>表结构</span>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" :checked="groupStates.tableStructure" @change="toggleGroup('tableStructure')" id="tableStructureCheck-scope">
                            <label class="form-check-label" for="tableStructureCheck-scope">全选</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.tables" @change="toggleItem('tables')" id="tablesCheck-scope">
                            <label class="form-check-label" for="tablesCheck-scope">表</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.fields" @change="toggleItem('fields')" id="fieldsCheck-scope">
                            <label class="form-check-label" for="fieldsCheck-scope">字段</label>
                        </div>
                    </div>
                </div>
                
                <div class="scope-group">
                    <div class="scope-group-header d-flex justify-content-between align-items-center">
                        <span>键和索引</span>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" :checked="groupStates.keysAndIndexes" @change="toggleGroup('keysAndIndexes')" id="keysAndIndexesCheck-scope">
                            <label class="form-check-label" for="keysAndIndexesCheck-scope">全选</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.primaryKeys" @change="toggleItem('primaryKeys')" id="primaryKeysCheck-scope">
                            <label class="form-check-label" for="primaryKeysCheck-scope">主键</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.foreignKeys" @change="toggleItem('foreignKeys')" id="foreignKeysCheck-scope">
                            <label class="form-check-label" for="foreignKeysCheck-scope">外键</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.indexes" @change="toggleItem('indexes')" id="indexesCheck-scope">
                            <label class="form-check-label" for="indexesCheck-scope">索引</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.constraints" @change="toggleItem('constraints')" id="constraintsCheck-scope">
                            <label class="form-check-label" for="constraintsCheck-scope">约束</label>
                        </div>
                    </div>
                </div>
                
                <div class="scope-group">
                    <div class="scope-group-header d-flex justify-content-between align-items-center">
                        <span>其他对象</span>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" :checked="groupStates.otherObjects" @change="toggleGroup('otherObjects')" id="otherObjectsCheck-scope">
                            <label class="form-check-label" for="otherObjectsCheck-scope">全选</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.triggers" @change="toggleItem('triggers')" id="triggersCheck-scope">
                            <label class="form-check-label" for="triggersCheck-scope">触发器</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.storedProcedures" @change="toggleItem('storedProcedures')" id="storedProceduresCheck-scope">
                            <label class="form-check-label" for="storedProceduresCheck-scope">存储过程</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.databaseEncoding" @change="toggleItem('databaseEncoding')" id="databaseEncodingCheck-scope">
                            <label class="form-check-label" for="databaseEncodingCheck-scope">数据库语言编码</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// 数据库比较结果组件
const DatabaseComparisonResult = {
    props: ['result', 'comparisonScope'],
    data() {
        return {
            expandedTables: new Set(),
            expandedObjects: new Map()
        };
    },
    methods: {
        toggleTable(tableKey) {
            if (this.expandedTables.has(tableKey)) {
                this.expandedTables.delete(tableKey);
            } else {
                this.expandedTables.add(tableKey);
            }
        },
        toggleObject(parentKey, objectKey) {
            const fullKey = `${parentKey}-${objectKey}`;
            if (this.expandedObjects.has(fullKey)) {
                this.expandedObjects.delete(fullKey);
            } else {
                this.expandedObjects.set(fullKey, true);
            }
        },
        isTableExpanded(tableKey) {
            return this.expandedTables.has(tableKey);
        },
        isObjectExpanded(parentKey, objectKey) {
            const fullKey = `${parentKey}-${objectKey}`;
            return this.expandedObjects.has(fullKey);
        },
        getTableKey(table) {
            return `${table.schemaName}.${table.tableName}`;
        },
        getObjectKey(obj) {
            return obj.name || obj.column_name || obj.constraint_name || obj.index_name || obj.trigger_name || obj.procedure_name || 'unknown';
        },
        getDiffClass(status) {
            switch (status) {
                case 'onlyInA': return 'diff-only-in-a';
                case 'onlyInB': return 'diff-only-in-b';
                case 'different': return 'diff-different';
                case 'same': return 'diff-same';
                default: return '';
            }
        }
    },
    template: `
        <div class="comparison-result">
            <!-- 数据库信息比较 -->
            <div v-if="comparisonScope.databaseEncoding && result.databaseInfo" class="mb-4">
                <h6>数据库信息</h6>
                <div class="diff-layout">
                    <div class="diff-column diff-column-left">
                        <div class="comparison-header">数据库 A</div>
                        <div v-for="diff in result.databaseInfo.differences" :key="diff.field" class="mb-2 p-2" :class="getDiffClass('different')">
                            <strong>{{ diff.field }}:</strong> {{ diff.valueA }}
                        </div>
                        <div v-for="sim in result.databaseInfo.similarities" :key="sim.field" class="mb-2 p-2" :class="getDiffClass('same')">
                            <strong>{{ sim.field }}:</strong> {{ sim.value }}
                        </div>
                    </div>
                    <div class="diff-column">
                        <div class="comparison-header">数据库 B</div>
                        <div v-for="diff in result.databaseInfo.differences" :key="diff.field" class="mb-2 p-2" :class="getDiffClass('different')">
                            <strong>{{ diff.field }}:</strong> {{ diff.valueB }}
                        </div>
                        <div v-for="sim in result.databaseInfo.similarities" :key="sim.field" class="mb-2 p-2" :class="getDiffClass('same')">
                            <strong>{{ sim.field }}:</strong> {{ sim.value }}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 表比较 -->
            <div v-if="result.tables && (comparisonScope.tables || comparisonScope.all)">
                <h6>表比较</h6>
                
                <!-- 只在数据库A中的表 -->
                <div v-if="result.tables.onlyInA && result.tables.onlyInA.length > 0" class="mb-3">
                    <h6 class="text-danger">只在数据库A中的表</h6>
                    <div v-for="table in result.tables.onlyInA" :key="getTableKey(table)" class="mb-2 p-2" :class="getDiffClass('onlyInA')">
                        {{ table.schemaName }}.{{ table.tableName }}
                    </div>
                </div>
                
                <!-- 只在数据库B中的表 -->
                <div v-if="result.tables.onlyInB && result.tables.onlyInB.length > 0" class="mb-3">
                    <h6 class="text-primary">只在数据库B中的表</h6>
                    <div v-for="table in result.tables.onlyInB" :key="getTableKey(table)" class="mb-2 p-2" :class="getDiffClass('onlyInB')">
                        {{ table.schemaName }}.{{ table.tableName }}
                    </div>
                </div>
                
                <!-- 两个数据库中都存在的表 -->
                <div v-if="result.tables.inBoth && result.tables.inBoth.length > 0">
                    <h6>两个数据库中都存在的表</h6>
                    <div v-for="table in result.tables.inBoth" :key="getTableKey(table)" class="table-comparison mb-3">
                        <div class="table-header" @click="toggleTable(getTableKey(table))" :class="['expand-collapse-btn', getDiffClass(table.hasDifferences ? 'different' : 'same')]">
                            {{ table.schemaName }}.{{ table.tableName }}
                            <span v-if="table.hasDifferences" class="badge bg-warning ms-2">有差异</span>
                            <span class="float-end">{{ isTableExpanded(getTableKey(table)) ? '▼' : '▶' }}</span>
                        </div>
                        
                        <div v-if="isTableExpanded(getTableKey(table))" class="table-content">
                            <!-- 列比较 -->
                            <div v-if="(comparisonScope.fields || comparisonScope.all) && table.columns">
                                <div class="mb-3">
                                    <h6 @click="toggleObject(getTableKey(table), 'columns')" class="expand-collapse-btn">
                                        列 <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'columns') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'columns')">
                                        <!-- 只在数据库A中的列 -->
                                        <div v-if="table.columns.onlyInA && table.columns.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">只在数据库A中的列</div>
                                            <div v-for="col in table.columns.onlyInA" :key="col.column_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ col.column_name }} ({{ col.data_type }})
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的列 -->
                                        <div v-if="table.columns.onlyInB && table.columns.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">只在数据库B中的列</div>
                                            <div v-for="col in table.columns.onlyInB" :key="col.column_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ col.column_name }} ({{ col.data_type }})
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的列 -->
                                        <div v-if="table.columns.inBoth && table.columns.inBoth.length > 0">
                                            <div>两个数据库中都存在的列</div>
                                            <div v-for="col in table.columns.inBoth" :key="col.column_name" class="column-comparison" :class="getDiffClass(col.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-columns', getObjectKey(col))" class="expand-collapse-btn">
                                                    {{ col.column_name }} ({{ col.data_type }})
                                                    <span v-if="col.hasDifferences" class="badge bg-warning ms-2">有差异</span>
                                                    <span class="float-end">{{ isObjectExpanded(getTableKey(table) + '-columns', getObjectKey(col)) ? '▼' : '▶' }}</span>
                                                </div>
                                                
                                                <div v-if="isObjectExpanded(getTableKey(table) + '-columns', getObjectKey(col))" class="ms-3">
                                                    <!-- 显示差异 -->
                                                    <div v-for="diff in col.differences" :key="diff.field" class="mb-1 p-1" :class="getDiffClass('different')">
                                                        <strong>{{ diff.field }}:</strong> A: {{ diff.valueA }}, B: {{ diff.valueB }}
                                                    </div>
                                                    <!-- 显示相似项 -->
                                                    <div v-for="sim in col.similarities" :key="sim.field" class="mb-1 p-1" :class="getDiffClass('same')">
                                                        <strong>{{ sim.field }}:</strong> {{ sim.value }}
                                                    </div>
                                                    
                                                    <!-- 显示详细属性 -->
                                                    <div class="mt-2 p-2 border-top">
                                                        <div class="row">
                                                            <div class="col-6">
                                                                <h6 class="text-danger">数据库A详细信息:</h6>
                                                                <div v-for="(value, key) in col.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">数据库B详细信息:</h6>
                                                                <div v-for="(value, key) in col.detailsB" :key="'b-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 主键比较 -->
                            <div v-if="(comparisonScope.primaryKeys || comparisonScope.all) && table.primaryKeys">
                                <div class="mb-3">
                                    <h6 @click="toggleObject(getTableKey(table), 'primaryKeys')" class="expand-collapse-btn">
                                        主键 <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'primaryKeys') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'primaryKeys')">
                                        <!-- 只在数据库A中的主键 -->
                                        <div v-if="table.primaryKeys.onlyInA && table.primaryKeys.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">只在数据库A中的主键</div>
                                            <div v-for="pk in table.primaryKeys.onlyInA" :key="pk.column_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ pk.column_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的主键 -->
                                        <div v-if="table.primaryKeys.onlyInB && table.primaryKeys.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">只在数据库B中的主键</div>
                                            <div v-for="pk in table.primaryKeys.onlyInB" :key="pk.column_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ pk.column_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的主键 -->
                                        <div v-if="table.primaryKeys.inBoth && table.primaryKeys.inBoth.length > 0">
                                            <div>两个数据库中都存在的主键</div>
                                            <div v-for="pk in table.primaryKeys.inBoth" :key="pk.column_name" class="column-comparison" :class="getDiffClass(pk.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-primaryKeys', getObjectKey(pk))" class="expand-collapse-btn">
                                                    {{ pk.column_name }}
                                                    <span v-if="pk.hasDifferences" class="badge bg-warning ms-2">有差异</span>
                                                    <span class="float-end">{{ isObjectExpanded(getTableKey(table) + '-primaryKeys', getObjectKey(pk)) ? '▼' : '▶' }}</span>
                                                </div>
                                                
                                                <div v-if="isObjectExpanded(getTableKey(table) + '-primaryKeys', getObjectKey(pk))" class="ms-3">
                                                    <div v-for="diff in pk.differences" :key="diff.field" class="mb-1 p-1" :class="getDiffClass('different')">
                                                        <strong>{{ diff.field }}:</strong> A: {{ diff.valueA }}, B: {{ diff.valueB }}
                                                    </div>
                                                    <div v-for="sim in pk.similarities" :key="sim.field" class="mb-1 p-1" :class="getDiffClass('same')">
                                                        <strong>{{ sim.field }}:</strong> {{ sim.value }}
                                                    </div>
                                                    
                                                    <!-- 显示详细属性 -->
                                                    <div class="mt-2 p-2 border-top">
                                                        <div class="row">
                                                            <div class="col-6">
                                                                <h6 class="text-danger">数据库A详细信息:</h6>
                                                                <div v-for="(value, key) in pk.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">数据库B详细信息:</h6>
                                                                <div v-for="(value, key) in pk.detailsB" :key="'b-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 外键比较 -->
                            <div v-if="(comparisonScope.foreignKeys || comparisonScope.all) && table.foreignKeys">
                                <div class="mb-3">
                                    <h6 @click="toggleObject(getTableKey(table), 'foreignKeys')" class="expand-collapse-btn">
                                        外键 <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'foreignKeys') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'foreignKeys')">
                                        <!-- 只在数据库A中的外键 -->
                                        <div v-if="table.foreignKeys.onlyInA && table.foreignKeys.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">只在数据库A中的外键</div>
                                            <div v-for="fk in table.foreignKeys.onlyInA" :key="fk.constraint_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ fk.constraint_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的外键 -->
                                        <div v-if="table.foreignKeys.onlyInB && table.foreignKeys.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">只在数据库B中的外键</div>
                                            <div v-for="fk in table.foreignKeys.onlyInB" :key="fk.constraint_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ fk.constraint_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的外键 -->
                                        <div v-if="table.foreignKeys.inBoth && table.foreignKeys.inBoth.length > 0">
                                            <div>两个数据库中都存在的外键</div>
                                            <div v-for="fk in table.foreignKeys.inBoth" :key="fk.constraint_name" class="column-comparison" :class="getDiffClass(fk.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-foreignKeys', getObjectKey(fk))" class="expand-collapse-btn">
                                                    {{ fk.constraint_name }}
                                                    <span v-if="fk.hasDifferences" class="badge bg-warning ms-2">有差异</span>
                                                    <span class="float-end">{{ isObjectExpanded(getTableKey(table) + '-foreignKeys', getObjectKey(fk)) ? '▼' : '▶' }}</span>
                                                </div>
                                                
                                                <div v-if="isObjectExpanded(getTableKey(table) + '-foreignKeys', getObjectKey(fk))" class="ms-3">
                                                    <div v-for="diff in fk.differences" :key="diff.field" class="mb-1 p-1" :class="getDiffClass('different')">
                                                        <strong>{{ diff.field }}:</strong> A: {{ diff.valueA }}, B: {{ diff.valueB }}
                                                    </div>
                                                    <div v-for="sim in fk.similarities" :key="sim.field" class="mb-1 p-1" :class="getDiffClass('same')">
                                                        <strong>{{ sim.field }}:</strong> {{ sim.value }}
                                                    </div>
                                                    
                                                    <!-- 显示详细属性 -->
                                                    <div class="mt-2 p-2 border-top">
                                                        <div class="row">
                                                            <div class="col-6">
                                                                <h6 class="text-danger">数据库A详细信息:</h6>
                                                                <div v-for="(value, key) in fk.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">数据库B详细信息:</h6>
                                                                <div v-for="(value, key) in fk.detailsB" :key="'b-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 索引比较 -->
                            <div v-if="(comparisonScope.indexes || comparisonScope.all) && table.indexes">
                                <div class="mb-3">
                                    <h6 @click="toggleObject(getTableKey(table), 'indexes')" class="expand-collapse-btn">
                                        索引 <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'indexes') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'indexes')">
                                        <!-- 只在数据库A中的索引 -->
                                        <div v-if="table.indexes.onlyInA && table.indexes.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">只在数据库A中的索引</div>
                                            <div v-for="idx in table.indexes.onlyInA" :key="idx.index_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ idx.index_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的索引 -->
                                        <div v-if="table.indexes.onlyInB && table.indexes.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">只在数据库B中的索引</div>
                                            <div v-for="idx in table.indexes.onlyInB" :key="idx.index_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ idx.index_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的索引 -->
                                        <div v-if="table.indexes.inBoth && table.indexes.inBoth.length > 0">
                                            <div>两个数据库中都存在的索引</div>
                                            <div v-for="idx in table.indexes.inBoth" :key="idx.index_name" class="column-comparison" :class="getDiffClass(idx.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-indexes', getObjectKey(idx))" class="expand-collapse-btn">
                                                    {{ idx.index_name }}
                                                    <span v-if="idx.hasDifferences" class="badge bg-warning ms-2">有差异</span>
                                                    <span class="float-end">{{ isObjectExpanded(getTableKey(table) + '-indexes', getObjectKey(idx)) ? '▼' : '▶' }}</span>
                                                </div>
                                                
                                                <div v-if="isObjectExpanded(getTableKey(table) + '-indexes', getObjectKey(idx))" class="ms-3">
                                                    <div v-for="diff in idx.differences" :key="diff.field" class="mb-1 p-1" :class="getDiffClass('different')">
                                                        <strong>{{ diff.field }}:</strong> A: {{ diff.valueA }}, B: {{ diff.valueB }}
                                                    </div>
                                                    <div v-for="sim in idx.similarities" :key="sim.field" class="mb-1 p-1" :class="getDiffClass('same')">
                                                        <strong>{{ sim.field }}:</strong> {{ sim.value }}
                                                    </div>
                                                    
                                                    <!-- 显示详细属性 -->
                                                    <div class="mt-2 p-2 border-top">
                                                        <div class="row">
                                                            <div class="col-6">
                                                                <h6 class="text-danger">数据库A详细信息:</h6>
                                                                <div v-for="(value, key) in idx.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">数据库B详细信息:</h6>
                                                                <div v-for="(value, key) in idx.detailsB" :key="'b-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 约束比较 -->
                            <div v-if="(comparisonScope.constraints || comparisonScope.all) && table.constraints">
                                <div class="mb-3">
                                    <h6 @click="toggleObject(getTableKey(table), 'constraints')" class="expand-collapse-btn">
                                        约束 <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'constraints') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'constraints')">
                                        <!-- 只在数据库A中的约束 -->
                                        <div v-if="table.constraints.onlyInA && table.constraints.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">只在数据库A中的约束</div>
                                            <div v-for="con in table.constraints.onlyInA" :key="con.constraint_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ con.constraint_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的约束 -->
                                        <div v-if="table.constraints.onlyInB && table.constraints.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">只在数据库B中的约束</div>
                                            <div v-for="con in table.constraints.onlyInB" :key="con.constraint_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ con.constraint_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的约束 -->
                                        <div v-if="table.constraints.inBoth && table.constraints.inBoth.length > 0">
                                            <div>两个数据库中都存在的约束</div>
                                            <div v-for="con in table.constraints.inBoth" :key="con.constraint_name" class="column-comparison" :class="getDiffClass(con.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-constraints', getObjectKey(con))" class="expand-collapse-btn">
                                                    {{ con.constraint_name }}
                                                    <span v-if="con.hasDifferences" class="badge bg-warning ms-2">有差异</span>
                                                    <span class="float-end">{{ isObjectExpanded(getTableKey(table) + '-constraints', getObjectKey(con)) ? '▼' : '▶' }}</span>
                                                </div>
                                                
                                                <div v-if="isObjectExpanded(getTableKey(table) + '-constraints', getObjectKey(con))" class="ms-3">
                                                    <div v-for="diff in con.differences" :key="diff.field" class="mb-1 p-1" :class="getDiffClass('different')">
                                                        <strong>{{ diff.field }}:</strong> A: {{ diff.valueA }}, B: {{ diff.valueB }}
                                                    </div>
                                                    <div v-for="sim in con.similarities" :key="sim.field" class="mb-1 p-1" :class="getDiffClass('same')">
                                                        <strong>{{ sim.field }}:</strong> {{ sim.value }}
                                                    </div>
                                                    
                                                    <!-- 显示详细属性 -->
                                                    <div class="mt-2 p-2 border-top">
                                                        <div class="row">
                                                            <div class="col-6">
                                                                <h6 class="text-danger">数据库A详细信息:</h6>
                                                                <div v-for="(value, key) in con.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">数据库B详细信息:</h6>
                                                                <div v-for="(value, key) in con.detailsB" :key="'b-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 触发器比较 -->
                            <div v-if="(comparisonScope.triggers || comparisonScope.all) && table.triggers">
                                <div class="mb-3">
                                    <h6 @click="toggleObject(getTableKey(table), 'triggers')" class="expand-collapse-btn">
                                        触发器 <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'triggers') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'triggers')">
                                        <!-- 只在数据库A中的触发器 -->
                                        <div v-if="table.triggers.onlyInA && table.triggers.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">只在数据库A中的触发器</div>
                                            <div v-for="trig in table.triggers.onlyInA" :key="trig.trigger_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ trig.trigger_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的触发器 -->
                                        <div v-if="table.triggers.onlyInB && table.triggers.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">只在数据库B中的触发器</div>
                                            <div v-for="trig in table.triggers.onlyInB" :key="trig.trigger_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ trig.trigger_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的触发器 -->
                                        <div v-if="table.triggers.inBoth && table.triggers.inBoth.length > 0">
                                            <div>两个数据库中都存在的触发器</div>
                                            <div v-for="trig in table.triggers.inBoth" :key="trig.trigger_name" class="column-comparison" :class="getDiffClass(trig.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-triggers', getObjectKey(trig))" class="expand-collapse-btn">
                                                    {{ trig.trigger_name }}
                                                    <span v-if="trig.hasDifferences" class="badge bg-warning ms-2">有差异</span>
                                                    <span class="float-end">{{ isObjectExpanded(getTableKey(table) + '-triggers', getObjectKey(trig)) ? '▼' : '▶' }}</span>
                                                </div>
                                                
                                                <div v-if="isObjectExpanded(getTableKey(table) + '-triggers', getObjectKey(trig))" class="ms-3">
                                                    <div v-for="diff in trig.differences" :key="diff.field" class="mb-1 p-1" :class="getDiffClass('different')">
                                                        <strong>{{ diff.field }}:</strong> A: {{ diff.valueA }}, B: {{ diff.valueB }}
                                                    </div>
                                                    <div v-for="sim in trig.similarities" :key="sim.field" class="mb-1 p-1" :class="getDiffClass('same')">
                                                        <strong>{{ sim.field }}:</strong> {{ sim.value }}
                                                    </div>
                                                    
                                                    <!-- 显示详细属性 -->
                                                    <div class="mt-2 p-2 border-top">
                                                        <div class="row">
                                                            <div class="col-6">
                                                                <h6 class="text-danger">数据库A详细信息:</h6>
                                                                <div v-for="(value, key) in trig.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">数据库B详细信息:</h6>
                                                                <div v-for="(value, key) in trig.detailsB" :key="'b-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 存储过程比较 -->
            <div v-if="result.storedProcedures && (comparisonScope.storedProcedures || comparisonScope.all)">
                <h6>存储过程比较</h6>
                
                <!-- 只在数据库A中的存储过程 -->
                <div v-if="result.storedProcedures.onlyInA && result.storedProcedures.onlyInA.length > 0" class="mb-3">
                    <h6 class="text-danger">只在数据库A中的存储过程</h6>
                    <div v-for="proc in result.storedProcedures.onlyInA" :key="proc.procedure_name" class="mb-2 p-2" :class="getDiffClass('onlyInA')">
                        {{ proc.procedure_name }}
                    </div>
                </div>
                
                <!-- 只在数据库B中的存储过程 -->
                <div v-if="result.storedProcedures.onlyInB && result.storedProcedures.onlyInB.length > 0" class="mb-3">
                    <h6 class="text-primary">只在数据库B中的存储过程</h6>
                    <div v-for="proc in result.storedProcedures.onlyInB" :key="proc.procedure_name" class="mb-2 p-2" :class="getDiffClass('onlyInB')">
                        {{ proc.procedure_name }}
                    </div>
                </div>
                
                <!-- 两个数据库中都存在的存储过程 -->
                <div v-if="result.storedProcedures.inBoth && result.storedProcedures.inBoth.length > 0">
                    <h6>两个数据库中都存在的存储过程</h6>
                    <div v-for="proc in result.storedProcedures.inBoth" :key="proc.procedure_name" class="mb-3 p-2" :class="getDiffClass(proc.hasDifferences ? 'different' : 'same')">
                        <div @click="toggleObject('storedProcedures', getObjectKey(proc))" class="expand-collapse-btn">
                            {{ proc.procedure_name }}
                            <span v-if="proc.hasDifferences" class="badge bg-warning ms-2">有差异</span>
                            <span class="float-end">{{ isObjectExpanded('storedProcedures', getObjectKey(proc)) ? '▼' : '▶' }}</span>
                        </div>
                        
                        <div v-if="isObjectExpanded('storedProcedures', getObjectKey(proc))" class="ms-3">
                            <div v-for="diff in proc.differences" :key="diff.field" class="mb-1 p-1" :class="getDiffClass('different')">
                                <strong>{{ diff.field }}:</strong> A: {{ diff.valueA }}, B: {{ diff.valueB }}
                            </div>
                            <div v-for="sim in proc.similarities" :key="sim.field" class="mb-1 p-1" :class="getDiffClass('same')">
                                <strong>{{ sim.field }}:</strong> {{ sim.value }}
                            </div>
                            
                            <!-- 显示详细属性 -->
                            <div class="mt-2 p-2 border-top">
                                <div class="row">
                                    <div class="col-6">
                                        <h6 class="text-danger">数据库A详细信息:</h6>
                                        <div v-for="(value, key) in proc.detailsA" :key="'a-'+key" class="mb-1">
                                            <strong>{{ key }}:</strong> {{ value }}
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <h6 class="text-primary">数据库B详细信息:</h6>
                                        <div v-for="(value, key) in proc.detailsB" :key="'b-'+key" class="mb-1">
                                            <strong>{{ key }}:</strong> {{ value }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// 创建Vue应用
const app = createApp({
    components: {
        DatabaseConnectionForm,
        ComparisonScopeSelector,
        DatabaseComparisonResult
    },
    data() {
        return {
            dbAConfig: null,
            dbBConfig: null,
            connectionsValid: false,
            isTesting: false,
            isComparing: false,
            isConnectionPanelExpanded: true, // 控制数据库连接配置区域的展开/收起状态
            showComparisonScope: true,
            showComparisonResult: false,
            comparisonScope: {
                all: true,
                tables: true,
                fields: true,
                primaryKeys: true,
                foreignKeys: true,
                indexes: true,
                constraints: true,
                triggers: true,
                storedProcedures: true,
                databaseEncoding: true
            },
            comparisonResult: null,
            errorMessage: '',
            successMessage: '',
            errorToast: null,
            successToast: null
        };
    },
    mounted() {
        // 初始化Toast - 使用nextTick确保DOM已经更新
        this.$nextTick(() => {
            if (this.$refs.errorToast && this.$refs.successToast) {
                this.errorToast = new bootstrap.Toast(this.$refs.errorToast);
                this.successToast = new bootstrap.Toast(this.$refs.successToast);
            }
        });
    },
    methods: {
        onConnectionChange(data) {
            if (data.side === 'A') {
                this.dbAConfig = data.config;
            } else {
                this.dbBConfig = data.config;
            }
            
            // 检查两个连接是否都有效
            this.connectionsValid = this.dbAConfig && this.dbBConfig && 
                                  this.dbAConfig.host && this.dbAConfig.username && 
                                  this.dbAConfig.password && this.dbAConfig.database &&
                                  this.dbBConfig.host && this.dbBConfig.username && 
                                  this.dbBConfig.password && this.dbBConfig.database;
        },
        
        async testConnections() {
            this.isTesting = true;
            try {
                console.log('测试数据库连接 A:', this.dbAConfig);
                console.log('测试数据库连接 B:', this.dbBConfig);
                
                console.log('dbAConfig:', this.dbAConfig);
                console.log('dbBConfig:', this.dbBConfig);
                
                // 检查数据库配置是否完整
                if (!this.dbAConfig || !this.dbBConfig) {
                    this.showError('数据库配置不完整：配置对象不存在');
                    return;
                }
                
                // 检查必填字段
                const requiredFields = ['host', 'username', 'password', 'database'];
                const missingFieldsA = requiredFields.filter(field => !this.dbAConfig[field]);
                const missingFieldsB = requiredFields.filter(field => !this.dbBConfig[field]);
                
                if (missingFieldsA.length > 0 || missingFieldsB.length > 0) {
                    let errorMsg = '数据库配置不完整：';
                    if (missingFieldsA.length > 0) {
                        errorMsg += `数据库A缺少字段 ${missingFieldsA.join(', ')}. `;
                    }
                    if (missingFieldsB.length > 0) {
                        errorMsg += `数据库B缺少字段 ${missingFieldsB.join(', ')}. `;
                    }
                    this.showError(errorMsg);
                    return;
                }
                
                // 测试数据库A连接
                const responseA = await fetch('/api/test-connection', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.dbAConfig)
                });
                
                const resultA = await responseA.json();
                console.log('数据库A测试结果:', resultA);
                if (!resultA.success) {
                    this.showError(`数据库A连接测试失败: ${resultA.message}`);
                    return;
                }
                
                // 测试数据库B连接
                const responseB = await fetch('/api/test-connection', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.dbBConfig)
                });
                
                const resultB = await responseB.json();
                console.log('数据库B测试结果:', resultB);
                if (!resultB.success) {
                    this.showError(`数据库B连接测试失败: ${resultB.message}`);
                    return;
                }
                
                this.showSuccess('两个数据库连接测试成功');
                this.showComparisonScope = true;
            } catch (error) {
                console.error('连接测试错误:', error);
                this.showError(`连接测试失败: ${error.message}`);
            } finally {
                this.isTesting = false;
            }
        },
        
        async compareDatabases() {
            this.isComparing = true;
            try {
                const response = await fetch('/api/compare-databases', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dbAConfig: this.dbAConfig,
                        dbBConfig: this.dbBConfig,
                        comparisonScope: this.comparisonScope
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    this.comparisonResult = result.comparisonResult;
                    this.showComparisonResult = true;
                    this.showSuccess('数据库比较完成');
                } else {
                    this.showError(`数据库比较失败: ${result.message}`);
                }
            } catch (error) {
                this.showError(`数据库比较失败: ${error.message}`);
            } finally {
                this.isComparing = false;
            }
        },
        
        showError(message) {
            this.errorMessage = message;
            this.errorToast.show();
        },
        
        showSuccess(message) {
            this.successMessage = message;
            this.successToast.show();
        },
        
        toggleConnectionPanel() {
            this.isConnectionPanelExpanded = !this.isConnectionPanelExpanded;
        }
    }
});

app.mount('#app');
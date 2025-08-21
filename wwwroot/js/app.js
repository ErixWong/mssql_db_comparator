// 使用全局Vue对象，而不是ESM导入
const { createApp } = Vue;

// 确保i18n已加载
if (typeof window.i18n === 'undefined') {
    console.error('i18n not loaded');
}

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
            isTesting: false,
            languageKey: 0 // 用于强制重新渲染组件
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
        
        // 监听语言变化事件
        window.addEventListener('languageChanged', () => {
            // 通过改变 languageKey 来强制重新渲染组件
            this.languageKey++;
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
                    this.showSuccess(this.$root.t('connectionTestSuccess'));
                } else {
                    this.showError(`${this.$root.t('connectionTestFailed')}: ${result.message}`);
                }
            } catch (error) {
                console.error('连接测试错误:', error);
                this.showError(`${this.$root.t('connectionTestFailed')}: ${error.message}`);
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
        <div class="connection-form" :key="languageKey">
            <!-- 连接信息组 -->
            <div class="form-group mb-4">
                <h6 class="text-primary mb-3"><i class="bi bi-server me-2"></i>{{ $root.t('connectionInfo') }}</h6>
                
                <div class="row mb-3">
                    <label class="col-12 col-md-3 col-form-label">{{ $root.t('hostDatabase') }}</label>
                    <div class="col-12 col-md-9">
                        <div class="row g-2">
                            <div class="col-12 col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-hdd-network"></i></span>
                                    <input type="text" class="form-control" v-model="host" :placeholder="$root.t('serverAddress')">
                                </div>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-database"></i></span>
                                    <input type="text" class="form-control" v-model="database" :placeholder="$root.t('databaseName')">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <label class="col-12 col-md-3 col-form-label">{{ $root.t('portTimeout') }}</label>
                    <div class="col-12 col-md-9">
                        <div class="row g-2">
                            <div class="col-6 col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-ethernet"></i></span>
                                    <input type="number" class="form-control" v-model="port" :placeholder="$root.t('port')">
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-clock"></i></span>
                                    <input type="number" class="form-control" v-model="timeout" :placeholder="$root.t('timeout')" min="30">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 认证信息组 -->
            <div class="form-group mb-4">
                <h6 class="text-success mb-3"><i class="bi bi-shield-lock me-2"></i>{{ $root.t('authInfo') }}</h6>
                
                <div class="row mb-3">
                    <label class="col-12 col-md-3 col-form-label">{{ $root.t('usernamePassword') }}</label>
                    <div class="col-12 col-md-9">
                        <div class="row g-2">
                            <div class="col-12 col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-person"></i></span>
                                    <input type="text" class="form-control" v-model="username" :placeholder="$root.t('username')">
                                </div>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-key"></i></span>
                                    <input :type="showPassword ? 'text' : 'password'" class="form-control" v-model="password" :placeholder="$root.t('password')">
                                    <button class="btn btn-outline-secondary" type="button" @click="showPassword = !showPassword">
                                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 高级选项组 -->
            <div class="form-group mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="text-warning mb-0"><i class="bi bi-gear me-2"></i>{{ $root.t('advancedOptions') }}</h6>
                    <button class="btn btn-sm btn-outline-secondary" @click="showAdvanced = !showAdvanced">
                        <i :class="showAdvanced ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
                        {{ showAdvanced ? $root.t('collapse') : $root.t('expand') }}
                    </button>
                </div>
                
                <div v-if="showAdvanced" class="row">
                    <div class="col-12">
                        <div class="row mb-3">
                            <label class="col-12 col-md-3 col-form-label">{{ $root.t('instanceName') }}</label>
                            <div class="col-12 col-md-9">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-collection"></i></span>
                                    <input type="text" class="form-control" v-model="instanceName" :placeholder="$root.t('sqlServerInstance')">
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-12 offset-md-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" v-model="encrypt" :id="'encryptCheck' + side">
                                    <label class="form-check-label" :for="'encryptCheck' + side">
                                        <i class="bi bi-lock-fill me-1"></i>{{ $root.t('encryptConnection') }}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="row">
                <div class="col-12 text-center">
                    <button class="btn btn-primary" @click="testConnection" :disabled="isTesting || !isValid">
                        <span v-if="isTesting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <i class="bi bi-wifi me-1"></i>{{ $root.t('testConnection') }}
                    </button>
                </div>
            </div>
            
            <!-- 测试结果 -->
            <div v-if="testResult" class="row mt-3">
                <div class="col-12">
                    <div class="alert" :class="testResult.success ? 'alert-success' : 'alert-danger'">
                        <i :class="testResult.success ? 'bi bi-check-circle me-1' : 'bi bi-exclamation-triangle me-1'"></i>
                        {{ testResult.message }}
                    </div>
                </div>
            </div>
        </div>
    `,
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
            isTesting: false,
            showPassword: false,
            showAdvanced: false
        };
    }
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
                        <label class="form-check-label" for="selectAll-scope">{{ $root.t('selectAll') }}</label>
                    </div>
                </div>
                
                <div class="scope-group">
                    <div class="scope-group-header d-flex justify-content-between align-items-center">
                        <span>{{ $root.t('tableStructure') }}</span>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" :checked="groupStates.tableStructure" @change="toggleGroup('tableStructure')" id="tableStructureCheck-scope">
                            <label class="form-check-label" for="tableStructureCheck-scope">{{ $root.t('selectAll') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.tables" @change="toggleItem('tables')" id="tablesCheck-scope">
                            <label class="form-check-label" for="tablesCheck-scope">{{ $root.t('tables') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.fields" @change="toggleItem('fields')" id="fieldsCheck-scope">
                            <label class="form-check-label" for="fieldsCheck-scope">{{ $root.t('fields') }}</label>
                        </div>
                    </div>
                </div>
                
                <div class="scope-group">
                    <div class="scope-group-header d-flex justify-content-between align-items-center">
                        <span>{{ $root.t('keysAndIndexes') }}</span>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" :checked="groupStates.keysAndIndexes" @change="toggleGroup('keysAndIndexes')" id="keysAndIndexesCheck-scope">
                            <label class="form-check-label" for="keysAndIndexesCheck-scope">{{ $root.t('selectAll') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.primaryKeys" @change="toggleItem('primaryKeys')" id="primaryKeysCheck-scope">
                            <label class="form-check-label" for="primaryKeysCheck-scope">{{ $root.t('primaryKeys') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.foreignKeys" @change="toggleItem('foreignKeys')" id="foreignKeysCheck-scope">
                            <label class="form-check-label" for="foreignKeysCheck-scope">{{ $root.t('foreignKeys') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.indexes" @change="toggleItem('indexes')" id="indexesCheck-scope">
                            <label class="form-check-label" for="indexesCheck-scope">{{ $root.t('indexes') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.constraints" @change="toggleItem('constraints')" id="constraintsCheck-scope">
                            <label class="form-check-label" for="constraintsCheck-scope">{{ $root.t('constraints') }}</label>
                        </div>
                    </div>
                </div>
                
                <div class="scope-group">
                    <div class="scope-group-header d-flex justify-content-between align-items-center">
                        <span>{{ $root.t('otherObjects') }}</span>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" :checked="groupStates.otherObjects" @change="toggleGroup('otherObjects')" id="otherObjectsCheck-scope">
                            <label class="form-check-label" for="otherObjectsCheck-scope">{{ $root.t('selectAll') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.triggers" @change="toggleItem('triggers')" id="triggersCheck-scope">
                            <label class="form-check-label" for="triggersCheck-scope">{{ $root.t('triggers') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.storedProcedures" @change="toggleItem('storedProcedures')" id="storedProceduresCheck-scope">
                            <label class="form-check-label" for="storedProceduresCheck-scope">{{ $root.t('storedProcedures') }}</label>
                        </div>
                    </div>
                    <div class="scope-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" :checked="scope.databaseEncoding" @change="toggleItem('databaseEncoding')" id="databaseEncodingCheck-scope">
                            <label class="form-check-label" for="databaseEncodingCheck-scope">{{ $root.t('databaseEncoding') }}</label>
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
                <h6>{{ $root.t('databaseInfo') }}</h6>
                <div class="diff-layout">
                    <div class="diff-column diff-column-left">
                        <div class="comparison-header">{{ $root.t('databaseA') }}</div>
                        <div v-for="diff in result.databaseInfo.differences" :key="diff.field" class="mb-2 p-2" :class="getDiffClass('different')">
                            <strong>{{ diff.field }}:</strong> {{ diff.valueA }}
                        </div>
                        <div v-for="sim in result.databaseInfo.similarities" :key="sim.field" class="mb-2 p-2" :class="getDiffClass('same')">
                            <strong>{{ sim.field }}:</strong> {{ sim.value }}
                        </div>
                    </div>
                    <div class="diff-column">
                        <div class="comparison-header">{{ $root.t('databaseB') }}</div>
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
                <h6>{{ $root.t('tableComparison') }}</h6>
                
                <!-- 只在数据库A中的表 -->
                <div v-if="result.tables.onlyInA && result.tables.onlyInA.length > 0" class="mb-3">
                    <h6 class="text-danger">{{ $root.t('onlyInA') }}</h6>
                    <div v-for="table in result.tables.onlyInA" :key="getTableKey(table)" class="mb-2 p-2" :class="getDiffClass('onlyInA')">
                        {{ table.schemaName }}.{{ table.tableName }}
                    </div>
                </div>
                
                <!-- 只在数据库B中的表 -->
                <div v-if="result.tables.onlyInB && result.tables.onlyInB.length > 0" class="mb-3">
                    <h6 class="text-primary">{{ $root.t('onlyInB') }}</h6>
                    <div v-for="table in result.tables.onlyInB" :key="getTableKey(table)" class="mb-2 p-2" :class="getDiffClass('onlyInB')">
                        {{ table.schemaName }}.{{ table.tableName }}
                    </div>
                </div>
                
                <!-- 两个数据库中都存在的表 -->
                <div v-if="result.tables.inBoth && result.tables.inBoth.length > 0">
                    <h6>{{ $root.t('inBoth') }}</h6>
                    <div v-for="table in result.tables.inBoth" :key="getTableKey(table)" class="table-comparison mb-3">
                        <div class="table-header d-flex justify-content-between align-items-center" :class="['expand-collapse-btn', getDiffClass(table.hasDifferences ? 'different' : 'same')]">
                            <div @click="toggleTable(getTableKey(table))" class="flex-grow-1">
                                {{ table.schemaName }}.{{ table.tableName }}
                                <span v-if="table.fieldCountInfo && table.fieldCountInfo.difference !== 0" class="badge bg-info ms-2">
                                    {{ $root.t('fieldCountDifference').replace('{countA}', table.fieldCountInfo.countA).replace('{countB}', table.fieldCountInfo.countB).replace('{difference}', table.fieldCountInfo.difference > 0 ? '+' + table.fieldCountInfo.difference : table.fieldCountInfo.difference) }}
                                </span>
                                <span v-if="table.hasDifferences && (!table.fieldCountInfo || table.fieldCountInfo.difference === 0)" class="badge bg-warning ms-2">{{ $root.t('hasDifferences') }}</span>
                                <span class="float-end">{{ isTableExpanded(getTableKey(table)) ? '▼' : '▶' }}</span>
                            </div>
                            <button class="btn btn-sm btn-outline-primary ms-2" @click.stop="$root.compareSingleTable(table.schemaName, table.tableName)" :disabled="$root.isComparing">
                                <span v-if="$root.isComparing" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                {{ $root.t('recompareTable') }}
                            </button>
                        </div>
                        
                        <div v-if="isTableExpanded(getTableKey(table))" class="table-content">
                            <!-- 列比较 -->
                            <div v-if="(comparisonScope.fields || comparisonScope.all) && table.columns">
                                <div class="mb-3">
                                    <h6 @click="toggleObject(getTableKey(table), 'columns')" class="expand-collapse-btn">
                                        {{ $root.t('columns') }} <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'columns') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'columns')">
                                        <!-- 只在数据库A中的列 -->
                                        <div v-if="table.columns.onlyInA && table.columns.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">{{ $root.t('onlyInA') }}</div>
                                            <div v-for="col in table.columns.onlyInA" :key="col.column_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ col.column_name }} ({{ col.data_type }})
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的列 -->
                                        <div v-if="table.columns.onlyInB && table.columns.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">{{ $root.t('onlyInB') }}</div>
                                            <div v-for="col in table.columns.onlyInB" :key="col.column_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ col.column_name }} ({{ col.data_type }})
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的列 -->
                                        <div v-if="table.columns.inBoth && table.columns.inBoth.length > 0">
                                            <div>{{ $root.t('inBoth') }}</div>
                                            <div v-for="col in table.columns.inBoth" :key="col.column_name" class="column-comparison" :class="getDiffClass(col.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-columns', getObjectKey(col))" class="expand-collapse-btn">
                                                    {{ col.column_name }} ({{ col.data_type }})
                                                    <span v-if="col.hasDifferences" class="badge bg-warning ms-2">{{ $root.t('hasDifferences') }}</span>
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
                                                                <h6 class="text-danger">{{ $root.t('columnDetailsA') }}</h6>
                                                                <div v-for="(value, key) in col.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">{{ $root.t('columnDetailsB') }}</h6>
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
                                        {{ $root.t('primaryKeys') }} <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'primaryKeys') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'primaryKeys')">
                                        <!-- 只在数据库A中的主键 -->
                                        <div v-if="table.primaryKeys.onlyInA && table.primaryKeys.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">{{ $root.t('onlyInA') }}</div>
                                            <div v-for="pk in table.primaryKeys.onlyInA" :key="pk.column_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ pk.column_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的主键 -->
                                        <div v-if="table.primaryKeys.onlyInB && table.primaryKeys.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">{{ $root.t('onlyInB') }}</div>
                                            <div v-for="pk in table.primaryKeys.onlyInB" :key="pk.column_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ pk.column_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的主键 -->
                                        <div v-if="table.primaryKeys.inBoth && table.primaryKeys.inBoth.length > 0">
                                            <div>{{ $root.t('inBoth') }}</div>
                                            <div v-for="pk in table.primaryKeys.inBoth" :key="pk.column_name" class="column-comparison" :class="getDiffClass(pk.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-primaryKeys', getObjectKey(pk))" class="expand-collapse-btn">
                                                    {{ pk.column_name }}
                                                    <span v-if="pk.hasDifferences" class="badge bg-warning ms-2">{{ $root.t('hasDifferences') }}</span>
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
                                                                <h6 class="text-danger">{{ $root.t('columnDetailsA') }}</h6>
                                                                <div v-for="(value, key) in pk.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">{{ $root.t('columnDetailsB') }}</h6>
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
                                        {{ $root.t('foreignKeys') }} <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'foreignKeys') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'foreignKeys')">
                                        <!-- 只在数据库A中的外键 -->
                                        <div v-if="table.foreignKeys.onlyInA && table.foreignKeys.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">{{ $root.t('onlyInA') }}</div>
                                            <div v-for="fk in table.foreignKeys.onlyInA" :key="fk.constraint_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ fk.constraint_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的外键 -->
                                        <div v-if="table.foreignKeys.onlyInB && table.foreignKeys.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">{{ $root.t('onlyInB') }}</div>
                                            <div v-for="fk in table.foreignKeys.onlyInB" :key="fk.constraint_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ fk.constraint_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的外键 -->
                                        <div v-if="table.foreignKeys.inBoth && table.foreignKeys.inBoth.length > 0">
                                            <div>{{ $root.t('inBoth') }}</div>
                                            <div v-for="fk in table.foreignKeys.inBoth" :key="fk.constraint_name" class="column-comparison" :class="getDiffClass(fk.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-foreignKeys', getObjectKey(fk))" class="expand-collapse-btn">
                                                    {{ fk.constraint_name }}
                                                    <span v-if="fk.hasDifferences" class="badge bg-warning ms-2">{{ $root.t('hasDifferences') }}</span>
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
                                                                <h6 class="text-danger">{{ $root.t('columnDetailsA') }}</h6>
                                                                <div v-for="(value, key) in fk.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">{{ $root.t('columnDetailsB') }}</h6>
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
                                        {{ $root.t('indexes') }} <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'indexes') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'indexes')">
                                        <!-- 只在数据库A中的索引 -->
                                        <div v-if="table.indexes.onlyInA && table.indexes.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">{{ $root.t('onlyInA') }}</div>
                                            <div v-for="idx in table.indexes.onlyInA" :key="idx.index_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ idx.index_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的索引 -->
                                        <div v-if="table.indexes.onlyInB && table.indexes.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">{{ $root.t('onlyInB') }}</div>
                                            <div v-for="idx in table.indexes.onlyInB" :key="idx.index_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ idx.index_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的索引 -->
                                        <div v-if="table.indexes.inBoth && table.indexes.inBoth.length > 0">
                                            <div>{{ $root.t('inBoth') }}</div>
                                            <div v-for="idx in table.indexes.inBoth" :key="idx.index_name" class="column-comparison" :class="getDiffClass(idx.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-indexes', getObjectKey(idx))" class="expand-collapse-btn">
                                                    {{ idx.index_name }}
                                                    <span v-if="idx.hasDifferences" class="badge bg-warning ms-2">{{ $root.t('hasDifferences') }}</span>
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
                                                                <h6 class="text-danger">{{ $root.t('columnDetailsA') }}</h6>
                                                                <div v-for="(value, key) in idx.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">{{ $root.t('columnDetailsB') }}</h6>
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
                                        {{ $root.t('constraints') }} <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'constraints') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'constraints')">
                                        <!-- 只在数据库A中的约束 -->
                                        <div v-if="table.constraints.onlyInA && table.constraints.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">{{ $root.t('onlyInA') }}</div>
                                            <div v-for="con in table.constraints.onlyInA" :key="con.constraint_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ con.constraint_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的约束 -->
                                        <div v-if="table.constraints.onlyInB && table.constraints.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">{{ $root.t('onlyInB') }}</div>
                                            <div v-for="con in table.constraints.onlyInB" :key="con.constraint_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ con.constraint_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的约束 -->
                                        <div v-if="table.constraints.inBoth && table.constraints.inBoth.length > 0">
                                            <div>{{ $root.t('inBoth') }}</div>
                                            <div v-for="con in table.constraints.inBoth" :key="con.constraint_name" class="column-comparison" :class="getDiffClass(con.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-constraints', getObjectKey(con))" class="expand-collapse-btn">
                                                    {{ con.constraint_name }}
                                                    <span v-if="con.hasDifferences" class="badge bg-warning ms-2">{{ $root.t('hasDifferences') }}</span>
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
                                                                <h6 class="text-danger">{{ $root.t('columnDetailsA') }}</h6>
                                                                <div v-for="(value, key) in con.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">{{ $root.t('columnDetailsB') }}</h6>
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
                                        {{ $root.t('triggers') }} <span class="float-end">{{ isObjectExpanded(getTableKey(table), 'triggers') ? '▼' : '▶' }}</span>
                                    </h6>
                                    
                                    <div v-if="isObjectExpanded(getTableKey(table), 'triggers')">
                                        <!-- 只在数据库A中的触发器 -->
                                        <div v-if="table.triggers.onlyInA && table.triggers.onlyInA.length > 0" class="mb-2">
                                            <div class="text-danger">{{ $root.t('onlyInA') }}</div>
                                            <div v-for="trig in table.triggers.onlyInA" :key="trig.trigger_name" class="column-comparison" :class="getDiffClass('onlyInA')">
                                                {{ trig.trigger_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 只在数据库B中的触发器 -->
                                        <div v-if="table.triggers.onlyInB && table.triggers.onlyInB.length > 0" class="mb-2">
                                            <div class="text-primary">{{ $root.t('onlyInB') }}</div>
                                            <div v-for="trig in table.triggers.onlyInB" :key="trig.trigger_name" class="column-comparison" :class="getDiffClass('onlyInB')">
                                                {{ trig.trigger_name }}
                                            </div>
                                        </div>
                                        
                                        <!-- 两个数据库中都存在的触发器 -->
                                        <div v-if="table.triggers.inBoth && table.triggers.inBoth.length > 0">
                                            <div>{{ $root.t('inBoth') }}</div>
                                            <div v-for="trig in table.triggers.inBoth" :key="trig.trigger_name" class="column-comparison" :class="getDiffClass(trig.hasDifferences ? 'different' : 'same')">
                                                <div @click="toggleObject(getTableKey(table) + '-triggers', getObjectKey(trig))" class="expand-collapse-btn">
                                                    {{ trig.trigger_name }}
                                                    <span v-if="trig.hasDifferences" class="badge bg-warning ms-2">{{ $root.t('hasDifferences') }}</span>
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
                                                                <h6 class="text-danger">{{ $root.t('columnDetailsA') }}</h6>
                                                                <div v-for="(value, key) in trig.detailsA" :key="'a-'+key" class="mb-1">
                                                                    <strong>{{ key }}:</strong> {{ value }}
                                                                </div>
                                                            </div>
                                                            <div class="col-6">
                                                                <h6 class="text-primary">{{ $root.t('columnDetailsB') }}</h6>
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
                <h6>{{ $root.t('storedProcedures') }}</h6>
                
                <!-- 只在数据库A中的存储过程 -->
                <div v-if="result.storedProcedures.onlyInA && result.storedProcedures.onlyInA.length > 0" class="mb-3">
                    <h6 class="text-danger">{{ $root.t('onlyInA') }}</h6>
                    <div v-for="proc in result.storedProcedures.onlyInA" :key="proc.procedure_name" class="mb-2 p-2" :class="getDiffClass('onlyInA')">
                        {{ proc.procedure_name }}
                    </div>
                </div>
                
                <!-- 只在数据库B中的存储过程 -->
                <div v-if="result.storedProcedures.onlyInB && result.storedProcedures.onlyInB.length > 0" class="mb-3">
                    <h6 class="text-primary">{{ $root.t('onlyInB') }}</h6>
                    <div v-for="proc in result.storedProcedures.onlyInB" :key="proc.procedure_name" class="mb-2 p-2" :class="getDiffClass('onlyInB')">
                        {{ proc.procedure_name }}
                    </div>
                </div>
                
                <!-- 两个数据库中都存在的存储过程 -->
                <div v-if="result.storedProcedures.inBoth && result.storedProcedures.inBoth.length > 0">
                    <h6>{{ $root.t('inBoth') }}</h6>
                    <div v-for="proc in result.storedProcedures.inBoth" :key="proc.procedure_name" class="mb-3 p-2" :class="getDiffClass(proc.hasDifferences ? 'different' : 'same')">
                        <div @click="toggleObject('storedProcedures', getObjectKey(proc))" class="expand-collapse-btn">
                            {{ proc.procedure_name }}
                            <span v-if="proc.hasDifferences" class="badge bg-warning ms-2">{{ $root.t('hasDifferences') }}</span>
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
                                        <h6 class="text-danger">{{ $root.t('columnDetailsA') }}</h6>
                                        <div v-for="(value, key) in proc.detailsA" :key="'a-'+key" class="mb-1">
                                            <strong>{{ key }}:</strong> {{ value }}
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <h6 class="text-primary">{{ $root.t('columnDetailsB') }}</h6>
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
            languageState: window.languageState || { currentLanguage: 'en', t: (key) => key },
            dbAConfig: null,
            dbBConfig: null,
            connectionsValid: false,
            isTesting: false,
            isComparing: false,
            isConnectionPanelExpanded: true, // 控制数据库连接配置区域的展开/收起状态
            isScopePanelExpanded: false,    // 控制比较范围选择区域的展开/收起状态，默认折叠
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
    computed: {
        currentLanguage() {
            return this.languageState.currentLanguage;
        }
    },
    mounted() {
        // 初始化Toast - 使用nextTick确保DOM已经更新
        this.$nextTick(() => {
            if (this.$refs.errorToast && this.$refs.successToast) {
                this.errorToast = new bootstrap.Toast(this.$refs.errorToast);
                this.successToast = new bootstrap.Toast(this.$refs.successToast);
            }
            
            // 初始化语言切换功能
            this.initLanguageSwitcher();
        });
        
        // 监听语言变化事件
        window.addEventListener('languageChanged', (event) => {
            this.updateUILanguage();
        });
        
        // 初始化语言状态
        this.languageState.currentLanguage = window.i18n.getCurrentLanguage();
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
                    this.showError(this.$root.t('errorConfigNotExists'));
                    return;
                }
                
                // 检查必填字段
                const requiredFields = ['host', 'username', 'password', 'database'];
                const missingFieldsA = requiredFields.filter(field => !this.dbAConfig[field]);
                const missingFieldsB = requiredFields.filter(field => !this.dbBConfig[field]);
                
                if (missingFieldsA.length > 0 || missingFieldsB.length > 0) {
                    let errorMsg = this.$root.t('incompleteConfig') + '：';
                    if (missingFieldsA.length > 0) {
                        errorMsg += `${this.$root.t('dbAMissingFields')} ${missingFieldsA.join(', ')}. `;
                    }
                    if (missingFieldsB.length > 0) {
                        errorMsg += `${this.$root.t('dbBMissingFields')} ${missingFieldsB.join(', ')}. `;
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
                    this.showError(`${this.$root.t('dbAConnectionFailed')}: ${resultA.message}`);
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
                    this.showError(`${this.$root.t('dbBConnectionFailed')}: ${resultB.message}`);
                    return;
                }
                
                this.showSuccess(this.$root.t('bothConnectionsSuccess'));
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
                    this.showSuccess(this.$root.t('comparisonComplete'));
                } else {
                    this.showError(`${this.$root.t('comparisonFailed')}: ${result.message}`);
                }
            } catch (error) {
                this.showError(`${this.$root.t('comparisonFailed')}: ${error.message}`);
            } finally {
                this.isComparing = false;
            }
        },

        async compareSingleTable(schemaName, tableName) {
            this.isComparing = true;
            try {
                const response = await fetch('/api/compare-single-table', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dbAConfig: this.dbAConfig,
                        dbBConfig: this.dbBConfig,
                        schemaName: schemaName,
                        tableName: tableName,
                        comparisonScope: this.comparisonScope
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    // 更新比较结果中对应的表
                    if (this.comparisonResult && this.comparisonResult.tables && this.comparisonResult.tables.inBoth) {
                        const tableIndex = this.comparisonResult.tables.inBoth.findIndex(
                            table => table.schemaName === schemaName && table.tableName === tableName
                        );
                        
                        if (tableIndex !== -1) {
                            // 更新表比较结果
                            this.comparisonResult.tables.inBoth[tableIndex] = result.comparisonResult.table;
                            this.showSuccess(this.$root.t('tableComparisonComplete').replace('{table}', `${schemaName}.${tableName}`));
                        }
                    }
                } else {
                    this.showError(`${this.$root.t('tableComparisonFailed')}: ${result.message}`);
                }
            } catch (error) {
                this.showError(`${this.$root.t('tableComparisonFailed')}: ${error.message}`);
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
        },
        
        toggleScopePanel() {
            this.isScopePanelExpanded = !this.isScopePanelExpanded;
        },
        
        // 初始化语言切换器
        initLanguageSwitcher() {
            const languageDropdown = document.getElementById('languageDropdown');
            const currentLanguageSpan = document.getElementById('currentLanguage');
            const dropdownItems = document.querySelectorAll('#languageDropdown + .dropdown-menu .dropdown-item');
            
            // 更新当前语言显示
            if (currentLanguageSpan) {
                const currentLang = window.i18n.getCurrentLanguage();
                currentLanguageSpan.textContent = currentLang === 'en' ? 'English' : '中文';
            }
            
            // 更新Vue实例中的语言状态
            this.languageState.currentLanguage = window.i18n.getCurrentLanguage();
            
            // 添加点击事件监听器
            dropdownItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lang = item.getAttribute('data-lang');
                    if (window.i18n) {
                        window.i18n.setLanguage(lang);
                    }
                });
            });
        },
        
        // 更新UI语言
        updateUILanguage() {
            // 更新页面标题
            document.title = window.i18n.t('title');
            
            // 更新导航栏品牌
            const navbarBrand = document.querySelector('.navbar-brand');
            if (navbarBrand) {
                navbarBrand.textContent = window.i18n.t('navBrand');
            }
            
            // 更新当前语言显示
            const currentLanguageSpan = document.getElementById('currentLanguage');
            if (currentLanguageSpan) {
                const currentLang = window.i18n.getCurrentLanguage();
                currentLanguageSpan.textContent = currentLang === 'en' ? 'English' : '中文';
            }
            
            // 更新HTML lang属性
            document.documentElement.lang = window.i18n.getCurrentLanguage();
            
            // 更新Vue实例中的语言状态
            this.languageState.currentLanguage = window.i18n.getCurrentLanguage();
        },
        
        // 获取翻译文本的辅助方法
        t(key) {
            return this.languageState ? this.languageState.t(key) : (window.i18n ? window.i18n.t(key) : key);
        }
    }
});

app.mount('#app');
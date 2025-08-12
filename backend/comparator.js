import { DatabaseConnection } from './database.js';

export class DatabaseComparator {
  constructor() {
    this.dbA = null;
    this.dbB = null;
  }

  // 初始化数据库连接
  async initialize(dbAConfig, dbBConfig) {
    this.dbA = new DatabaseConnection(dbAConfig);
    this.dbB = new DatabaseConnection(dbBConfig);
    
    const connectionA = await this.dbA.connect();
    if (!connectionA.success) {
      throw new Error(`Failed to connect to database A: ${connectionA.message}`);
    }
    
    const connectionB = await this.dbB.connect();
    if (!connectionB.success) {
      await this.dbB.disconnect();
      throw new Error(`Failed to connect to database B: ${connectionB.message}`);
    }
    
    return { success: true, message: 'Connected to both databases successfully' };
  }

  // 关闭数据库连接
  async disconnect() {
    if (this.dbA) {
      await this.dbA.disconnect();
    }
    if (this.dbB) {
      await this.dbB.disconnect();
    }
  }

  // 比较两个数据库
  async compareDatabases(comparisonScope) {
    try {
      // 获取两个数据库的完整结构
      const dbAStructure = await this.dbA.getFullDatabaseStructure(comparisonScope);
      const dbBStructure = await this.dbB.getFullDatabaseStructure(comparisonScope);
      
      // 比较数据库基本信息
      const databaseInfoComparison = this.compareDatabaseInfo(dbAStructure.databaseInfo, dbBStructure.databaseInfo);
      
      // 比较表结构
      const tablesComparison = this.compareTables(dbAStructure.tables, dbBStructure.tables, comparisonScope);
      
      // 比较存储过程
      let storedProceduresComparison = null;
      if (comparisonScope.storedProcedures || comparisonScope.all) {
        storedProceduresComparison = this.compareStoredProcedures(
          dbAStructure.storedProcedures || [], 
          dbBStructure.storedProcedures || []
        );
      }
      
      return {
        databaseInfo: databaseInfoComparison,
        tables: tablesComparison,
        storedProcedures: storedProceduresComparison
      };
    } catch (error) {
      throw new Error(`Failed to compare databases: ${error.message}`);
    }
  }

  // 比较数据库基本信息
  compareDatabaseInfo(dbAInfo, dbBInfo) {
    const differences = [];
    const similarities = [];
    
    const fields = ['name', 'collation_name', 'compatibility_level', 'user_access_desc', 'state_desc', 'recovery_model_desc', 'page_verify_option_desc'];
    
    for (const field of fields) {
      if (dbAInfo[field] !== dbBInfo[field]) {
        differences.push({
          field,
          valueA: dbAInfo[field],
          valueB: dbBInfo[field],
          status: 'different'
        });
      } else {
        similarities.push({
          field,
          value: dbAInfo[field],
          status: 'same'
        });
      }
    }
    
    return {
      differences,
      similarities
    };
  }

  // 比较表结构
  compareTables(tablesA, tablesB, comparisonScope) {
    const result = {
      onlyInA: [],
      onlyInB: [],
      inBoth: []
    };
    
    // 创建表名映射，便于查找
    const tableMapA = new Map();
    const tableMapB = new Map();
    
    for (const table of tablesA) {
      const key = `${table.schemaName}.${table.tableName}`;
      tableMapA.set(key, table);
    }
    
    for (const table of tablesB) {
      const key = `${table.schemaName}.${table.tableName}`;
      tableMapB.set(key, table);
    }
    
    // 找出只在数据库A中的表
    for (const [key, tableA] of tableMapA) {
      if (!tableMapB.has(key)) {
        result.onlyInA.push({
          schemaName: tableA.schemaName,
          tableName: tableA.tableName,
          status: 'onlyInA'
        });
      }
    }
    
    // 找出只在数据库B中的表
    for (const [key, tableB] of tableMapB) {
      if (!tableMapA.has(key)) {
        result.onlyInB.push({
          schemaName: tableB.schemaName,
          tableName: tableB.tableName,
          status: 'onlyInB'
        });
      }
    }
    
    // 比较两个数据库中都存在的表
    for (const [key, tableA] of tableMapA) {
      if (tableMapB.has(key)) {
        const tableB = tableMapB.get(key);
        const tableComparison = this.compareTable(tableA, tableB, comparisonScope);
        result.inBoth.push(tableComparison);
      }
    }
    
    return result;
  }

  // 比较单个表的结构
  compareTable(tableA, tableB, comparisonScope) {
    const result = {
      schemaName: tableA.schemaName,
      tableName: tableA.tableName,
      status: 'inBoth',
      hasDifferences: false,
      columns: { onlyInA: [], onlyInB: [], inBoth: [] },
      primaryKeys: { onlyInA: [], onlyInB: [], inBoth: [] },
      foreignKeys: { onlyInA: [], onlyInB: [], inBoth: [] },
      indexes: { onlyInA: [], onlyInB: [], inBoth: [] },
      constraints: { onlyInA: [], onlyInB: [], inBoth: [] },
      triggers: { onlyInA: [], onlyInB: [], inBoth: [] }
    };
    
    // 比较列
    if (comparisonScope.fields || comparisonScope.all) {
      const columnsComparison = this.compareTableObjects(tableA.columns, tableB.columns, 'column_name');
      result.columns = columnsComparison;
      if (columnsComparison.inBoth.some(col => col.hasDifferences)) {
        result.hasDifferences = true;
      }
    }
    
    // 比较主键
    if (comparisonScope.primaryKeys || comparisonScope.all) {
      const primaryKeysComparison = this.compareTableObjects(tableA.primaryKeys, tableB.primaryKeys, 'column_name');
      result.primaryKeys = primaryKeysComparison;
      if (primaryKeysComparison.inBoth.some(pk => pk.hasDifferences)) {
        result.hasDifferences = true;
      }
    }
    
    // 比较外键
    if (comparisonScope.foreignKeys || comparisonScope.all) {
      const foreignKeysComparison = this.compareTableObjects(tableA.foreignKeys, tableB.foreignKeys, 'constraint_name');
      result.foreignKeys = foreignKeysComparison;
      if (foreignKeysComparison.inBoth.some(fk => fk.hasDifferences)) {
        result.hasDifferences = true;
      }
    }
    
    // 比较索引
    if (comparisonScope.indexes || comparisonScope.all) {
      const indexesComparison = this.compareTableObjects(tableA.indexes, tableB.indexes, 'index_name');
      result.indexes = indexesComparison;
      if (indexesComparison.inBoth.some(idx => idx.hasDifferences)) {
        result.hasDifferences = true;
      }
    }
    
    // 比较约束
    if (comparisonScope.constraints || comparisonScope.all) {
      const constraintsComparison = this.compareTableObjects(tableA.constraints, tableB.constraints, 'constraint_name');
      result.constraints = constraintsComparison;
      if (constraintsComparison.inBoth.some(con => con.hasDifferences)) {
        result.hasDifferences = true;
      }
    }
    
    // 比较触发器
    if (comparisonScope.triggers || comparisonScope.all) {
      const triggersComparison = this.compareTableObjects(tableA.triggers, tableB.triggers, 'trigger_name');
      result.triggers = triggersComparison;
      if (triggersComparison.inBoth.some(trig => trig.hasDifferences)) {
        result.hasDifferences = true;
      }
    }
    
    return result;
  }

  // 比较表中的对象（列、主键、外键等）
  compareTableObjects(objectsA, objectsB, keyField) {
    const result = {
      onlyInA: [],
      onlyInB: [],
      inBoth: []
    };
    
    // 确保objectsA和objectsB是数组
    const arrayA = Array.isArray(objectsA) ? objectsA : [];
    const arrayB = Array.isArray(objectsB) ? objectsB : [];
    
    // 创建对象映射，便于查找
    const objectMapA = new Map();
    const objectMapB = new Map();
    
    for (const obj of arrayA) {
      if (obj && obj[keyField]) {
        objectMapA.set(obj[keyField], obj);
      }
    }
    
    for (const obj of arrayB) {
      if (obj && obj[keyField]) {
        objectMapB.set(obj[keyField], obj);
      }
    }
    
    // 找出只在数据库A中的对象
    for (const [key, objA] of objectMapA) {
      if (!objectMapB.has(key)) {
        result.onlyInA.push({
          ...objA,
          status: 'onlyInA'
        });
      }
    }
    
    // 找出只在数据库B中的对象
    for (const [key, objB] of objectMapB) {
      if (!objectMapA.has(key)) {
        result.onlyInB.push({
          ...objB,
          status: 'onlyInB'
        });
      }
    }
    
    // 比较两个数据库中都存在的对象
    for (const [key, objA] of objectMapA) {
      if (objectMapB.has(key)) {
        const objB = objectMapB.get(key);
        const objectComparison = this.compareObject(objA, objB);
        result.inBoth.push(objectComparison);
      }
    }
    
    return result;
  }

  // 比较单个对象的属性
  compareObject(objA, objB) {
    // 创建结果对象，保留objA的所有属性
    const result = {
      ...objA,
      hasDifferences: false,
      differences: [],
      similarities: [],
      // 添加对象B的详细属性，以便前端可以访问
      detailsA: {...objA},
      detailsB: {...objB}
    };
    
    // 获取所有属性
    const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
    
    for (const key of allKeys) {
      // 跳过状态字段
      if (key === 'status' || key === 'hasDifferences' || key === 'differences' || key === 'similarities' || key === 'detailsA' || key === 'detailsB') {
        continue;
      }
      
      const valueA = objA[key];
      const valueB = objB[key];
      
      if (valueA !== valueB) {
        result.differences.push({
          field: key,
          valueA,
          valueB
        });
        result.hasDifferences = true;
      } else {
        result.similarities.push({
          field: key,
          value: valueA
        });
      }
    }
    
    // 确保即使没有差异，也返回对象的完整信息
    // 这对于前端显示相同对象的详细信息很重要
    return result;
  }

  // 比较存储过程
  compareStoredProcedures(proceduresA, proceduresB) {
    const result = {
      onlyInA: [],
      onlyInB: [],
      inBoth: []
    };
    
    // 创建存储过程映射，便于查找
    const procedureMapA = new Map();
    const procedureMapB = new Map();
    
    for (const proc of proceduresA) {
      procedureMapA.set(proc.procedure_name, proc);
    }
    
    for (const proc of proceduresB) {
      procedureMapB.set(proc.procedure_name, proc);
    }
    
    // 找出只在数据库A中的存储过程
    for (const [name, procA] of procedureMapA) {
      if (!procedureMapB.has(name)) {
        result.onlyInA.push({
          ...procA,
          status: 'onlyInA'
        });
      }
    }
    
    // 找出只在数据库B中的存储过程
    for (const [name, procB] of procedureMapB) {
      if (!procedureMapA.has(name)) {
        result.onlyInB.push({
          ...procB,
          status: 'onlyInB'
        });
      }
    }
    
    // 比较两个数据库中都存在的存储过程
    for (const [name, procA] of procedureMapA) {
      if (procedureMapB.has(name)) {
        const procB = procedureMapB.get(name);
        const procedureComparison = this.compareObject(procA, procB);
        result.inBoth.push(procedureComparison);
      }
    }
    
    return result;
  }
}
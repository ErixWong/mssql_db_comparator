import sql from 'mssql';

// 数据库连接配置
export class DatabaseConnection {
  constructor(config) {
    this.config = {
      server: config.host,
      user: config.username,
      password: config.password,
      database: config.database,
      port: config.port || 1433,
      options: {
        encrypt: config.encrypt || false,
        trustServerCertificate: true,
        enableArithAbort: true,
        instanceName: config.instanceName || '',
        requestTimeout: config.timeout ? config.timeout * 1000 : 15000, // 将秒转换为毫秒
      },
    };
    this.pool = null;
  }

  // 连接到数据库
  async connect() {
    try {
      // 使用新的连接池而不是全局单例
      this.pool = new sql.ConnectionPool(this.config);
      await this.pool.connect();
      return { success: true, message: 'Connected to database successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 断开数据库连接
  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
      }
      return { success: true, message: 'Disconnected from database' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 测试连接
  async testConnection() {
    try {
      let res = await this.connect();
      if (!res.success) { throw res; }
      const result = await this.pool.request().query(`SELECT 1 AS test`);
      await this.disconnect();
      return { success: true, message: 'Connection test successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 获取数据库中的所有表
  async getTables() {
    try {
      const result = await this.pool.request().query(`
        SELECT 
          t.name AS table_name,
          s.name AS schema_name
        FROM 
          sys.tables t
        INNER JOIN 
          sys.schemas s ON t.schema_id = s.schema_id
        ORDER BY 
          s.name, t.name
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Failed to get tables: ${error.message}`);
    }
  }

  // 获取表的列信息
  async getColumns(schemaName, tableName) {
    try {

      //let res = await this.pool.request().query('SELECT DB_NAME() AS CurrentDatabase');
      //console.log(JSON.stringify(res));

      let sql = `
        SELECT 
          c.name AS column_name,
          t.name AS data_type,
          c.max_length,
          c.precision,
          c.scale,
          c.is_nullable,
          c.column_id,
          c.default_object_id,
          OBJECT_DEFINITION(c.default_object_id) AS default_value,
          c.is_identity,
          ic.is_identity AS is_identity_column,
          ic.seed_value,
          ic.increment_value
        FROM 
          sys.columns c
        INNER JOIN 
          sys.types t ON c.user_type_id = t.user_type_id
        LEFT JOIN 
          sys.identity_columns ic ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE 
          c.object_id = OBJECT_ID('${schemaName}.${tableName}')
        ORDER BY 
          c.column_id
      `;

      const result = await this.pool.request().query(sql);

      //console.log(sql)

      return result.recordset;
    } catch (error) {
      throw new Error(`Failed to get columns for ${schemaName}.${tableName}: ${error.message}`);
    }
  }

  // 获取主键信息
  async getPrimaryKeys(schemaName, tableName) {
    try {
      const result = await this.pool.request().query(`
        SELECT 
          c.name AS column_name,
          i.name AS index_name
        FROM 
          sys.indexes i
        INNER JOIN 
          sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN 
          sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE 
          i.is_primary_key = 1
          AND i.object_id = OBJECT_ID('${schemaName}.${tableName}')
        ORDER BY 
          ic.key_ordinal
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Failed to get primary keys for ${schemaName}.${tableName}: ${error.message}`);
    }
  }

  // 获取外键信息
  async getForeignKeys(schemaName, tableName) {
    try {
      const result = await this.pool.request().query(`
        SELECT 
          f.name AS constraint_name,
          OBJECT_NAME(f.parent_object_id) AS table_name,
          COL_NAME(fc.parent_object_id, fc.parent_column_id) AS column_name,
          OBJECT_NAME(f.referenced_object_id) AS referenced_table_name,
          COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS referenced_column_name,
          f.update_referential_action_desc,
          f.delete_referential_action_desc
        FROM 
          sys.foreign_keys f
        INNER JOIN 
          sys.foreign_key_columns fc ON f.object_id = fc.constraint_object_id
        WHERE 
          f.parent_object_id = OBJECT_ID('${schemaName}.${tableName}')
        ORDER BY 
          f.name
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Failed to get foreign keys for ${schemaName}.${tableName}: ${error.message}`);
    }
  }

  // 获取索引信息
  async getIndexes(schemaName, tableName) {
    try {
      const result = await this.pool.request().query(`
        SELECT 
          i.name AS index_name,
          i.type_desc,
          i.is_unique,
          i.is_primary_key,
          i.is_unique_constraint,
          STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS column_names
        FROM 
          sys.indexes i
        INNER JOIN 
          sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN 
          sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE 
          i.object_id = OBJECT_ID('${schemaName}.${tableName}')
        GROUP BY 
          i.name, i.type_desc, i.is_unique, i.is_primary_key, i.is_unique_constraint
        ORDER BY 
          i.name
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Failed to get indexes for ${schemaName}.${tableName}: ${error.message}`);
    }
  }

  // 获取约束信息
  async getConstraints(schemaName, tableName) {
    try {
      const result = await this.pool.request().query(`
        SELECT 
          c.name AS constraint_name,
          c.type_desc,
          CAST(1 AS bit) AS is_enabled, -- 默认启用
          c.is_system_named,
          OBJECT_NAME(c.parent_object_id) AS table_name
        FROM 
          sys.check_constraints c
        WHERE 
          c.parent_object_id = OBJECT_ID('${schemaName}.${tableName}')
        UNION ALL
        SELECT 
          c.name AS constraint_name,
          c.type_desc,
          CAST(1 AS bit) AS is_enabled, -- 默认启用
          c.is_system_named,
          OBJECT_NAME(c.parent_object_id) AS table_name
        FROM 
          sys.default_constraints c
        WHERE 
          c.parent_object_id = OBJECT_ID('${schemaName}.${tableName}')
        ORDER BY 
          constraint_name
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Failed to get constraints for ${schemaName}.${tableName}: ${error.message}`);
    }
  }

  // 获取触发器信息
  async getTriggers(schemaName, tableName) {
    try {
      const result = await this.pool.request().query(`
        SELECT 
          t.name AS trigger_name,
          t.is_instead_of_trigger,
          t.is_disabled,
          OBJECT_DEFINITION(t.object_id) AS trigger_definition
        FROM 
          sys.triggers t
        WHERE 
          t.parent_id = OBJECT_ID('${schemaName}.${tableName}')
        ORDER BY 
          t.name
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Failed to get triggers for ${schemaName}.${tableName}: ${error.message}`);
    }
  }

  // 获取存储过程信息
  async getStoredProcedures() {
    try {
      const result = await this.pool.request().query(`
        SELECT 
          s.name AS procedure_name,
          s.type_desc,
          OBJECT_DEFINITION(s.object_id) AS procedure_definition,
          s.create_date,
          s.modify_date
        FROM 
          sys.procedures s
        WHERE 
          s.is_ms_shipped = 0
        ORDER BY 
          s.name
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Failed to get stored procedures: ${error.message}`);
    }
  }

  // 获取数据库信息
  async getDatabaseInfo() {
    try {
      const result = await this.pool.request().query(`
        SELECT 
          name,
          collation_name,
          compatibility_level,
          user_access_desc,
          state_desc,
          recovery_model_desc,
          page_verify_option_desc
        FROM 
          sys.databases
        WHERE 
          name = DB_NAME()
      `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Failed to get database info: ${error.message}`);
    }
  }

  // 获取完整的数据库结构
  async getFullDatabaseStructure(comparisonScope) {
    try {
      const structure = {
        databaseInfo: await this.getDatabaseInfo(),
        tables: []
      };

      if (comparisonScope.tables || comparisonScope.all) {
        const tables = await this.getTables();

        for (const table of tables) {
          console.log( tables.length,"/", 1 + tables.indexOf(table), table.table_name);
          if (!table.schema_name || !table.table_name) {
            console.warn(`跳过无效表: ${JSON.stringify(table)}`);
            continue;
          }

          try {
            const tableStructure = {
              schemaName: table.schema_name,
              tableName: table.table_name,
              columns: [],
              primaryKeys: [],
              foreignKeys: [],
              indexes: [],
              constraints: [],
              triggers: []
            };

            if (comparisonScope.fields || comparisonScope.all) {
              try {
                tableStructure.columns = await this.getColumns(table.schema_name, table.table_name);
              } catch (error) {
                console.error(`获取表 ${table.schema_name}.${table.table_name} 的列信息失败: ${error.message}`);
                tableStructure.columns = [];
              }
            }

            if (comparisonScope.primaryKeys || comparisonScope.all) {
              try {
                tableStructure.primaryKeys = await this.getPrimaryKeys(table.schema_name, table.table_name);
              } catch (error) {
                console.error(`获取表 ${table.schema_name}.${table.table_name} 的主键信息失败: ${error.message}`);
                tableStructure.primaryKeys = [];
              }
            }

            if (comparisonScope.foreignKeys || comparisonScope.all) {
              try {
                tableStructure.foreignKeys = await this.getForeignKeys(table.schema_name, table.table_name);
              } catch (error) {
                console.error(`获取表 ${table.schema_name}.${table.table_name} 的外键信息失败: ${error.message}`);
                tableStructure.foreignKeys = [];
              }
            }

            if (comparisonScope.indexes || comparisonScope.all) {
              try {
                tableStructure.indexes = await this.getIndexes(table.schema_name, table.table_name);
              } catch (error) {
                console.error(`获取表 ${table.schema_name}.${table.table_name} 的索引信息失败: ${error.message}`);
                tableStructure.indexes = [];
              }
            }

            if (comparisonScope.constraints || comparisonScope.all) {
              try {
                tableStructure.constraints = await this.getConstraints(table.schema_name, table.table_name);
              } catch (error) {
                console.error(`获取表 ${table.schema_name}.${table.table_name} 的约束信息失败: ${error.message}`);
                tableStructure.constraints = [];
              }
            }

            if (comparisonScope.triggers || comparisonScope.all) {
              try {
                tableStructure.triggers = await this.getTriggers(table.schema_name, table.table_name);
              } catch (error) {
                console.error(`获取表 ${table.schema_name}.${table.table_name} 的触发器信息失败: ${error.message}`);
                tableStructure.triggers = [];
              }
            }

            structure.tables.push(tableStructure);
          } catch (error) {
            console.error(`处理表 ${table.schema_name}.${table.name} 时出错: ${error.message}`);
          }
        }
      }

      if (comparisonScope.storedProcedures || comparisonScope.all) {
        try {
          structure.storedProcedures = await this.getStoredProcedures();
        } catch (error) {
          console.error(`获取存储过程信息失败: ${error.message}`);
          structure.storedProcedures = [];
        }
      }

      return structure;
    } catch (error) {
      console.error(`获取数据库结构失败: ${error.message}`);
      throw new Error(`Failed to get full database structure: ${error.message}`);
    }
  }

  // 获取单个表的结构
  async getTableStructure(schemaName, tableName, comparisonScope) {
    try {
      const tableStructure = {
        schemaName: schemaName,
        tableName: tableName,
        columns: [],
        primaryKeys: [],
        foreignKeys: [],
        indexes: [],
        constraints: [],
        triggers: []
      };

      if (comparisonScope.fields || comparisonScope.all) {
        try {
          tableStructure.columns = await this.getColumns(schemaName, tableName);
        } catch (error) {
          console.error(`获取表 ${schemaName}.${tableName} 的列信息失败: ${error.message}`);
          tableStructure.columns = [];
        }
      }

      if (comparisonScope.primaryKeys || comparisonScope.all) {
        try {
          tableStructure.primaryKeys = await this.getPrimaryKeys(schemaName, tableName);
        } catch (error) {
          console.error(`获取表 ${schemaName}.${tableName} 的主键信息失败: ${error.message}`);
          tableStructure.primaryKeys = [];
        }
      }

      if (comparisonScope.foreignKeys || comparisonScope.all) {
        try {
          tableStructure.foreignKeys = await this.getForeignKeys(schemaName, tableName);
        } catch (error) {
          console.error(`获取表 ${schemaName}.${tableName} 的外键信息失败: ${error.message}`);
          tableStructure.foreignKeys = [];
        }
      }

      if (comparisonScope.indexes || comparisonScope.all) {
        try {
          tableStructure.indexes = await this.getIndexes(schemaName, tableName);
        } catch (error) {
          console.error(`获取表 ${schemaName}.${tableName} 的索引信息失败: ${error.message}`);
          tableStructure.indexes = [];
        }
      }

      if (comparisonScope.constraints || comparisonScope.all) {
        try {
          tableStructure.constraints = await this.getConstraints(schemaName, tableName);
        } catch (error) {
          console.error(`获取表 ${schemaName}.${tableName} 的约束信息失败: ${error.message}`);
          tableStructure.constraints = [];
        }
      }

      if (comparisonScope.triggers || comparisonScope.all) {
        try {
          tableStructure.triggers = await this.getTriggers(schemaName, tableName);
        } catch (error) {
          console.error(`获取表 ${schemaName}.${tableName} 的触发器信息失败: ${error.message}`);
          tableStructure.triggers = [];
        }
      }

      return tableStructure;
    } catch (error) {
      console.error(`获取表 ${schemaName}.${tableName} 结构失败: ${error.message}`);
      throw new Error(`Failed to get table structure for ${schemaName}.${tableName}: ${error.message}`);
    }
  }
}
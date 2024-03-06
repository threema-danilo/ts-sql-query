/*
 * All symbols defined here are expected to don't have value
 */

// Type marks
export const isValueSourceObject: unique symbol = Symbol('isValueSourceObject')
export const isColumnObject: unique symbol = Symbol('isColumnObject')
export const isSelectQueryObject: unique symbol = Symbol('isSelectQueryObject')

// General Symbols
export const type: unique symbol = Symbol('type')
export const database: unique symbol = Symbol('database')
export const tableOrView: unique symbol = Symbol('tableOrView')
export const tableOrViewRef: unique symbol = Symbol('tableOrViewRef')
export const tableOrViewRefType: unique symbol = Symbol('tableOrViewRef')
export const tableOrViewCustomName: unique symbol = Symbol('tableOrViewCustomName')
export const resultType: unique symbol = Symbol('resultType')
export const columnsType: unique symbol = Symbol('columnsType')
export const compoundableColumns: unique symbol = Symbol('compoundableColumns')
export const rawFragment: unique symbol = Symbol('rawFragment')
export const resolvedShape: unique symbol = Symbol('resolvedShape')

// Expressions
export const requiredTableOrView: unique symbol = Symbol('requiredTableOrView')

// Tables or Views
export const tableName: unique symbol = Symbol('tableName')
export const viewName: unique symbol = Symbol('viewName')
export const tableOrViewAlias: unique symbol = Symbol('tableOrViewAlias')
export const noTableOrViewRequired: unique symbol = Symbol('noTableOrViewRequiredType')
export const outerJoinDatabase: unique symbol = Symbol('outerJoinDatabase')
export const outerJoinTableOrView: unique symbol = Symbol('outerJoinTableOrView')
export const outerJoinAlias: unique symbol = Symbol('outerJoinAlias')
export const oldValues: unique symbol = Symbol('oldValues')
export const valuesForInsert: unique symbol = Symbol('valuesForInsert')

// Columns
export const valueType: unique symbol = Symbol('valueType')
export const optionalType: unique symbol = Symbol('optionalType')
export const hasDefaultValue: unique symbol = Symbol('hasDefaultValue')
export const optionalValue: unique symbol = Symbol('optionalValue')
export const autogeneratedPrimaryKeyValue: unique symbol = Symbol('autogeneratedPrimaryKeyValue')
export const primaryKeyValue: unique symbol = Symbol('primaryKeyValue')
export const computedValue: unique symbol = Symbol('computedValue')

// Connection
export const databaseName: unique symbol = Symbol('databaseName')

// Database type
export const anyDBType: unique symbol = Symbol('anyDBType')
export const mariaDBType: unique symbol = Symbol('mariaDBType')
export const mySqlType: unique symbol = Symbol('mySqlType')
export const noopDBType: unique symbol = Symbol('noopDBType')
export const oracleType: unique symbol = Symbol('oracleType')
export const postgreSqlType: unique symbol = Symbol('postgreSqlType')
export const sqliteType: unique symbol = Symbol('sqliteType')
export const sqlServerType: unique symbol = Symbol('sqlServerType')

export const nextMethodNotSupportedByThisConnection: unique symbol = Symbol('nextMethodNotSupportedByThisConnection') 

// Value source type
export const valueSourceType: unique symbol = Symbol('valueSourceType')
export const valueSourceTypeName: unique symbol = Symbol('valueSourceTypeName')
export const nullableValueSourceType: unique symbol = Symbol('nullableValueSourceType')
export const equalableValueSourceType: unique symbol = Symbol('equalableValueSourceType')
export const comparableValueSourceType: unique symbol = Symbol('comparableValueSourceType')
export const booleanValueSourceType: unique symbol = Symbol('booleanValueSourceType')
export const ifValueSourceType: unique symbol = Symbol('ifValueSourceType')
export const anyBooleanValueSourceType: unique symbol = Symbol('anyBooleanValueSourceType')
export const numberValueSourceType: unique symbol = Symbol('numberValueSourceType')
export const bigintValueSourceType: unique symbol = Symbol('bigintValueSourceType')
export const customIntValueSourceType: unique symbol = Symbol('customIntValueSourceType')
export const customDoubleValueSourceType: unique symbol = Symbol('customDoubleValueSourceType')
export const stringValueSourceType: unique symbol = Symbol('stringValueSourceType')
export const uuidValueSourceType: unique symbol = Symbol('uuidValueSourceType')
export const customUuidValueSourceType: unique symbol = Symbol('customUuidValueSourceType')
export const localDateValueSourceType: unique symbol = Symbol('dateValueSourceType')
export const localTimeValueSourceType: unique symbol = Symbol('timeValueSourceType')
export const localDateTimeValueSourceType: unique symbol = Symbol('dateTimeValueSourceType')
export const customLocalDateValueSourceType: unique symbol = Symbol('customLocalDateValueSourceType')
export const customLocalTimeValueSourceType: unique symbol = Symbol('customLocalTimeValueSourceType')
export const customLocalDateTimeValueSourceType: unique symbol = Symbol('customLocalDateTimeValueSourceType')
export const aggregatedArrayValueSourceType: unique symbol = Symbol('aggregatedArrayValueSourceType')

// Opaque types
export const dontCallConstructor: unique symbol = Symbol('dontCallConstructor')
export const neverUsedSymbol: unique symbol = Symbol('neverUsedSymbol')

// Transaction
export const transactionIsolationLevel: unique symbol = Symbol('transactionIsolationLevel')
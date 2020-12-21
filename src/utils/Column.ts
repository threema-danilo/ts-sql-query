import type { ITableOrView } from "./ITableOrView"
import type { ToSql } from "../sqlBuilders/SqlBuilder"
import type { __ValueSourcePrivate } from "../expressions/values"
import type { autogeneratedPrimaryKeyValue, hasDefaultValue, optionalValue, primaryKeyValue, type } from "./symbols"

export interface Column {
    [type]: 'column'
}

export interface ColumnWithDefaultValue extends Column {
    [hasDefaultValue]: true
}

export interface OptionalColumn extends Column {
    [optionalValue]: true
}

export interface PrimaryKeyAutogeneratedColumn extends Column {
    [autogeneratedPrimaryKeyValue]: true
}

export interface PrimaryKeyColumn extends Column {
    [primaryKeyValue]: true
}

export interface __ColumnPrivate extends __ValueSourcePrivate {
    __isColumn: true
    __name: string
    __table_or_view: ITableOrView<any>
    __isOptional: boolean
    __hasDefault: boolean
    __isPrimaryKey: boolean
    __isAutogeneratedPrimaryKey: boolean
    __sequenceName?: string
}

export function __getColumnPrivate(column: Column): __ColumnPrivate {
    return column as any
}

export function __getColumnOfTable(table: ITableOrView<any>, column: string): (Column & ToSql) | undefined {
    const result = (table as any)[column]
    if (!result) {
        return undefined
    }
    if (typeof result !== 'object') {
        return undefined
    }
    if (result.__isColumn) {
        return result as any
    } else {
        return undefined
    }
}
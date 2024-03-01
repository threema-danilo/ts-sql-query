/*
 * sudo apt-get install build-essential
 * npm install better-sqlite3
 * npm install synchronous-promise
 */

import { Table } from "../Table";
import { assertEquals } from "./assertEquals";
import { ConsoleLogQueryRunner } from "../queryRunners/ConsoleLogQueryRunner";
import { SqliteConnection } from "../connections/SqliteConnection";
// @ts-ignore // TODO: remove when mjs conversion
import type { Database } from '@sqlite.org/sqlite-wasm';
import { SynchronousPromise } from "synchronous-promise";
// import { fromBinaryUUID, toBinaryUUID } from "binary-uuid";
// import { v4 as uuidv4 } from "uuid";
import { SqliteDateTimeFormat, SqliteDateTimeFormatType } from "../connections/SqliteConfiguration";
import { Values } from "../Values";
import { Sqlite3WasmOO1QueryRunner } from "../queryRunners/Sqlite3WasmOO1QueryRunner";

class DBConnection extends SqliteConnection<'DBConnection'> {
    protected compatibilityMode = false
    protected uuidStrategy = 'string' as const

    protected getDateTimeFormat(_type: SqliteDateTimeFormatType): SqliteDateTimeFormat {
        return 'Unix time milliseconds as integer'
    }

    increment(i: number) {
        // Fake implentation for testing purposes
        return this.selectFromNoTable().selectOneColumn(this.const(i, 'int').add(1)).executeSelectOne()
    }
    appendToAllCompaniesName(aditional: string) {
        // Fake implentation for testing purposes
        return this.updateAllowingNoWhere(tCompany).set({
            name: tCompany.name.concat(aditional)
        })
        .executeUpdate()
    }
}

const tCompany = new class TCompany extends Table<DBConnection, 'TCompany'> {
    id = this.autogeneratedPrimaryKey('id', 'int');
    name = this.column('name', 'string');
    parentId = this.optionalColumn('parent_id', 'int');
    constructor() {
        super('company'); // table name in the database
    }
}()

const tCustomer = new class TCustomer extends Table<DBConnection, 'TCustomer'> {
    id = this.autogeneratedPrimaryKey('id', 'int');
    firstName = this.column('first_name', 'string');
    lastName = this.column('last_name', 'string');
    birthday = this.optionalColumn('birthday', 'localDate');
    companyId = this.column('company_id', 'int');
    constructor() {
        super('customer'); // table name in the database
    }
}()

const tRecord = new class TRecord extends Table<DBConnection, 'TRecord'> {
    id = this.primaryKey('id', 'uuid');
    title = this.column('title', 'string');
    constructor() {
        super('record'); // table name in the database
    }
}()

function main(db: Database) {
    const connection = new DBConnection(new ConsoleLogQueryRunner(new Sqlite3WasmOO1QueryRunner(db, { promise: SynchronousPromise })))
    sync(connection.beginTransaction())

    try {
        sync(connection.queryRunner.executeDatabaseSchemaModification(`drop table if exists customer`))
        sync(connection.queryRunner.executeDatabaseSchemaModification(`drop table if exists company`))

        sync(connection.queryRunner.executeDatabaseSchemaModification(`
            create table company (
                id integer primary key autoincrement,
                name varchar(100) not null,
                parent_id int null references company(id)
            )
        `))

        sync(connection.queryRunner.executeDatabaseSchemaModification(`
            create table customer (
                id integer primary key autoincrement,
                first_name varchar(100) not null,
                last_name varchar(100) not null,
                birthday date,
                company_id int not null references company(id)
            )
        `))

        sync(connection.queryRunner.executeDatabaseSchemaModification(`drop table if exists record`))
        sync(connection.queryRunner.executeDatabaseSchemaModification(`
            create table record (
                id blob(16) primary key,
                title varchar(100) not null
            )
        `))

        let i = sync(connection
            .insertInto(tCompany)
            .values({ name: 'ACME' })
            .returningLastInsertedId()
            .executeInsert())
        assertEquals(i, 1)
        
        const companyIdOne = sync(connection.selectFrom(tCompany).where(tCompany.id.in([1])).selectOneColumn(tCompany.id).executeSelectMany())
        assertEquals(companyIdOne, [1])

        const companyIdEmpty = sync(connection.selectFrom(tCompany).where(tCompany.id.in([])).selectOneColumn(tCompany.id).executeSelectMany())
        assertEquals(companyIdEmpty, [])

        i = sync(connection
            .insertInto(tCompany)
            .values({ name: 'FOO' })
            .executeInsert())
        assertEquals(i, 1)

        i = sync(connection
            .insertInto(tCustomer)
            .values({ firstName: 'John', lastName: 'Smith', companyId: 1 })
            .returningLastInsertedId()
            .executeInsert())
        assertEquals(i, 1)

        i = sync(connection
            .insertInto(tCustomer)
            .values({ firstName: 'Other', lastName: 'Person', companyId: 1 })
            .returningLastInsertedId()
            .executeInsert())
        assertEquals(i, 2)

        i = sync(connection
            .insertInto(tCustomer)
            .values({ firstName: 'Jane', lastName: 'Doe', companyId: 1 })
            .returningLastInsertedId()
            .executeInsert())
        assertEquals(i, 3)

        let company = sync(connection
            .selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name
            })
            .executeSelectOne())
        assertEquals(company, { id: 1, name: 'ACME' })

        let companies = sync(connection
            .selectFrom(tCompany)
            .select({
                id: tCompany.id,
                name: tCompany.name
            })
            .orderBy('id')
            .executeSelectMany())
        assertEquals(companies, [{ id: 1, name: 'ACME' }, { id: 2, name: 'FOO' }])

        let name = sync(connection
            .selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .selectOneColumn(tCompany.name)
            .executeSelectOne())
        assertEquals(name, 'ACME')

        let names = sync(connection
            .selectFrom(tCompany)
            .selectOneColumn(tCompany.name)
            .orderBy('result')
            .executeSelectMany())
        assertEquals(names, ['ACME', 'FOO'])

        i = sync(connection
            .insertInto(tCompany)
            .from(
                connection
                .selectFrom(tCompany)
                .select({
                    name: tCompany.name.concat(' 2')
                })
            )
            .executeInsert())
        assertEquals(i, 2)

        names = sync(connection
            .selectFrom(tCompany)
            .selectOneColumn(tCompany.name)
            .orderBy('result')
            .executeSelectMany())
        assertEquals(names, ['ACME', 'ACME 2', 'FOO', 'FOO 2'])

        const fooComanyNameLength = connection
            .selectFrom(tCompany)
            .selectOneColumn(tCompany.name.length())
            .where(tCompany.id.equals(2))
            .forUseAsInlineQueryValue()

        companies = sync(connection
            .selectFrom(tCompany)
            .select({
                id: tCompany.id,
                name: tCompany.name
            })
            .where(tCompany.name.length().greaterThan(fooComanyNameLength))
            .orderBy('id')
            .executeSelectMany())
        assertEquals(companies, [{ id: 1, name: 'ACME' },{ id: 3, name: 'ACME 2' }, { id: 4, name: 'FOO 2'}])

        i = sync(connection
            .update(tCompany)
            .set({
                name: tCompany.name.concat(tCompany.name)
            })
            .where(tCompany.id.equals(2))
            .executeUpdate())
        assertEquals(i, 1)

        name = sync(connection
            .selectFrom(tCompany)
            .where(tCompany.id.equals(2))
            .selectOneColumn(tCompany.name)
            .executeSelectOne())
        assertEquals(name, 'FOOFOO')

        i = sync(connection
            .deleteFrom(tCompany)
            .where(tCompany.id.equals(2))
            .executeDelete())
        assertEquals(i, 1)

        let maybe = sync(connection
            .selectFrom(tCompany)
            .where(tCompany.id.equals(2))
            .selectOneColumn(tCompany.name)
            .executeSelectNoneOrOne())
        assertEquals(maybe, null)

        let page = sync(connection
            .selectFrom(tCustomer)
            .select({
                id: tCustomer.id,
                name: tCustomer.firstName.concat(' ').concat(tCustomer.lastName)
            })
            .orderBy('id')
            .limit(2)
            .executeSelectPage())
        assertEquals(page, {
            count: 3,
            data: [
                { id: 1, name: 'John Smith' },
                { id: 2, name: 'Other Person' }
            ]
        })

        const customerCountPerCompanyWith = connection.selectFrom(tCompany)
            .innerJoin(tCustomer).on(tCustomer.companyId.equals(tCompany.id))
            .select({
                companyId: tCompany.id,
                companyName: tCompany.name,
                endsWithME: tCompany.name.endsWithInsensitive('me'),
                customerCount: connection.count(tCustomer.id)
            }).groupBy('companyId', 'companyName', 'endsWithME')
            .forUseInQueryAs('customerCountPerCompany')

        const customerCountPerAcmeCompanies = sync(connection.selectFrom(customerCountPerCompanyWith)
            .where(customerCountPerCompanyWith.companyName.containsInsensitive('ACME'))
            .select({
                acmeCompanyId: customerCountPerCompanyWith.companyId,
                acmeCompanyName: customerCountPerCompanyWith.companyName,
                acmeEndsWithME: customerCountPerCompanyWith.endsWithME,
                acmeCustomerCount: customerCountPerCompanyWith.customerCount
            })
            .executeSelectMany())
        assertEquals(customerCountPerAcmeCompanies, [
            { acmeCompanyId: 1, acmeCompanyName: 'ACME', acmeEndsWithME: true, acmeCustomerCount: 3 }
        ])

        const aggregatedCustomersOfAcme = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .selectOneColumn(connection.aggregateAsArray({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            }))
            .forUseAsInlineQueryValue()

        const acmeCompanyWithCustomers = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme
            })
            .executeSelectOne())
        acmeCompanyWithCustomers.customers!.sort((a, b) => {
            return a.id - b.id
        })
        assertEquals(acmeCompanyWithCustomers, {
            id: 1,
            name: 'ACME',
            customers: [
                { id: 1, firstName: 'John', lastName: 'Smith' },
                { id: 2, firstName: 'Other', lastName: 'Person' },
                { id: 3, firstName: 'Jane', lastName: 'Doe' }
            ]
        })

        const tCustomerLeftJoin = tCustomer.forUseInLeftJoin()
        const acmeCompanyWithCustomers2 = sync(connection.selectFrom(tCompany).leftJoin(tCustomerLeftJoin).on(tCustomerLeftJoin.companyId.equals(tCompany.id))
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: connection.aggregateAsArray({
                    id: tCustomerLeftJoin.id,
                    firstName: tCustomerLeftJoin.firstName,
                    lastName: tCustomerLeftJoin.lastName
                }).useEmptyArrayForNoValue()
            })
            .groupBy('id')
            .executeSelectOne())
        acmeCompanyWithCustomers2.customers!.sort((a, b) => {
            return a.id - b.id
        })
        assertEquals(acmeCompanyWithCustomers2, {
            id: 1,
            name: 'ACME',
            customers: [
                { id: 1, firstName: 'John', lastName: 'Smith' },
                { id: 2, firstName: 'Other', lastName: 'Person' },
                { id: 3, firstName: 'Jane', lastName: 'Doe' }
            ]
        })

        const aggregatedCustomersOfAcme3 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .selectOneColumn(connection.aggregateAsArrayOfOneColumn(tCustomer.firstName.concat(' ').concat(tCustomer.lastName)))
            .forUseAsInlineQueryValue()

        const acmeCompanyWithCustomers3 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme3.useEmptyArrayForNoValue()
            })
            .executeSelectOne())
        acmeCompanyWithCustomers3.customers.sort()
        assertEquals(acmeCompanyWithCustomers3, {
            id: 1,
            name: 'ACME',
            customers: [
                'Jane Doe',
                'John Smith',
                'Other Person'
            ]
        })

        const aggregatedCustomersOfAcme4 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .select({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            })
            .forUseAsInlineAggregatedArrayValue()

        const acmeCompanyWithCustomers4 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme4
            })
            .executeSelectOne())
        acmeCompanyWithCustomers4.customers!.sort((a, b) => {
            return a.id - b.id
        })
        assertEquals(acmeCompanyWithCustomers4, {
            id: 1,
            name: 'ACME',
            customers: [
                { id: 1, firstName: 'John', lastName: 'Smith' },
                { id: 2, firstName: 'Other', lastName: 'Person' },
                { id: 3, firstName: 'Jane', lastName: 'Doe' }
            ]
        })

        const aggregatedCustomersOfAcme5 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .select({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            })
            .orderBy('id')
            .forUseAsInlineAggregatedArrayValue()

        const acmeCompanyWithCustomers5 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme5
            })
            .executeSelectOne())
        assertEquals(acmeCompanyWithCustomers5, {
            id: 1,
            name: 'ACME',
            customers: [
                { id: 1, firstName: 'John', lastName: 'Smith' },
                { id: 2, firstName: 'Other', lastName: 'Person' },
                { id: 3, firstName: 'Jane', lastName: 'Doe' }
            ]
        })

        const aggregatedCustomersOfAcme6 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .selectOneColumn(tCustomer.firstName.concat(' ').concat(tCustomer.lastName))
            .forUseAsInlineAggregatedArrayValue()

        const acmeCompanyWithCustomers6 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme6.useEmptyArrayForNoValue()
            })
            .executeSelectOne())
        acmeCompanyWithCustomers6.customers.sort()
        assertEquals(acmeCompanyWithCustomers6, {
            id: 1,
            name: 'ACME',
            customers: [
                'Jane Doe',
                'John Smith',
                'Other Person'
            ]
        })

        const aggregatedCustomersOfAcme7 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .selectOneColumn(tCustomer.firstName.concat(' ').concat(tCustomer.lastName))
            .orderBy('result')
            .forUseAsInlineAggregatedArrayValue()

        const acmeCompanyWithCustomers7 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme7.useEmptyArrayForNoValue()
            })
            .executeSelectOne())
        assertEquals(acmeCompanyWithCustomers7, {
            id: 1,
            name: 'ACME',
            customers: [
                'Jane Doe',
                'John Smith',
                'Other Person'
            ]
        })

        const aggregatedCustomersOfAcme8 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .select({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            }).union(
                connection.subSelectUsing(tCompany).from(tCustomer)
                .where(tCustomer.companyId.equals(tCompany.id))
                .select({
                    id: tCustomer.id,
                    firstName: tCustomer.firstName,
                    lastName: tCustomer.lastName
                })
            )
            .forUseAsInlineAggregatedArrayValue()

        const acmeCompanyWithCustomers8 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme8
            })
            .executeSelectOne())
        acmeCompanyWithCustomers8.customers!.sort((a, b) => {
            return a.id - b.id
        })
        assertEquals(acmeCompanyWithCustomers8, {
            id: 1,
            name: 'ACME',
            customers: [
                { id: 1, firstName: 'John', lastName: 'Smith' },
                { id: 2, firstName: 'Other', lastName: 'Person' },
                { id: 3, firstName: 'Jane', lastName: 'Doe' }
            ]
        })

        const aggregatedCustomersOfAcme9 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .select({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            }).union(
                connection.subSelectUsing(tCompany).from(tCustomer)
                .where(tCustomer.companyId.equals(tCompany.id))
                .select({
                    id: tCustomer.id,
                    firstName: tCustomer.firstName,
                    lastName: tCustomer.lastName
                })
            ).orderBy('id')
            .forUseAsInlineAggregatedArrayValue()

        const acmeCompanyWithCustomers9 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme9
            })
            .executeSelectOne())
        assertEquals(acmeCompanyWithCustomers9, {
            id: 1,
            name: 'ACME',
            customers: [
                { id: 1, firstName: 'John', lastName: 'Smith' },
                { id: 2, firstName: 'Other', lastName: 'Person' },
                { id: 3, firstName: 'Jane', lastName: 'Doe' }
            ]
        })

        const aggregatedCustomersOfAcme10 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .selectOneColumn(tCustomer.firstName.concat(' ').concat(tCustomer.lastName))
            .union(
                connection.subSelectUsing(tCompany).from(tCustomer)
                .where(tCustomer.companyId.equals(tCompany.id))
                .selectOneColumn(tCustomer.firstName.concat(' ').concat(tCustomer.lastName))
            )
            .forUseAsInlineAggregatedArrayValue()

        const acmeCompanyWithCustomers10 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme10.useEmptyArrayForNoValue()
            })
            .executeSelectOne())
        acmeCompanyWithCustomers10.customers.sort()
        assertEquals(acmeCompanyWithCustomers10, {
            id: 1,
            name: 'ACME',
            customers: [
                'Jane Doe',
                'John Smith',
                'Other Person'
            ]
        })

        const aggregatedCustomersOfAcme11 = connection.subSelectUsing(tCompany).from(tCustomer)
            .where(tCustomer.companyId.equals(tCompany.id))
            .selectOneColumn(tCustomer.firstName.concat(' ').concat(tCustomer.lastName))
            .union(
                connection.subSelectUsing(tCompany).from(tCustomer)
                .where(tCustomer.companyId.equals(tCompany.id))
                .selectOneColumn(tCustomer.firstName.concat(' ').concat(tCustomer.lastName))
            ).orderBy('result')
            .forUseAsInlineAggregatedArrayValue()

        const acmeCompanyWithCustomers11 = sync(connection.selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .select({
                id: tCompany.id,
                name: tCompany.name,
                customers: aggregatedCustomersOfAcme11.useEmptyArrayForNoValue()
            })
            .executeSelectOne())
        assertEquals(acmeCompanyWithCustomers11, {
            id: 1,
            name: 'ACME',
            customers: [
                'Jane Doe',
                'John Smith',
                'Other Person'
            ]
        })

        i = sync(connection.increment(10))
        assertEquals(i, 11)

        sync(connection.appendToAllCompaniesName(' Cia.'))

        name = sync(connection
            .selectFrom(tCompany)
            .where(tCompany.id.equals(1))
            .selectOneColumn(tCompany.name)
            .executeSelectOne())
        assertEquals(name, 'ACME Cia.')

        let ii = sync(connection
            .insertInto(tCompany)
            .from(
                connection
                .selectFrom(tCompany)
                .select({
                    name: tCompany.name.concat(' 3')
                })
            )
            .returningLastInsertedId()
            .executeInsert())
        assertEquals(ii, [5, 6, 7])

        const updatedSmithFirstName = sync(connection.update(tCustomer)
            .set({
                firstName: 'Ron'
            })
            .where(tCustomer.id.equals(1))
            .returningOneColumn(tCustomer.firstName)
            .executeUpdateOne())
        assertEquals(updatedSmithFirstName, 'Ron')

        const deletedCustomers = sync(connection.deleteFrom(tCustomer)
            .where(tCustomer.id.greaterOrEquals(2))
            .returning({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            })
            .executeDeleteMany())
        deletedCustomers.sort((a, b) => {
            return a.id - b.id
        })
        assertEquals(deletedCustomers, [{ id: 2, firstName: 'Other', lastName: 'Person' }, { id:3, firstName: 'Jane', lastName: 'Doe' } ])

        let insertOneCustomers = sync(connection
            .insertInto(tCustomer)
            .values({ firstName: 'Other', lastName: 'Person', companyId: 1 })
            .returning({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            })
            .executeInsertOne())
        assertEquals(insertOneCustomers, { id: 4, firstName: 'Other', lastName: 'Person' })

        const insertMultipleCustomers = sync(connection
            .insertInto(tCustomer)
            .values([
                { firstName: 'Other 2', lastName: 'Person 2', companyId: 1 },
                { firstName: 'Other 3', lastName: 'Person 3', companyId: 1 }
            ])
            .returning({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            })
            .executeInsertMany())
        assertEquals(insertMultipleCustomers, [ { id: 5, firstName: 'Other 2', lastName: 'Person 2' }, { id: 6, firstName: 'Other 3', lastName: 'Person 3' }])

        insertOneCustomers = sync(connection
            .insertInto(tCustomer)
            .from(
                connection
                .selectFrom(tCustomer)
                .select({
                    firstName: tCustomer.firstName.concat(' 2'),
                    lastName: tCustomer.lastName.concat(' 2'),
                    companyId: tCustomer.companyId
                })
                .where(tCustomer.id.equals(1))
            )
            .returning({
                id: tCustomer.id,
                firstName: tCustomer.firstName,
                lastName: tCustomer.lastName
            })
            .executeInsertOne())
        assertEquals(insertOneCustomers, { id: 7, firstName: 'Ron 2', lastName: 'Smith 2' })

        i = sync(connection.update(tCustomer)
            .from(tCompany)
            .set({
                lastName: tCustomer.lastName.concat(' - ').concat(tCompany.name)
            })
            .where(tCustomer.companyId.equals(tCompany.id))
            .and(tCustomer.id.equals(1))
            .executeUpdate())
        assertEquals(i, 1)

        const companiesIds = sync(connection.insertInto(tCompany)
            .values([
                {name: 'Top Company'},
                {name: 'Mic Company', parentId: 8},
                {name: 'Low Company', parentId: 9}
            ])
            .returningLastInsertedId()
            .executeInsert())
        assertEquals(companiesIds, [8, 9, 10])

        const parentCompany = tCompany.as('parentCompany')

        const parentCompanies = connection.subSelectUsing(tCompany)
            .from(parentCompany)
            .select({
                id: parentCompany.id,
                name: parentCompany.name,
                parentId: parentCompany.parentId
            })
            .where(parentCompany.id.equals(tCompany.parentId))
            .recursiveUnionAllOn((child) => {
                return child.parentId.equals(parentCompany.id)
            })
            .forUseAsInlineAggregatedArrayValue()

        const lowCompany = sync(connection.selectFrom(tCompany)
            .select({
                id: tCompany.id,
                name: tCompany.name,
                parentId: tCompany.parentId,
                parents: parentCompanies
            })
            .where(tCompany.id.equals(10))
            .executeSelectOne())
        assertEquals(lowCompany, { id: 10, name: 'Low Company', parentId: 9, parents: [{ id: 9, name: 'Mic Company', parentId: 8 }, { id: 8, name: 'Top Company' }] })

        const parentCompanies2 = connection.selectFrom(parentCompany)
            .select({
                id: parentCompany.id,
                name: parentCompany.name,
                parentId: parentCompany.parentId
            })
            .where(parentCompany.id.equals(9))
            .recursiveUnionAllOn((child) => {
                return child.parentId.equals(parentCompany.id)
            })
            .forUseAsInlineAggregatedArrayValue()

        const lowCompany2 = sync(connection.selectFrom(tCompany)
            .select({
                id: tCompany.id,
                name: tCompany.name,
                parentId: tCompany.parentId,
                parents: parentCompanies2
            })
            .where(tCompany.id.equals(10))
            .executeSelectOne())
        assertEquals(lowCompany2, { id: 10, name: 'Low Company', parentId: 9, parents: [{ id: 9, name: 'Mic Company', parentId: 8 }, { id: 8, name: 'Top Company' }] })

        const lowCompany3 = sync(connection.selectFrom(tCompany)
            .select({
                id: tCompany.id,
                name: tCompany.name,
                parentId: tCompany.parentId
            })
            .where(tCompany.id.equals(10))
            .composeDeletingInternalProperty({
                externalProperty: 'parentId',
                internalProperty: 'startId',
                propertyName: 'parents'
            }).withMany((ids) => {
                return connection.selectFrom(parentCompany)
                    .select({
                        id: parentCompany.id,
                        name: parentCompany.name,
                        parentId: parentCompany.parentId,
                        startId: parentCompany.id
                    })
                    .where(parentCompany.id.in(ids))
                    .recursiveUnionAll((child) => {
                        return connection.selectFrom(parentCompany)
                            .join(child).on(child.parentId.equals(parentCompany.id))
                            .select({
                                id: parentCompany.id,
                                name: parentCompany.name,
                                parentId: parentCompany.parentId,
                                startId: child.startId
                            })
                    })
                    .executeSelectMany()
            })
            .executeSelectOne())
        assertEquals(lowCompany3, { id: 10, name: 'Low Company', parentId: 9, parents: [{ id: 9, name: 'Mic Company', parentId: 8 }, { id: 8, name: 'Top Company' }] })

        i = sync(connection.insertInto(tRecord).values({
                id: '89bf68fc-7002-11ec-90d6-0242ac120003',
                title: 'My voice memo'
            }).executeInsert())
        assertEquals(i, 1)

        const record = sync(connection.selectFrom(tRecord)
            .select({
                id: tRecord.id,
                title: tRecord.title
            })
            .where(tRecord.id.asString().contains('7002'))
            .executeSelectOne())
        assertEquals(record, { id: '89bf68fc-7002-11ec-90d6-0242ac120003', title: 'My voice memo' })

        const date = new Date('2022-11-21T19:33:56.123Z')
        const dateValue = connection.const(date, 'localDateTime')
        const dateValidation = sync(connection
            .selectFromNoTable()
            .select({
                fullYear: dateValue.getFullYear(),
                month: dateValue.getMonth(),
                date: dateValue.getDate(),
                day: dateValue.getDay(),
                hours: dateValue.getHours(),
                minutes: dateValue.getMinutes(),
                second: dateValue.getSeconds(),
                milliseconds: dateValue.getMilliseconds(),
                time: dateValue.getTime(),
                dateValue: dateValue,
            })
            .executeSelectOne())
        assertEquals(dateValidation, {
            fullYear: date.getUTCFullYear(),
            month: date.getUTCMonth(),
            date: date.getUTCDate(),
            day: date.getUTCDay(),
            hours: date.getUTCHours(),
            minutes: date.getUTCMinutes(),
            second: date.getUTCSeconds(),
            milliseconds: date.getUTCMilliseconds(),
            time: date.getTime(),
            dateValue: date,
        })

        class VCustomerForUpdate extends Values<DBConnection, 'customerForUpdate'> {
            id = this.column('int')
            firstName = this.column('string')
            lastName = this.column('string')
        }
        const customerForUpdate = Values.create(VCustomerForUpdate, 'customerForUpdate', [{
            id: 100,
            firstName: 'First Name',
            lastName: 'Last Name'
        }])
        
        i = sync(connection.update(tCustomer)
            .from(customerForUpdate)
            .set({
                firstName: customerForUpdate.firstName,
                lastName: customerForUpdate.lastName
            })
            .where(tCustomer.id.equals(customerForUpdate.id))
            .executeUpdate())
        assertEquals(i, 0)
    
        // class VCustomerForDelete extends Values<DBConnection, 'customerForDelete'> {
        //     firstName = this.column('string')
        //     lastName = this.column('string')
        // }
        // const customerForDelete = Values.create(VCustomerForDelete, 'customerForDelete', [{
        //     firstName: 'First Name',
        //     lastName: 'Last Name'
        // }])
        
        // i = sync(connection.deleteFrom(tCustomer)
        //     .using(customerForDelete)
        //     .where(tCustomer.firstName.equals(customerForDelete.firstName))
        //     .and(tCustomer.lastName.equals(customerForDelete.lastName))
        //     .executeDelete())
        // assertEquals(i, 0)

        sync(connection.commit())
    } catch(e) {
        sync(connection.rollback())
        throw e
    }
}

async function run() {
    // @ts-ignore // TODO: find a better way to impòrt node version
    const {default: sqlite3InitModule} = await import('../../node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3-node.mjs')
    try {
        const sqlite3 = await sqlite3InitModule();
        const db: Database = new sqlite3.oo1.DB();
        // db.createFunction('uuid', _ => uuidv4())
        // db.createFunction('uuid_str', (_context, blob: any) => fromBinaryUUID(blob))
        // db.createFunction('uuid_blob', (_context, str: any) => toBinaryUUID(str))
        await main(db);
        console.log('All ok');
        process.exit(0);
    } catch(e) {
        console.error(e)
        process.exit(1)
    }
}
if (Number(process.versions.node.split('.')[0]) < 16) {
    console.log('skiping due old node version')
} else {
    run()
}

/**
 * This function unwraps the synchronous promise in a synchronous way,
 * returning the result.
 */
function sync<T>(promise: Promise<T>): T {
    const UNSET = Symbol('unset');

    let result: T | typeof UNSET = UNSET;
    let error: unknown | typeof UNSET = UNSET;

    promise.then(
        (r) => (result = r),
        (e) => (error = e),
    );

    // Propagate error, if available
    if (error !== UNSET) {
        throw error;
    }

    // Propagate result, if available
    if (result !== UNSET) {
        return result;
    }

    // Note: This wrapper is to be used in combination with the `SynchronousPromise` type,
    // which is not strictly Promise-spec-compliant because it does not defer when calling
    // `.then`. See https://www.npmjs.com/package/synchronous-promise for more details.
    // To ensure that we're indeed using a synchronous promise, ensure that the promise resolved
    // immediately.
    throw new Error(
        'You performed a real async operation, not a database operation, ' +
            'inside the function dedicated to calling the database',
    );
}
import { Pool } from 'pg';

export class Database {

	private static readonly _pool: Pool | undefined = new Pool({
			host: 'database',
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			database: process.env.POSTGRES_DB,
			port: 5432,
			idleTimeoutMillis: 30000,
		});

	public async addOne(table: string, columns: Object): Promise<Object> {
		let query = `INSERT INTO ${table} (${Object.keys(columns).map((v) => {return `"${v}"`})}) VALUES (${Object.values(columns).map((v) => {return `'${v}'`})});`;
		try {
			await Database._pool.query(query);
			return await this.getFirstRow(table, [], columns);
		} catch (e) {
			throw (e);
		}
	}

	public async getRows(table: string, columns?: Array<string>, where?: Object): Promise<Object[]> {
		let whereString: undefined | string = this.createWhere(where);

		let query = `SELECT ${columns ? columns.map((v) => {return `"${v}"`}) : '*'} FROM ${table} ${whereString ?? ''}`;
		let result = await Database._pool.query(query);

		return result.rows;
	}

	private async getRelations(object: Array<Object> | Object, relations: Object): Promise<Object> {

		let keys = Object.keys(relations);
		let values: Object[] = Object.values(relations);

		if (keys.length === 0) return object;

		if (Array.isArray(object)) {
			for (let obj in object) {
				for (let i = 0; i < keys.length; i++) {
					let col = Object.keys(values)[0];
					let val = Object.values(values)[0];
					let where = {};
					where[`${val}`] = obj[`${col}`]; 
					obj[`${keys[i]}`] = await this.getFirstRow(keys[i], [], where);
				}
			}
		} else {
			for (let i = 0; i < keys.length; i++) {
				let rel = Object.values(values)[0];
				let col = Object.keys(rel)[0];
				let val = Object.values(rel)[0];
				let where = {};
				console.log(col, val, object);
				where[`${val}`] = object[`${col}`]; 
				object[`${keys[i]}`] = await this.getFirstRow(keys[i], [], where);
			}
		}

		return object;
	}

	private createWhere(object: Object): string | undefined {
		if (!object)
			return undefined;

		let keys = Object.keys(object);
		let values = Object.values(object);

		if (keys.length === 0)
			return undefined

		let rv = "WHERE ";

		for (let i = 0; i < keys.length; i++)
		{
			rv += `"${keys[i]}"='${values[i]}'`;
			if ( i != keys.length - 1 )
				rv += ' AND ';
		}

		return rv;
	}

	private createSet(object: Object): string | undefined {
		if (!object)
			return undefined;

		let keys = Object.keys(object);
		let values = Object.values(object);

		if (keys.length === 0)
			return undefined

		let rv = "SET ";

		for (let i = 0; i < keys.length; i++)
		{
			rv += `"${keys[i]}"='${values[i]}'`;
			if ( i != keys.length - 1 )
				rv += ', ';
		}

		return rv;
	}

	public async getFirstRow(table: string, columns?: Array<string>, where?: Object, relations?: Object): Promise<Object> {

		let whereString: undefined | string = this.createWhere(where);

		let query = `SELECT ${columns && columns.length ? columns.map((v) => {return `"${v}"`}) : '*'} FROM ${table} ${whereString ?? ''};`;
		let result = await Database._pool.query(query);

		if (relations && result.rows.length > 0)
			return await this.getRelations(result.rows[0], relations);

		return result.rows[0];
	}

	public async deleteRows(table:string, where: Object): Promise<Object> {
		let whereString: undefined | string = this.createWhere(where);

		if (!whereString)
			throw 'where cannot be empty when deleting';

		let query = `DELETE FROM ${table} ${whereString};`;
		let result = await Database._pool.query(query);

		return result.rows;
	}

	public async updateRows(table: string, object: Object, where?: Object): Promise<Object> {

		let whereString: undefined | string = this.createWhere(where);
		let setString: undefined | string = this.createSet(object);

		if (!whereString) throw 'where cannot be empty when updating';
		if (!setString) throw 'object cannot be empty when updating';

		let query = `UPDATE ${table} ${setString} ${whereString};`;
		let result = await Database._pool.query(query);

		return result.rows;
	}
}

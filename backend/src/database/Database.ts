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

	public addOne(table: string, columns: Object): Object {
		let query = `INSERT INTO ${table} (${Object.keys(columns)}) VALUES (${Object.values(columns)})`;

		return Database._pool.query(query);
	}

	public async getRows(table: string, columns?: Array<string>): Promise<Object> {
		let query = `SELECT ${columns ? columns : '*'} FROM ${table}`;
		let result = await Database._pool.query(query);

		return result.rows;
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
			rv += `${keys[i]}='${values[i]}'`;
			if ( i != keys.length - 1 )
				rv += ' AND ';
		}

		return rv;
	}

	public async getFirstRow(table: string, columns?: Array<string>, where?: Object): Promise<Object> {
		
		let whereString: undefined | string = this.createWhere(where);

		let query = `SELECT ${columns ? columns : '*'} FROM ${table} ${whereString ?? ''}`;
		let result = await Database._pool.query(query);

		return result.rows[0];
	}
}

import { Pool } from 'pg';

export class Database {

	private static readonly _pool: Pool = new Pool({
			host: 'database',
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			database: process.env.POSTGRES_DB,
			port: 5432,
			idleTimeoutMillis: 30000,
		});

	private buildWhere(where?: Record<string, any>, startIndex: number = 1) {
		if (!where || Object.keys(where).length === 0) return { clause: '', values: [] as any[] };
		const keys = Object.keys(where);
		const values = Object.values(where);
		const parts = keys.map((k, i) => `"${k}"=$${startIndex + i}`);
		return { clause: `WHERE ${parts.join(' AND ')}`, values };
	}

	public async addOne(table: string, columns: Record<string, any>): Promise<any> {
		const keys = Object.keys(columns);
		const values = Object.values(columns);
		const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
		const text = `INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(',')}) VALUES (${placeholders}) RETURNING *;`;
		const result = await Database._pool.query(text, values);
		return result.rows[0];
	}

	public async getRows(table: string, columns?: Array<string>, where?: Record<string, any>): Promise<any[]> {
		const select = (columns && columns.length) ? columns.map(c => `"${c}"`).join(',') : '*';
		const { clause, values } = this.buildWhere(where);
		const text = `SELECT ${select} FROM ${table} ${clause}`;
		const result = await Database._pool.query(text, values);
		return result.rows;
	}

	private async getRelations(object: Array<any> | any, relations: Record<string, any>): Promise<any> {
		const keys = Object.keys(relations);
		if (keys.length === 0) return object;
		if (Array.isArray(object)) {
			for (const obj of object) {
				for (const key of keys) {
					const rel = relations[key];
					const col = Object.keys(rel)[0];
					const val = rel[col];
					const where: any = {}; where[`${val}`] = obj[`${col}`];
					obj[`${key}`] = await this.getFirstRow(key, [], where);
				}
			}
		} else {
			for (const key of keys) {
				const rel = relations[key];
				const col = Object.keys(rel)[0];
				const val = rel[col];
				const where: any = {}; where[`${val}`] = object[`${col}`];
				object[`${key}`] = await this.getFirstRow(key, [], where);
			}
		}
		return object;
	}

	public async getFirstRow(table: string, columns?: Array<string>, where?: Record<string, any>, relations?: Record<string, any>): Promise<any> {
		const select = (columns && columns.length) ? columns.map(c => `"${c}"`).join(',') : '*';
		const { clause, values } = this.buildWhere(where);
		const text = `SELECT ${select} FROM ${table} ${clause} LIMIT 1;`;
		const result = await Database._pool.query(text, values);
		if (relations && result.rows.length > 0)
			return await this.getRelations(result.rows[0], relations);
		return result.rows[0];
	}

	public async deleteRows(table: string, where: Record<string, any>): Promise<any> {
		const { clause, values } = this.buildWhere(where);
		if (!clause) throw new Error('where cannot be empty when deleting');
		const text = `DELETE FROM ${table} ${clause};`;
		const result = await Database._pool.query(text, values);
		return result.rows;
	}

	public async updateRows(table: string, object: Record<string, any>, where?: Record<string, any>): Promise<any> {
		const keys = Object.keys(object);
		if (keys.length === 0) throw new Error('object cannot be empty when updating');
		const setParts = keys.map((k, i) => `"${k}"=$${i + 1}`);
		const setValues = Object.values(object);
		const { clause, values } = this.buildWhere(where, setValues.length + 1);
		if (!clause) throw new Error('where cannot be empty when updating');
		const text = `UPDATE ${table} SET ${setParts.join(', ')} ${clause} RETURNING *;`;
		const result = await Database._pool.query(text, [...setValues, ...values]);
		return result.rows;
	}
}

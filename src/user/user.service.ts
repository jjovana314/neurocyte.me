import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Pool } from 'mysql2/promise';
import { config } from 'src/config/config';

@Injectable()
export class UserService {
  private pool: Pool;

  constructor() {
    this.pool = require('mysql2/promise').createPool({
      host: config.get().DATABASE_URL,
      user: config.get().DATABASE_USERNAME,
      password: config.get().DATABASE_PASSWORD,
      database: config.get().DATABASE_NAME
    });
  }

  async findUserByEmail(email: string) {
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  async validateUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }
}

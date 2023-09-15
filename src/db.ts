import { Model } from 'objection';
import { knex as Knex } from 'knex';
import knexConfig from './knexfile.js';

const knex = Knex(knexConfig.production!);

Model.knex(knex);
/*
#######################################################################
#
# Copyright (C) 2022-2026 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without
# the express written permission of the copyright holder.
#
#######################################################################
*/
/*
#######################################################################
#                   DO NOT MODIFY THIS FILE
#######################################################################
*/

import {it, beforeAll, afterAll, expect} from 'vitest';
import * as http from 'http'
import * as fs from 'fs'

import { app, bootstrap } from '../src/app'
import * as db from './db'

let server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>

beforeAll( async () => {
  server = http.createServer(app)
  server.listen()
  await bootstrap()
})

afterAll(() => {
  db.shutdown()
  server.close()
})

it('Generates expected GraphQL schema', async () => {
  const expected = fs.readFileSync('test/expected.gql')
  const generated = fs.readFileSync('build/schema.gql')
  expect(generated.equals(expected)).toBe(true)
})
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

import dotenv from 'dotenv'
dotenv.config()

import { app, bootstrap } from './app'

app.listen(4000, async () => {
  await bootstrap()
  console.log('Running a GraphQL Playground at http://localhost:4000/playground')
})
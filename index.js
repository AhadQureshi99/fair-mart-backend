import dotenv from 'dotenv'
dotenv.config()
import {app} from './app.js'
import { connectdb } from './db/dbconnection.js'

let port =process.env.PORT || 4000


connectdb()
.then(()=>{
    app.listen(port,'0.0.0.0',()=>{
        console.log(`Server is running at Port : ${port}`)
    })
}).catch((err)=>{
    console.log(`Mongodb connection error :${err}`)
})
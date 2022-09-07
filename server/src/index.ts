import { AppDataSource } from "./data-source"

AppDataSource.initialize().then(async () => {

    console.log("Initialize database...")

}).catch(error => console.log(error))

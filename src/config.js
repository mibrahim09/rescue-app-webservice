const Sequelize = require('sequelize');

var sequelize = new Sequelize({
    dialect: 'mssql',
    dialectOptions: {
        driver: 'SQL Server Native Client 11.0',
        instanceName: 'MSSQLSERVER',
        options: {
            encrypt: false,
            validateBulkLoadParameters: true
        }
        //   trustedConnection: true
    },
    username: 'root',
    password: '123456',
    host: 'localhost',
    database: 'winchdb'
});

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}


module.exports = {
    sequelizeSession: sequelize,
    testConn: testConnection
}

testConnection();